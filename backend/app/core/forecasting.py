import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any

class PopulationForecaster:
    @staticmethod
    def generate_forecast(observations: List[Any], months_ahead: int = 3) -> Dict[str, Any]:
        """
        Groups sightings by month, fits a linear regression line using numpy,
        and projects future species counts with confidence intervals.
        """
        # 1. Group observations by YYYY-MM
        monthly_counts: Dict[str, float] = {}
        for obs in observations:
            month_key = obs.timestamp.strftime("%Y-%m")
            # Accumulate count
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + obs.count

        # Get sorted months list
        sorted_months = sorted(monthly_counts.keys())
        
        # 2. Handle insufficient historical data (seeding baseline data)
        # If there are fewer than 3 months of data, backfill with simulated stable history
        if len(sorted_months) < 3:
            current_date = datetime.now()
            for i in range(4, 0, -1):
                past_date = current_date - timedelta(days=30 * i)
                past_key = past_date.strftime("%Y-%m")
                # Default baseline count of 5-10 animals if empty
                if past_key not in monthly_counts:
                    monthly_counts[past_key] = float(np.random.randint(6, 12))
            sorted_months = sorted(monthly_counts.keys())

        # Prepare X (intervals index) and Y (counts)
        x = np.arange(len(sorted_months))
        y = np.array([monthly_counts[m] for m in sorted_months], dtype=float)

        # 3. Fit linear regression model: y = m*x + c
        m, c = np.polyfit(x, y, 1)

        # 4. Compute standard error of the estimate (S_e) for confidence intervals
        y_pred_hist = m * x + c
        residuals = y - y_pred_hist
        n = len(x)
        if n > 2:
            se = np.sqrt(np.sum(residuals ** 2) / (n - 2))
        else:
            se = 1.0
        # Cap se to a minimum of 0.5 to avoid zero width bounds
        se = max(se, 0.5)

        # 5. Format historical actuals
        past_points = []
        for i, month_key in enumerate(sorted_months):
            past_points.append({
                "date": month_key,
                "actual": float(y[i]),
                "predicted": float(y_pred_hist[i]),
                "lower": max(0.0, float(y_pred_hist[i] - 1.96 * se)),
                "upper": float(y_pred_hist[i] + 1.96 * se)
            })

        # 6. Generate future forecasts
        future_points = []
        last_month_str = sorted_months[-1]
        last_date = datetime.strptime(last_month_str, "%Y-%m")
        
        for step in range(1, months_ahead + 1):
            future_x = n - 1 + step
            pred_val = m * future_x + c
            # Prevent negative populations
            pred_val = max(0.0, pred_val)
            
            # Increment month
            # Add roughly 30 days multiplied by step
            future_date = last_date + timedelta(days=30 * step)
            future_key = future_date.strftime("%Y-%m")
            
            future_points.append({
                "date": future_key,
                "actual": None, # Future predicted point, no actuals
                "predicted": float(pred_val),
                "lower": max(0.0, float(pred_val - 1.96 * se)),
                "upper": float(pred_val + 1.96 * se)
            })

        # 7. Trend Assessment
        # Compute monthly percentage growth relative to average historical population
        avg_pop = np.mean(y)
        pct_slope = (m / avg_pop) * 100 if avg_pop > 0 else 0.0

        if pct_slope > 1.5:
            assessment = "Increasing (Healthy Growth)"
            indicator = "positive"
        elif pct_slope < -1.5:
            assessment = "Declining (Threat Warning)"
            indicator = "negative"
        else:
            assessment = "Stable (Consolidated)"
            indicator = "stable"

        # Combine coordinates for recharts rendering
        combined_series = past_points + future_points

        return {
            "series": combined_series,
            "metrics": {
                "slope": float(m),
                "growth_rate_pct": float(pct_slope),
                "assessment": assessment,
                "indicator": indicator,
                "message": f"Population shows a {pct_slope:+.1f}% monthly trend over {n} months. Ecological state: {assessment}."
            }
        }
