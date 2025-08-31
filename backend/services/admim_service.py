import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List
import bleach

class AdminService():

    def __init__(self, session: Session):
        self.session = session

    
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



