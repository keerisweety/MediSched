from fastapi import APIRouter, HTTPException
from database import get_db
from bson import ObjectId
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/book")
async def book_appointment(data: dict):
    db = get_db()
    count = await db.appointments.count_documents({
        "doctor_user_id": data.get("doctor_user_id"),
        "appointment_date": data.get("appointment_date"),
        "status": {"$in": ["pending", "confirmed"]}
    })
    token = "T-" + str(count + 1).zfill(2)
    data["token_number"] = token
    data["status"] = "pending"
    data["created_at"] = datetime.utcnow()
    result = await db.appointments.insert_one(data)
    return {"id": str(result.inserted_id), "token_number": token, "message": "Appointment booked successfully"}


@router.get("/mine")
async def get_my_appointments(user_id: str):
    db = get_db()
    cursor = db.appointments.find({"booked_by_user_id": user_id}).sort("created_at", -1)
    appointments = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        appointments.append(a)
    return appointments


@router.get("/doctor")
async def get_doctor_appointments(doctor_user_id: str, date: str = None):
    db = get_db()
    query = {"doctor_user_id": doctor_user_id}
    if date:
        query["appointment_date"] = date
    cursor = db.appointments.find(query).sort("appointment_time", 1)
    appointments = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        appointments.append(a)
    return appointments


@router.put("/{appointment_id}/status")
async def update_status(appointment_id: str, data: dict):
    db = get_db()
    new_status = data.get("status")
    if new_status not in ["pending", "confirmed", "waiting", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": new_status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": f"Status updated to {new_status}"}


@router.get("/registered-doctors")
async def get_registered_doctors():
    """Returns doctors who have completed their profile and are available today."""
    db = get_db()
    today_str = datetime.now(IST).strftime("%Y-%m-%d")
    doctors = []
    async for u in db.users.find({"role": "doctor"}):
        profile = await db.doctors.find_one({"user_id": str(u["_id"])})
        if not profile:
            continue
        shift_start = profile.get("shift_start", "") or ""
        shift_end   = profile.get("shift_end", "")   or ""
        has_shift   = bool(shift_start and shift_end)
        if not has_shift:
            continue
        existing = await db.appointments.count_documents({
            "doctor_user_id":  str(u["_id"]),
            "appointment_date": today_str,
            "status":          {"$in": ["pending", "confirmed", "waiting"]}
        })
        sh, sm = map(int, shift_start.split(":"))
        eh, em = map(int, shift_end.split(":"))
        total_slots = ((eh * 60 + em) - (sh * 60 + sm)) // 30
        remaining   = max(0, total_slots - existing)
        doctors.append({
            "user_id":          str(u["_id"]),
            "name":             u.get("name", ""),
            "department":       profile.get("department", ""),
            "hospital_name":    profile.get("hospital_name", ""),
            "qualification":    profile.get("qualification", ""),
            "experience_years": profile.get("experience_years", 0),
            "shift_start":      shift_start,
            "shift_end":        shift_end,
            "available":        remaining > 0,
            "remaining_slots":  remaining
        })
    return doctors
