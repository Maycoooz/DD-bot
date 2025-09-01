import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List
import bleach


class ReviewService():

    def __init__(self, session: Session):
        self.session = session

    def create_review(self, review_data: models.AddReview) -> bool:
        try:
            # Sanitize the input to remove any HTML tags
            clean_review = bleach.clean(review_data.message, tags=[], strip=True)

            # set star rating to 1 as default if no rating is provided (failsafe)
            star_rating = review_data.stars if review_data.stars is not None else 1

            new_review = models.ParentReviews(
                user_id = review_data.parent_id,
                review = clean_review,
                stars = star_rating
            )

            self.session.add(new_review) # will fail if parent id is incorect
            self.session.commit()
            self.session.refresh(new_review)

            return True
        # if parent id is incorrect
        except IntegrityError: 
            self.session.rollback()
            return False
        

    # admin view all reviews
    def view_reviews(self) -> List[models.ViewReviews]:
        # Select the full ParentReviews object
        statement = select(models.ParentReviews).options(selectinload(models.ParentReviews.user))

        all_reviews = self.session.exec(statement).all()

        reviews_list = []
        for review in all_reviews:
            review_detail = models.ViewReviews(
                username = review.user.username,
                review = review.review,
                stars = review.stars
            )
            reviews_list.append(review_detail)

        return reviews_list