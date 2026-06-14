from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

# MongoDB stores _id as ObjectId. This helper lets Pydantic handle it.
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserModel(BaseModel):
    id:         Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name:       str
    mobile:     str
    email:      Optional[str] = None
    role:       str = "patient"          # "patient" or "doctor"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True


class DoctorProfileModel(BaseModel):
    user_id:          str               # links to UserModel._id
    qualification:    Optional[str] = None
     experience_years: int = 0
    age:              Optional[int] = None
    department:       Optional[str] = None
    hospital_name:    Optional[str] = None
    hospital_block:   Optional[str] = None
    room_number:      Optional[str] = None
    registration_no:  Optional[str] = None
    shift_start:      Optional[str] = None   # "08:00"
    shift_end:        Optional[str] = None   # "13:00"


class PatientModel(BaseModel):
    owner_user_id: str               # links to UserModel._id
    name:          str
    age:           Optional[int] = None
    blood_group:   Optional[str] = None
    location:      Optional[str] = None
    mobile:        Optional[str] = None
    relationship:  Optional[str] = None
    created_at:    datetime = Field(default_factory=datetime.utcnow)


class AppointmentModel(BaseModel):
    doctor_user_id:    str
    patient_id:        str
    booked_by_user_id: str
    appointment_date:  str               # "2025-06-10"
    appointment_time:  str               # "09:00"
    status:            str = "pending"   # pending confirmed waiting completed cancelled
    token_number:      Optional[str] = None
    notes:             Optional[str] = None
    created_at:        datetime = Field(default_factory=datetime.utcnow)


class OTPModel(BaseModel):
    mobile:     str
    otp:        str
    used:       bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    