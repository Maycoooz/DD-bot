from pydantic import BaseModel, field_validator, ConfigDict
from datetime import date
from typing import Optional, List
from schemas.interest import InterestResponse

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
    interests: List[str]
    
    @field_validator('interests')
    @classmethod
    def validate_interests_count(cls, value: List[str]) -> List[str]:
        if len(value) < 3:
            raise ValueError('At least 3 interests must be selected.')
        
        if len(set(value)) != len(value):
            raise ValueError('Interests must be unique.')

        return value
    
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
    
class ParentViewChildAccountsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    username: str
    first_name: str
    last_name: str
    
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    interests: List[InterestResponse] = []
    