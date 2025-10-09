from pydantic import BaseModel
from typing import Optional
from .users import ParentRegistrationResponse

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: Optional[str] = None
    
class TokenWithProfile(Token):
    profile: ParentRegistrationResponse
    
class TokenData(BaseModel):
    username: str | None = None
    
class StatusMessage(BaseModel):
    status: str
    message: str
    