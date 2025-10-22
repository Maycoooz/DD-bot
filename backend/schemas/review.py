from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

# Schema for creating a new review
class ReviewCreate(BaseModel):
    review: str = Field(..., max_length=80)
    stars: int = Field(..., ge=1, le=5) # Ensures stars are between 1 and 5

# Schema for displaying a user's existing review
class ReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    review_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
class ReviewerResponse(BaseModel):
    username: str
    
    model_config = ConfigDict(from_attributes=True)
    
class PublicReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    user: ReviewerResponse
    
    model_config = ConfigDict(from_attributes=True)