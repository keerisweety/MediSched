from fastapi import APIRouter, HTTPException
from database import get_db
from bson import ObjectId
from datetime import datetime
import math

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lon/2)**2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)), 1)


@router.get("/")
async def get_hospitals(lat: float = None, lng: float = None):
    db = get_db()
    cursor = db.hospitals.find({})
    hospitals = []
    async for h in cursor:
        h["_id"] = str(h["_id"])
        if lat and lng and h.get("lat") and h.get("lng"):
            h["distance_km"] = haversine(lat, lng, h["lat"], h["lng"])
        else:
            h["distance_km"] = None
        hospitals.append(h)
    if lat and lng:
        hospitals.sort(key=lambda x: x["distance_km"] or 9999)
    return hospitals


@router.get("/{hospital_id}")
async def get_hospital(hospital_id: str):
    db = get_db()
    h = await db.hospitals.find_one({"_id": ObjectId(hospital_id)})
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    h["_id"] = str(h["_id"])
    return h


@router.delete("/clear")
async def clear_hospitals():
    """Clears all hospitals so seed can run fresh."""
    db = get_db()
    result = await db.hospitals.delete_many({})
    return {"message": f"Cleared {result.deleted_count} hospitals"}


@router.post("/seed")
async def seed_hospitals():
    """
    Seeds hospitals. Looks up real doctor user IDs from the users collection.
    If a doctor user is not found, uses a placeholder so booking still works.
    """
    db = get_db()
    count = await db.hospitals.count_documents({})
    if count > 0:
        return {"message": "Already seeded. Call DELETE /hospitals/clear first to reseed."}

    # Look up real doctor user IDs from users collection
    async def get_doctor_id(mobile: str):
        """Find user by mobile and return their string _id."""
        user = await db.users.find_one({"mobile": mobile, "role": "doctor"})
        if user:
            return str(user["_id"])
        return None  # doctor not registered yet

    # Try to find doctor accounts by mobile
    # These are the demo mobiles from Day 1
    doc_cardio1  = await get_doctor_id("9900000001")  # Dr. Suresh Kumar
    doc_cardio2  = await get_doctor_id("9900000002")  # Dr. Meena
    doc_neuro1   = await get_doctor_id("9900000003")  # Dr. Palani
    doc_neuro2   = await get_doctor_id("9900000004")
    doc_ortho1   = await get_doctor_id("9900000005")
    doc_ortho2   = await get_doctor_id("9900000006")
    doc_peds     = await get_doctor_id("9900000007")
    doc_gynaec1  = await get_doctor_id("9900000008")
    doc_gynaec2  = await get_doctor_id("9900000009")
    doc_ent      = await get_doctor_id("9900000010")
    doc_gen1     = await get_doctor_id("9900000011")
    doc_gen2     = await get_doctor_id("9900000012")

    hospitals = [
        {
            "name": "Madurai Rajaji Government Hospital",
            "address": "Panagal Road, Madurai, Tamil Nadu 625020",
            "phone": "0452-2532535",
            "type": "Government",
            "rating": 4.2,
            "lat": 9.9195,
            "lng": 78.1221,
            "departments": [
                {
                    "id": "cardio",
                    "name": "Cardiology",
                    "floor": "Block A, 2nd Floor, Room 204",
                    "phone": "Ext 201",
                    "doctors": [
                        {
                            "id": "d1",
                            "user_id": doc_cardio1,
                            "name": "Dr. R. Suresh Kumar",
                            "exp": 18,
                            "timing": "08:00 AM - 01:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        },
                        {
                            "id": "d2",
                            "user_id": doc_cardio2,
                            "name": "Dr. Meena Venkataraman",
                            "exp": 12,
                            "timing": "02:00 PM - 06:00 PM",
                            "days": "Mon-Fri",
                            "available": True
                        }
                    ]
                },
                {
                    "id": "neuro",
                    "name": "Neurology",
                    "floor": "Block B, 3rd Floor, Room 312",
                    "phone": "Ext 210",
                    "doctors": [
                        {
                            "id": "d3",
                            "user_id": doc_neuro1,
                            "name": "Dr. Palani Arumugam",
                            "exp": 22,
                            "timing": "09:00 AM - 01:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        },
                        {
                            "id": "d4",
                            "user_id": doc_neuro2,
                            "name": "Dr. Karthika Selvam",
                            "exp": 9,
                            "timing": "02:00 PM - 05:00 PM",
                            "days": "Tue-Sat",
                            "available": False
                        }
                    ]
                },
                {
                    "id": "ortho",
                    "name": "Orthopaedics",
                    "floor": "Block C, Ground Floor, Room 102",
                    "phone": "Ext 220",
                    "doctors": [
                        {
                            "id": "d5",
                            "user_id": doc_ortho1,
                            "name": "Dr. Murugan Rajan",
                            "exp": 15,
                            "timing": "08:30 AM - 12:30 PM",
                            "days": "Mon-Fri",
                            "available": True
                        },
                        {
                            "id": "d6",
                            "user_id": doc_ortho2,
                            "name": "Dr. Anuradha Pillai",
                            "exp": 11,
                            "timing": "01:00 PM - 05:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        }
                    ]
                },
                {
                    "id": "peds",
                    "name": "Paediatrics",
                    "floor": "Block A, 1st Floor, Room 115",
                    "phone": "Ext 230",
                    "doctors": [
                        {
                            "id": "d7",
                            "user_id": doc_peds,
                            "name": "Dr. Senthil Kumaran",
                            "exp": 14,
                            "timing": "09:00 AM - 02:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        }
                    ]
                },
                {
                    "id": "gynaec",
                    "name": "Gynaecology & Obstetrics",
                    "floor": "Block D, 2nd Floor, Room 215",
                    "phone": "Ext 240",
                    "doctors": [
                        {
                            "id": "d8",
                            "user_id": doc_gynaec1,
                            "name": "Dr. Saranya Nair",
                            "exp": 16,
                            "timing": "08:00 AM - 01:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        },
                        {
                            "id": "d9",
                            "user_id": doc_gynaec2,
                            "name": "Dr. Lalitha Chandran",
                            "exp": 20,
                            "timing": "02:00 PM - 06:00 PM",
                            "days": "Mon-Fri",
                            "available": True
                        }
                    ]
                },
                {
                    "id": "ent",
                    "name": "ENT",
                    "floor": "Block B, Ground Floor, Room 005",
                    "phone": "Ext 250",
                    "doctors": [
                        {
                            "id": "d10",
                            "user_id": doc_ent,
                            "name": "Dr. Ganeshan Pillai",
                            "exp": 13,
                            "timing": "09:00 AM - 12:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        }
                    ]
                },
                {
                    "id": "gen",
                    "name": "General Medicine",
                    "floor": "Block A, Ground Floor, Room 001",
                    "phone": "Ext 100",
                    "doctors": [
                        {
                            "id": "d12",
                            "user_id": doc_gen1,
                            "name": "Dr. Anbu Selvan",
                            "exp": 25,
                            "timing": "07:30 AM - 12:00 PM",
                            "days": "Mon-Sat",
                            "available": True
                        },
                        {
                            "id": "d13",
                            "user_id": doc_gen2,
                            "name": "Dr. Priya Natarajan",
                            "exp": 8,
                            "timing": "01:00 PM - 05:30 PM",
                            "days": "Mon-Sat",
                            "available": True
                        }
                    ]
                }
            ]
        },
        {
            "name": "Apollo Hospitals Madurai",
            "address": "Lake View Road, KK Nagar, Madurai 625020",
            "phone": "0452-4300000",
            "type": "Private",
            "rating": 4.7,
            "lat": 9.9312,
            "lng": 78.1108,
            "departments": [
                {
                    "id": "a_cardio",
                    "name": "Cardiology",
                    "floor": "Tower 1, 4th Floor",
                    "phone": "Ext 401",
                    "doctors": []
                },
                {
                    "id": "a_ortho",
                    "name": "Orthopaedics",
                    "floor": "Tower 1, 3rd Floor",
                    "phone": "Ext 301",
                    "doctors": []
                }
            ]
        },
        {
            "name": "Meenakshi Mission Hospital",
            "address": "Lake Area, Melur Road, Madurai 625107",
            "phone": "0452-2588400",
            "type": "Private",
            "rating": 4.5,
            "lat": 9.9452,
            "lng": 78.1305,
            "departments": []
        },
        {
            "name": "Velammal Medical College Hospital",
            "address": "Anuppanadi, Madurai 625009",
            "phone": "0452-2340000",
            "type": "Teaching",
            "rating": 4.0,
            "lat": 9.9650,
            "lng": 78.1050,
            "departments": []
        }
    ]

    await db.hospitals.insert_many(hospitals)
    return {
        "message": "Hospitals seeded with real doctor user IDs",
        "count": len(hospitals),
        "doctor_ids_found": {
            "Dr. Suresh Kumar (9900000001)": doc_cardio1 or "NOT REGISTERED YET",
            "Dr. Palani Arumugam (9900000003)": doc_neuro1 or "NOT REGISTERED YET"
        }
    }
