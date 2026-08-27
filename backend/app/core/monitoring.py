import numpy as np
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, List

class HabitatMonitoringService:
    @staticmethod
    def calculate_suitability(
        site_id: UUID,
        site_name: str,
        active_alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculates NDVI (Vegetation Canopy) and HSI (Habitat Suitability Index) 
        based on active security alerts and baseline geo-covariates.
        """
        name_lower = site_name.lower()
        
        # 1. Base NDVI (Vegetation index)
        # Wetlands have slightly different foliage density than scrub forests
        if "wetland" in name_lower or "marsh" in name_lower:
            base_ndvi = 0.78
            water_proximity = 0.95
        else:
            base_ndvi = 0.72
            water_proximity = 0.82

        # Add minor seasonal fluctuation to NDVI based on current month
        month = datetime.now().month
        seasonal_fluctuation = 0.05 * np.sin(2 * np.pi * (month - 6) / 12)
        ndvi = float(np.clip(base_ndvi + seasonal_fluctuation, 0.1, 0.95))

        # 2. Disturbance Index calculation
        # Count active unread poacher/security alerts
        security_alerts = [a for a in active_alerts if a.get("alert_type") == "Security" and not a.get("is_read", False)]
        disturbance = float(np.clip(0.05 + (0.25 * len(security_alerts)), 0.0, 0.95))

        # 3. HSI Formula: Geometric Mean of NDVI, Water, and (1 - Disturbance)
        hsi_value = float(np.cbrt(ndvi * water_proximity * (1.0 - disturbance)))
        hsi_score = float(round(hsi_value * 10.0, 2))

        # 4. Suitability Assessment Classification
        if hsi_score >= 7.5:
            assessment = "Optimal Habitat Corridor (Prime)"
            recommendation = "No intervention needed. Maintain current drone patrol grids."
            status_color = "positive"
        elif hsi_score >= 5.5:
            assessment = "Moderate Suitability Corridor"
            recommendation = "Foliage compaction detected. Advise monitoring water levels."
            status_color = "stable"
        else:
            assessment = "Degraded Ecosystem Sanctuary (Threat Alert)"
            recommendation = "High human disturbance detected. Reroute ground tactical patrols immediately."
            status_color = "negative"

        # 5. Generate historical NDVI data for Recharts trend
        ndvi_history = []
        for i in range(5, -1, -1):
            past_month = (month - i - 1) % 12 + 1
            past_fluctuation = 0.05 * np.sin(2 * np.pi * (past_month - 6) / 12)
            past_ndvi = float(np.clip(base_ndvi + past_fluctuation, 0.1, 0.95))
            ndvi_history.append({
                "month_idx": past_month,
                "month": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][past_month - 1],
                "ndvi": float(round(past_ndvi, 2))
            })

        return {
            "hsi_score": hsi_score,
            "ndvi": float(round(ndvi, 2)),
            "water_proximity": float(round(water_proximity, 2)),
            "disturbance": float(round(disturbance, 2)),
            "assessment": assessment,
            "recommendation": recommendation,
            "status_color": status_color,
            "ndvi_trend": ndvi_history
        }
