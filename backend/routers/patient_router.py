from fastapi import APIRouter, HTTPException
from database import get_db
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/mine")
async def get_my_patients(user_id: str):
    db = get_db()
    cursor = db.patients.find({"owner_user_id": user_id})
    patients = []
    async for p in cursor:
        p["_id"] = str(p["_id"])
        patients.append(p)
    return patients

@router.post("/")
async def add_patient(data: dict):
    db = get_db()
    data["created_at"] = datetime.utcnow()
    result = await db.patients.insert_one(data)
    return {"id": str(result.inserted_id), "message": "Patient added successfully"}

@router.put("/{patient_id}")
async def update_patient(patient_id: str, data: dict):
    db = get_db()
    data.pop("_id", None)
    # Convert age to int if it came as string
    if "age" in data and data["age"] is not None:
        try:
            data["age"] = int(data["age"])
        except:
            pass
    result = await db.patients.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient updated successfully"}

@router.delete("/{patient_id}")
async def delete_patient(patient_id: str):
    db = get_db()
    result = await db.patients.delete_one({"_id": ObjectId(patient_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully"}