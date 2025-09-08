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


    # for now only parents can create reviews (kids can make reviews in the future maybe)
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
        

    # view all reviews
    def view_reviews(self) -> List[models.ViewReviews]:
        # Select the full ParentReviews object
        statement = select(models.ParentReviews).options(selectinload(models.ParentReviews.user))

        all_reviews = self.session.exec(statement).all()

        reviews_list = []
        for review in all_reviews:
            review_detail = models.ViewReviews(
                review_id = review.review_id,
                username = review.user.username,
                review = review.review,
                stars = review.stars
            )
            reviews_list.append(review_detail)

        return reviews_list
    
    # admin selects review for landing page
    # review chosen from view-all-reviews endpoint
    # saved into another table in db ChosenReviews
    def showcase_review(self, review_id: int) -> models.SuccessMessage:

        # check if review is already showcased
        existing_showcased = self.session.get(models.ChosenReviews, review_id)

        if existing_showcased:
            return models.SuccessMessage(
                success=False,
                message="This review is already being showcased"
            )

        # check if review exists
        original_review = self.session.get(models.ParentReviews, review_id)

        if not original_review:
            return models.SuccessMessage(
                success=False,
                message="Review you are trying to showcase does not exist"
            )
        
        # if all checks pass, add review to ChosenReviews table
        showcased_review = models.ChosenReviews(
            review_id=review_id
        )

        self.session.add(showcased_review)
        self.session.commit()
        self.session.refresh(showcased_review)

        return models.SuccessMessage(
            success=True,
            message="Review successfully showcased"
        )
    
    # for landing page
    # router endpoint is in routes
    def get_showcased_reviews(self) -> List[models.ShowcasedReviewDetails]:

        statement = select(models.ParentReviews).join(
            models.ChosenReviews,
            models.ChosenReviews.review_id == models.ParentReviews.review_id
        ).options(selectinload(models.ParentReviews.user)) # to get the parents username
        
        all_showcased_reviews = self.session.exec(statement).all()

        list_of_reviews = []
        for review in all_showcased_reviews:
            showcased_review = models.ShowcasedReviewDetails(
                review_id = review.review_id,
                username = review.user.username,
                review = review.review,
                stars = review.stars
            )

            list_of_reviews.append(showcased_review)

        return list_of_reviews
    

    def remove_showcased_review(self, review_id: int) -> models.SuccessMessage:

        statement = select(models.ChosenReviews).where(models.ChosenReviews.review_id == review_id)

        review_to_delete = self.session.exec(statement).first()

        if not review_to_delete:
            return models.SuccessMessage(
                success=False,
                message="Review does not exist or is not showcased"
            )
    
        self.session.delete(review_to_delete)
        self.session.commit()

        return models.SuccessMessage(
            success=True,
            message="Review no longer showcased"
        )




 

        