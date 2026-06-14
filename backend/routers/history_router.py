from fastapi import APIRouter, HTTPException
from database import get_db
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/patient/{patient_id}")
async def get_patient_history(patient_id: str):
    """Get full consultation history for one patient."""
    db = get_db()
    cursor = db.history.find({"patient_id": patient_id}).sort("date", -1)
    records = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        records.append(r)
    return records


@router.get("/user/{user_id}")
async def get_user_history(user_id: str):
    """Get consultation history for ALL patients under a user."""
    db = get_db()
    # First get all patient ids belonging to this user
    patient_ids = []
    async for p in db.patients.find({"owner_user_id": user_id}):
        patient_ids.append(str(p["_id"]))

    if not patient_ids:
        return []

    cursor = db.history.find({"patient_id": {"$in": patient_ids}}).sort("date", -1)
    records = []
    async for r in cursor:
        r["_id"] = str(r["_id"])
        records.append(r)
    return records


@router.post("/")
async def add_history(data: dict):
    """Add a consultation record. Called after appointment is completed."""
    data["created_at"] = datetime.utcnow()
    db = get_db()
    result = await db.history.insert_one(data)
    return {"id": str(result.inserted_id), "message": "History record added"}


@router.post("/seed/{user_id}")
async def seed_history(user_id: str):
    """Seeds dummy history data for testing. Needs patient ids from DB."""
    db = get_db()

    # Get patient ids for this user
    patients = []
    async for p in db.patients.find({"owner_user_id": user_id}):
        patients.append({"id": str(p["_id"]), "name": p["name"]})

    if not patients:
        raise HTTPException(status_code=400, detail="No patients found for this user. Add patients first.")

    count = await db.history.count_documents({"patient_id": patients[0]["id"]})
    if count > 0:
        return {"message": "History already seeded"}

    records = []
    if len(patients) > 0:
        records += [
            {"patient_id": patients[0]["id"], "patient_name": patients[0]["name"],
             "hospital": "Madurai Rajaji Government Hospital", "department": "Cardiology",
             "doctor": "Dr. R. Suresh Kumar", "date": "2025-05-12",
             "diagnosis": "Hypertension Stage 1", "prescription": "Amlodipine 5mg, Lifestyle changes",
             "notes": "BP: 150/90. Follow up in 3 months.", "owner_user_id": user_id},
            {"patient_id": patients[0]["id"], "patient_name": patients[0]["name"],
             "hospital": "Apollo Hospitals Madurai", "department": "Cardiology",
             "doctor": "Dr. Anil Sharma", "date": "2025-03-08",
             "diagnosis": "ECG Normal sinus rhythm", "prescription": "Routine checkup, no change",
             "notes": "All reports normal.", "owner_user_id": user_id},
        ]
    if len(patients) > 1:
        records += [
            {"patient_id": patients[1]["id"], "patient_name": patients[1]["name"],
             "hospital": "Madurai Rajaji Government Hospital", "department": "General Medicine",
             "doctor": "Dr. Anbu Selvan", "date": "2025-04-20",
             "diagnosis": "Type 2 Diabetes follow-up", "prescription": "Metformin 500mg, Diet control",
             "notes": "HbA1c: 7.2. Control improving.", "owner_user_id": user_id},
        ]

    if records:
        await db.history.insert_many(records)

    return {"message": f"Seeded {len(records)} history records", "count": len(records)}


# ── Regular Visits ────────────────────────────────────────────────────────────

@router.get("/regular/{user_id}")
async def get_regular_visits(user_id: str):
    """Get all regular visit schedules for a user."""
    db = get_db()
    cursor = db.regular_visits.find({"owner_user_id": user_id})
    visits = []
    async for v in cursor:
        v["_id"] = str(v["_id"])
        visits.append(v)
    return visits


@router.post("/regular")
async def add_regular_visit(data: dict):
    """Add a regular visit schedule."""
    data["created_at"] = datetime.utcnow()
    db = get_db()
    result = await db.regular_visits.insert_one(data)
    return {"id": str(result.inserted_id), "message": "Regular visit added"}


@router.put("/regular/{visit_id}/reminder")
async def toggle_reminder(visit_id: str, data: dict):
    """Toggle reminder on/off for a regular visit."""
    db = get_db()
    result = await db.regular_visits.update_one(
        {"_id": ObjectId(visit_id)},
        {"$set": {"reminder": data.get("reminder", False)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Reminder updated"}


@router.delete("/regular/{visit_id}")
async def delete_regular_visit(visit_id: str):
    """Delete a regular visit schedule."""
    db = get_db()
    result = await db.regular_visits.delete_one({"_id": ObjectId(visit_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Regular visit deleted"}


@router.post("/regular/seed/{user_id}")
async def seed_regular_visits(user_id: str):
    """Seeds dummy regular visit data for testing."""
    db = get_db()
    count = await db.regular_visits.count_documents({"owner_user_id": user_id})
    if count > 0:
        return {"message": "Already seeded"}

    visits = [
        {"owner_user_id": user_id, "hospital": "Madurai Rajaji Government Hospital",
         "department": "Cardiology", "doctor": "Dr. R. Suresh Kumar",
         "frequency": "Every 3 months", "next_date": "2025-09-12", "reminder": True},
        {"owner_user_id": user_id, "hospital": "Madurai Rajaji Government Hospital",
         "department": "General Medicine", "doctor": "Dr. Anbu Selvan",
         "frequency": "Every 6 months", "next_date": "2025-10-20", "reminder": False},
    ]
    await db.regular_visits.insert_many(visits)
    return {"message": "Regular visits seeded", "count": len(visits)}
