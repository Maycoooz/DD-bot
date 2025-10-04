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
    username: str
    first_name: str
    last_name: str
    email: str
    country: str
    gender: str
    birthday: date
    race: str
    
class UserInDB(ParentRegistrationResponse):
    hashed_password: str