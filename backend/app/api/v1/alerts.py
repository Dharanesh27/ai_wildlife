from typing import List, Any
from fastapi import APIRouter, Depends, status, HTTPException
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.database.session import get_mongo_db
from app.core.notifications import IN_MEMORY_ALERTS

router = APIRouter()

# Authenticated users only
allow_all_authenticated = Depends(get_current_user)

def serialize_mongo_doc(doc: dict) -> dict:
    """Helper to convert MongoDB ObjectId to string id."""
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("timestamp"), datetime := type(None)):  # check type or convert to isoformat
        pass
    else:
        # Check if timestamp is a datetime object, convert to string
        if hasattr(doc.get("timestamp"), "isoformat"):
            doc["timestamp"] = doc["timestamp"].isoformat()
    return doc

@router.get("", response_model=List[Any])
async def list_alerts(
    current_user: User = allow_all_authenticated,
):
    """Retrieve all recent unread/read telemetry alerts."""
    db = get_mongo_db()
    if db is not None:
        try:
            cursor = db["telemetry_alerts"].find({}).sort("timestamp", -1).limit(50)
            alerts = []
            async for doc in cursor:
                alerts.append(serialize_mongo_doc(doc))
            return alerts
        except Exception as e:
            print(f"Failed to query MongoDB alerts: {e}. Falling back to in-memory.")
            
    # Fallback to in-memory list
    # Format datetimes in in-memory for JSON serializability
    formatted_alerts = []
    for alert in IN_MEMORY_ALERTS:
        item = alert.copy()
        if hasattr(item.get("timestamp"), "isoformat"):
            item["timestamp"] = item["timestamp"].isoformat()
        formatted_alerts.append(item)
    return formatted_alerts


@router.put("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    current_user: User = allow_all_authenticated,
):
    """Dismiss / mark a single alert as read."""
    db = get_mongo_db()
    dismissed = False
    
    if db is not None:
        from bson import ObjectId
        try:
            res = await db["telemetry_alerts"].update_one(
                {"_id": ObjectId(alert_id)},
                {"$set": {"is_read": True}}
            )
            if res.modified_count > 0 or res.matched_count > 0:
                dismissed = True
        except Exception as e:
            print(f"Failed to dismiss alert in MongoDB: {e}")

    if not dismissed:
        # Fallback to in-memory dismissal
        for alert in IN_MEMORY_ALERTS:
            if alert["id"] == alert_id:
                alert["is_read"] = True
                dismissed = True
                break
                
    if not dismissed:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return {"status": "success", "message": f"Alert {alert_id} dismissed."}


@router.put("/dismiss-all/clear")
async def dismiss_all_alerts(
    current_user: User = allow_all_authenticated,
):
    """Mark all active notifications as read."""
    db = get_mongo_db()
    cleared = False
    
    if db is not None:
        try:
            await db["telemetry_alerts"].update_many(
                {"is_read": False},
                {"$set": {"is_read": True}}
            )
            cleared = True
        except Exception as e:
            print(f"Failed to dismiss all alerts in MongoDB: {e}")

    # Clear in-memory as well
    for alert in IN_MEMORY_ALERTS:
        alert["is_read"] = True
        
    return {"status": "success", "message": "All alerts marked as read."}
