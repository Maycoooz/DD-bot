from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel, ConfigDict
from schemas.media import BookResponse, VideoResponse
from models.tables import ReviewType, UserRole
from datetime import datetime

class LibrarianRegistrationRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    password: str
    country: str
    gender: str
    birthday: date
    race: str

class LibrarianRegistrationResponse(BaseModel):
    id: int # user id
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    
class LibrarianResponse(BaseModel):
    id: int # user id
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    is_verified: bool
    librarian_verified: bool
    
    model_config = ConfigDict(from_attributes=True)
    
# For librarian to view user reviews of books and videos
class LibrarianReviewUserResponse(BaseModel):
    id: int
    username: str
    role_name: Optional[UserRole] = None
    model_config = ConfigDict(from_attributes=True)

class LibrarianReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    review_type: ReviewType
    is_public_display_approved: bool
    created_at: datetime
    user: LibrarianReviewUserResponse

    media_title: Optional[str] = None
    media_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedLibrarianReviewResponse(BaseModel):
    total: int
    items: List[LibrarianReviewResponse]