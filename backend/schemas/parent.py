from pydantic import BaseModel
from datetime import date
from typing import Optional

class ChildRegistrationRequest(BaseModel):
    username: str
    password: str
    confirm_password: str
    first_name: str
    last_name: str
    country: str
    gender: str
    birthday: date
    race: str
    
class ChildRegistrationResponse(BaseModel):
    username: str
    first_name: str
    last_name: str
    country: str
    gender: str
    birthday: date
    race: str

class ParentProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None 
    race: Optional[str] = None