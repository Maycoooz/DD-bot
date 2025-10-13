from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel

class ParentRegistrationRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    password: str
    country: str
    gender: str
    birthday: date
    race: str
    
class ParentRegistrationResponse(BaseModel):
    id: int # user id
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    
class UserInDB(ParentRegistrationResponse):
    hashed_password: str
    
class ChangePassword(BaseModel):
    current_password: str
    new_password: str