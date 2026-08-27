import os
import json
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.database.session import get_mongo_db

# Thread-safe in-memory alerts fallback log
IN_MEMORY_ALERTS: List[Dict[str, Any]] = []

async def trigger_telemetry_alert(alert_type: str, title: str, message: str, severity: str) -> Dict[str, Any]:
    """
    Triggers an automated telemetry warning alert. Stores it in the MongoDB telemetry collection,
    dispatches a Slack webhook alert (if configured), and falls back to an in-memory list if DB is down.
    """
    alert_id = os.urandom(8).hex() # dummy string ID for in-memory, will be overwritten by MongoDB ObjectId
    
    alert_doc = {
        "alert_type": alert_type, # "Security" | "Hardware" | "Ecological"
        "title": title,
        "message": message,
        "severity": severity,     # "Critical" | "Warning" | "Info"
        "is_read": False,
        "timestamp": datetime.now(timezone.utc)
    }

    # 1. Log to MongoDB or fallback in-memory
    db_saved = False
    try:
        db = get_mongo_db()
        if db is not None:
            # Save to MongoDB
            res = await db["telemetry_alerts"].insert_one(alert_doc)
            alert_doc["id"] = str(res.inserted_id)
            db_saved = True
            print(f"Alert successfully logged to MongoDB: {title}")
    except Exception as e:
        print(f"Warning: Failed to log alert to MongoDB: {e}. Falling back to in-memory store.")

    if not db_saved:
        # Save to local memory fallback
        alert_doc["id"] = alert_id
        IN_MEMORY_ALERTS.insert(0, alert_doc)
        # Cap in-memory history at 100 entries
        if len(IN_MEMORY_ALERTS) > 100:
            IN_MEMORY_ALERTS.pop()

    # 2. Dispatch Slack Webhook if configured
    slack_url = os.environ.get("SLACK_WEBHOOK_URL")
    if slack_url:
        print(f"Dispatching Slack Webhook alert: {title}")
        try:
            payload = {
                "text": f"🚨 *{severity.upper()} ALERT: {title}*\n{message}\n_Timestamp: {alert_doc['timestamp'].strftime('%Y-%m-%d %H:%M:%S UTC')}_"
            }
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                slack_url,
                data=req_data,
                headers={'Content-Type': 'application/json', 'User-Agent': 'FastAPI-Wildlife-Agent'}
            )
            # Perform POST request asynchronously in a threadpool (or synchronously since it's a short call)
            # For simplicity, do a quick sync call with timeout
            with urllib.request.urlopen(req, timeout=3.0) as response:
                response.read()
        except Exception as err:
            print(f"Warning: Failed to send Slack Webhook notification: {err}")

    # 3. Log to standard output console
    print(f"\n[ALERT DISPATCHED] severity={severity} type={alert_type} title={title} msg={message}\n")
    
    # Format return dictionary (make datetime JSON serializable)
    return {
        "id": alert_doc["id"],
        "alert_type": alert_doc["alert_type"],
        "title": alert_doc["title"],
        "message": alert_doc["message"],
        "severity": alert_doc["severity"],
        "is_read": alert_doc["is_read"],
        "timestamp": alert_doc["timestamp"].isoformat()
    }
