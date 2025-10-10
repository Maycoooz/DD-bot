from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional, List

class RoleResponse(BaseModel):
    name: str
    
    model_config = ConfigDict(from_attributes=True)

class ViewAllUser(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    role: RoleResponse
    is_verified: bool
    
    model_config = ConfigDict(from_attributes=True)
    
class ViewAllUserResponse(BaseModel):
    parent_and_kid_users: List[ViewAllUser]
    total_users: int
    total_parents: int
    total_kids: int
    
    