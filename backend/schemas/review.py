from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

# Schema for creating a new review
class ReviewCreate(BaseModel):
    review: str
    stars: int = Field(..., ge=1, le=5) # Ensures stars are between 1 and 5

# Schema for displaying a user's existing review
class ReviewResponse(BaseModel):
    id: int
    review: str
    stars: int
    review_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)