from pydantic import BaseModel
from datetime import date

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