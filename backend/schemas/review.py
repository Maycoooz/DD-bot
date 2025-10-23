from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime
from models.tables import ReviewType

# Schema for creating a new review
class ReviewCreate(BaseModel):
    review: str = Field(..., max_length=80)
    stars: int = Field(..., ge=1, le=5)  # 1–5

# What you return to the *current user* for their own reviews
class ReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    review_type: ReviewType
    created_at: datetime

    # media context (only for BOOK/VIDEO)
    media_title: Optional[str] = None
    media_id: Optional[int] = None  

    model_config = ConfigDict(from_attributes=True)

# Public-facing “author” snippet
class ReviewerResponse(BaseModel):
    username: str
    model_config = ConfigDict(from_attributes=True)

# Public review (e.g., when listing reviews under a book/video)
class PublicReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    user: ReviewerResponse

    review_type: Optional[ReviewType] = None
    media_title: Optional[str] = None
    media_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
