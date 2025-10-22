from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional, List

class RoleResponse(BaseModel):
    name: str
    
    model_config = ConfigDict(from_attributes=True)

# In schemas/users.py

class ViewAllUser(BaseModel):
    id: int  # Ensure ID is included
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    role: RoleResponse
    is_verified: bool
    tier: Optional[str] = None
    primary_parent_id: Optional[int] = None 
    
    model_config = ConfigDict(from_attributes=True)
    
class ViewAllUserResponse(BaseModel):
    parent_and_kid_users: List[ViewAllUser]
    total_users: int
    total_parents: int
    total_kids: int
    
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from models.tables import ReviewType, UserRole
from datetime import datetime

class AdminReviewUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role_name: UserRole
    parent_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AdminReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    review_type: ReviewType
    is_public_display_approved: bool
    created_at: datetime
    user: AdminReviewUserResponse  # Nested user data

    model_config = ConfigDict(from_attributes=True)

class PaginatedAdminReviewResponse(BaseModel):
    total: int
    items: List[AdminReviewResponse]
    
    