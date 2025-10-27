from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from models.tables import ReviewType, UserRole
from datetime import datetime

class RoleResponse(BaseModel):
    name: str
    
    model_config = ConfigDict(from_attributes=True)

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
    
# Admin view reviews
class AdminReviewUserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
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
    
# Dashboard stats   
class AdminUserStats(BaseModel):
    total_users: int # exlclude admins
    total_parents: int
    total_kids: int
    total_librarians: int
    
#Admin view librarians 
class LibrarianListItem(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    is_verified: bool
    librarian_verified: bool
    role_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class PaginatedLibrarianListResponse(BaseModel):
    total: int
    items: List
    
# new view all parent / kid schema
class AdminUserListItem(BaseModel):
    id: int
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role_name: str                     # "PARENT" or "CHILD"
    subscription_tier: Optional[str] = None  # "FREE", "PREMIUM", etc.
    is_verified: bool
    parent_email: Optional[str] = None       # only for CHILD rows

class PaginatedUserListResponse(BaseModel):
    items: List[AdminUserListItem]

    # GLOBAL totals (not page totals)
    total_accounts: int
    total_parents: int
    total_kids: int

    # Pagination info for the current filtered query
    page: int
    size: int
    total_pages: int