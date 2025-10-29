from pydantic import BaseModel, field_validator, ConfigDict
from datetime import date
from typing import Optional, List
from schemas.interest import InterestResponse
from  models.tables import SubscriptionTier

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
    
class ChildProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    
    birthday: Optional[date] = None
    race: Optional[str] = None
    
    interests: Optional[List[str]] = None
    @field_validator('interests')
    @classmethod
    def validate_interests_count(cls, value: List[str]) -> List[str]:
        if len(value) < 3:
            raise ValueError('At least 3 interests must be selected.')
        
        if len(set(value)) != len(value):
            raise ValueError('Interests must be unique.')

        return value

class ParentProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None 
    race: Optional[str] = None
    
class ParentViewChildAccountsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    first_name: str
    last_name: str
    
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    interests: List[InterestResponse] = []
    
# ---------- Tier change flow ----------

# Preview child during tier change
class ChildSummary(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tier: Optional[str] = None


class ParentMeResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    tier: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    role_name: Optional[str] = None
    children: List[ChildSummary] = []

    model_config = ConfigDict(from_attributes=True)


class TierChangePreviewResponse(BaseModel):
    current_tier: str
    target_tier: str
    gain_features: List[str]
    lose_features: List[str]
    requires_child_choice: bool
    children: List[ChildSummary] = []
    max_children_allowed: int


class ChangeTierRequest(BaseModel):
    target_tier: str                # "FREE" or "PRO"
    keep_child_id: Optional[int] = None  # only required if downgrading w/ >1 children