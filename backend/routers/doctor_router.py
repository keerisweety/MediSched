from fastapi import APIRouter, HTTPException
from database import get_db
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import auth

router = APIRouter(prefix="/doctors", tags=["Doctors"])

IST = timezone(timedelta(hours=5, minutes=30))

def ist_today():
    return datetime.now(IST).strftime("%Y-%m-%d")


@router.get("/profile/{user_id}")
async def get_doctor_profile(user_id: str):
    db = get_db()
    profile = await db.doctors.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    profile["_id"] = str(profile["_id"])
    return profile


@router.post("/profile")
async def save_doctor_profile(data: dict):
    db = get_db()
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    existing = await db.doctors.find_one({"user_id": user_id})
    if existing:
        data.pop("_id", None)
        await db.doctors.update_one({"user_id": user_id}, {"$set": data})
        return {"message": "Doctor profile updated"}
    else:
        data["created_at"] = datetime.utcnow()
        result = await db.doctors.insert_one(data)
        return {"id": str(result.inserted_id), "message": "Doctor profile created"}


@router.put("/shift/{user_id}")
async def update_shift(user_id: str, data: dict):
    db = get_db()
    shift_start = data.get("shift_start")
    shift_end = data.get("shift_end")
    if not shift_start or not shift_end:
        raise HTTPException(status_code=400, detail="shift_start and shift_end are required")
    result = await db.doctors.update_one(
        {"user_id": user_id},
        {"$set": {
            "shift_start": shift_start,
            "shift_end": shift_end,
            "shift_date": data.get("shift_date", ist_today())
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return {"message": "Shift updated successfully"}


@router.get("/schedule/{user_id}")
async def get_schedule(user_id: str, date: str = None):
    db = get_db()
    target_date = date or ist_today()
    cursor = db.appointments.find({
        "doctor_user_id": user_id,
        "appointment_date": target_date
    }).sort("appointment_time", 1)
    schedule = {
        "confirmed": [],
        "pending": [],
        "waiting": [],
        "completed": [],
        "cancelled": []
    }
    async for a in cursor:
        a["_id"] = str(a["_id"])
        status = a.get("status", "pending")
        if status in schedule:
            schedule[status].append(a)
    return {
        "date": target_date,
        "schedule": schedule,
        "total_attended": len(schedule["completed"]),
        "total_today": sum(len(v) for v in schedule.values())
    }


@router.put("/appoint/{appointment_id}")
async def appoint_patient(appointment_id: str):
    db = get_db()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "confirmed"}}
    )
    user = await db.users.find_one({"_id": ObjectId(appt["booked_by_user_id"])})
    if user and user.get("email"):
        subject = "MediSched - Appointment Confirmed"
        body = (
            "Dear " + user["name"] + ",\n\n"
            "Your appointment has been confirmed.\n"
            "Doctor: " + appt.get("doctor_name", "") + "\n"
            "Date: " + appt.get("appointment_date", "") + "\n"
            "Time: " + appt.get("appointment_time", "") + "\n"
            "Token: " + appt.get("token_number", "") + "\n\n"
            "Please arrive 15 minutes early.\n\n"
            "- MediSched Global"
        )
        auth.send_notification_email(user["email"], subject, body)
    return {"message": "Patient appointed and notified"}


@router.put("/cancel/{appointment_id}")
async def cancel_appointment(appointment_id: str, data: dict = {}):
    db = get_db()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {
            "status": "cancelled",
            "cancel_reason": data.get("reason", "Cancelled by doctor")
        }}
    )
    user = await db.users.find_one({"_id": ObjectId(appt["booked_by_user_id"])})
    if user and user.get("email"):
        subject = "MediSched - Appointment Cancelled"
        body = (
            "Dear " + user["name"] + ",\n\n"
            "Your appointment has been cancelled.\n"
            "Doctor: " + appt.get("doctor_name", "") + "\n"
            "Date: " + appt.get("appointment_date", "") + "\n"
            "Reason: " + data.get("reason", "Cancelled by doctor") + "\n\n"
            "Please rebook at your convenience.\n\n"
            "- MediSched Global"
        )
        auth.send_notification_email(user["email"], subject, body)
    return {"message": "Appointment cancelled and patient notified"}


@router.put("/complete/{appointment_id}")
async def complete_appointment(appointment_id: str, data: dict = {}):
    db = get_db()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed"}}
    )
    patient = await db.patients.find_one({"_id": ObjectId(appt["patient_id"])})
    history_record = {
        "patient_id": appt["patient_id"],
        "patient_name": patient["name"] if patient else "",
        "owner_user_id": appt["booked_by_user_id"],
        "hospital": appt.get("hospital_name", ""),
        "department": appt.get("dept_name", ""),
        "doctor": appt.get("doctor_name", ""),
        "date": appt.get("appointment_date", ""),
        "diagnosis": data.get("diagnosis", ""),
        "prescription": data.get("prescription", ""),
        "notes": data.get("notes", ""),
        "appointment_id": appointment_id,
        "created_at": datetime.utcnow()
    }
    await db.history.insert_one(history_record)
    return {"message": "Appointment completed and history record created"}


@router.get("/history/{user_id}")
async def get_doctor_history(user_id: str, days: int = 30):
    db = get_db()
    cutoff = (datetime.now(IST) - timedelta(days=days)).strftime("%Y-%m-%d")
    cursor = db.appointments.find({
        "doctor_user_id": user_id,
        "status": "completed",
        "appointment_date": {"$gte": cutoff}
    }).sort("appointment_date", -1)
    records = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        records.append(a)
    grouped = {}
    for r in records:
        d = r["appointment_date"]
        if d not in grouped:
            grouped[d] = []
        grouped[d].append(r)
    return {"total": len(records), "days": days, "grouped": grouped, "records": records}


@router.post("/seed/{user_id}")
async def seed_doctor_profile(user_id: str):
    db = get_db()
    existing = await db.doctors.find_one({"user_id": user_id})
    if existing:
        return {"message": "Profile already exists"}
    profile = {
        "user_id": user_id,
        "name": "Dr. R. Suresh Kumar",
        "qualification": "MD, DM (Cardiology)",
        "experience_years": 18,
        "age": 48,
        "department": "Cardiology",
        "hospital_name": "Madurai Rajaji Government Hospital",
        "hospital_address": "Panagal Road, Madurai, Tamil Nadu 625020",
        "hospital_block": "Block A",
        "room_number": "Room 204",
        "registration_no": "TN-MED-20450",
        "shift_start": "08:00",
        "shift_end": "13:00",
        "shift_date": ist_today(),
        "created_at": datetime.utcnow()
    }
    result = await db.doctors.insert_one(profile)
    return {"id": str(result.inserted_id), "message": "Doctor profile seeded"}
