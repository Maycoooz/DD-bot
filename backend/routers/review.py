from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from db.database import get_db
from models.tables import User, Review, ReviewType
from schemas.review import ReviewCreate, ReviewResponse, PublicReviewResponse
from schemas.auth import StatusMessage
from auth.auth_handler import get_current_active_user

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from better_profanity import profanity


profanity.load_censor_words()
analyzer = SentimentIntensityAnalyzer()

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
    review_text = review_data.review.strip()

    # Profanity check
    if profanity.contains_profanity(review_text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your review contains inappropriate language."
        )

    # Sentiment check
    sentiment_score = analyzer.polarity_scores(review_text)
    # compound score: >0.05 positive, <-0.05 negative, else neutral
    is_positive = sentiment_score['compound'] > 0.05

    # Create Review 
    new_review = Review(
        user_id=current_user.id,
        review=review_text,
        stars=review_data.stars,
        review_type=ReviewType.APP,
        reviewable_id=0,  # placeholder for app reviews
        is_public_display_approved=is_positive  # show on landing page if positive
    )

    db.add(new_review)
    db.commit()
    
    message = "Your review has been submitted successfully."
    if not is_positive:
        message += " We will try harder to improve!"
    if is_positive:
        message += " Thank you for your feedback!"

    return StatusMessage(status="success", message=message)


# Endpoint to get latest public app reviews for landing page
@router.get("/app/latest", response_model=List[PublicReviewResponse])
def get_latest_app_reviews(db: Session = Depends(get_db)):
    candidate_reviews = (
        db.query(Review)
        .options(joinedload(Review.user))  # Eagerly load the user relationship
        .filter(
            Review.review_type == ReviewType.APP,
            Review.stars == 5,
            Review.is_public_display_approved == True  # only approved positive reviews
        )
        .order_by(Review.created_at.desc())
        .limit(30)  # Fetch up to 30 reviews to select unique users
        .all()
    )
    
    # Keep only one review per user
    unique_user_reviews = []
    seen_user_ids = set()
    for review in candidate_reviews:
        if review.user_id not in seen_user_ids:
            unique_user_reviews.append(review)
            seen_user_ids.add(review.user_id)
        if len(unique_user_reviews) >= 6:
            break
    return unique_user_reviews

# Endpoint to get all reviews for the currently logged-in user
@router.get("/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
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