from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from db.database import get_db
from models.tables import User, Review, ReviewType
from schemas.review import ReviewCreate, ReviewResponse, PublicReviewResponse
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

@router.get("/app/latest", response_model=List[PublicReviewResponse])
def get_latest_app_reviews(db: Session = Depends(get_db)):
    candidate_reviews = (
        db.query(Review)
        .options(joinedload(Review.user)) # Eagerly load the user relationship
        .filter(Review.review_type == ReviewType.APP, Review.stars == 5)
        .order_by(Review.created_at.desc())
        .limit(30) # Fetch up tp 30 users to find 6 unique ones
        .all()
    )
    
    # Process the reviews to get only one per user
    unique_user_reviews = []
    seen_user_ids = set()
    
    for review in candidate_reviews:
        # If we haven't seen this user yet, add their review
        if review.user_id not in seen_user_ids:
            unique_user_reviews.append(review)
            seen_user_ids.add(review.user_id)
        
        # Stop once we have collected 6 unique reviews
        if len(unique_user_reviews) >= 6:
            break
    return unique_user_reviews

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