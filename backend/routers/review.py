from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.tables import User, Review, ReviewType
from schemas.review import ReviewCreate, ReviewResponse
from schemas.auth import StatusMessage
from auth.auth_handler import get_current_active_user

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)

# Endpoint to create a new app review
@router.post("/app", response_model=StatusMessage, status_code=status.HTTP_201_CREATED)
def create_app_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_review = Review(
        user_id=current_user.id,
        review=review_data.review,
        stars=review_data.stars,
        review_type=ReviewType.APP,
        reviewable_id=0 # Using a placeholder ID like 0 for general app reviews
    )
    db.add(new_review)
    db.commit()
    return StatusMessage(status="success", message="Your review has been submitted successfully.")

# Endpoint to get all reviews for the currently logged-in user
@router.get("/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).order_by(Review.created_at.desc()).all()
    return reviews

# Endpoint to delete a specific review
@router.delete("/{review_id}", response_model=StatusMessage)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    review_to_delete = db.query(Review).filter(Review.id == review_id).first()

    if not review_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    
    # Security check: ensure the user owns the review they are trying to delete
    if review_to_delete.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete this review.")
        
    db.delete(review_to_delete)
    db.commit()
    
    return StatusMessage(status="success", message="Review deleted successfully.")