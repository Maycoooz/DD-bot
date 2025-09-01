# backend/api/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.user_service import UserService
from ..services.review_service import ReviewService

# comment
router = APIRouter(
    tags=["Signup & Login"]
)

# Parent & librarian signup
@router.post("/signup/")
def signup(user_data: models.UserRegister, session: Session = Depends(database.get_session)) -> bool:

    user_service = UserService(session)
    success = user_service.registerAccount(user_data)
    return success

@router.post("/login/")
def login(user_data: models.UserLogin, session: Session = Depends(database.get_session)) -> models.LoginMessage:

    user_service = UserService(session)
    login_data = user_service.login(user_data)
    return login_data

# give all showcased reviews to frontend landing page
@router.get("/")
def display_showcased_reviews(session: Session = Depends(database.get_session)) -> List[models.ShowcasedReviewDetails]:

    review_service = ReviewService(session)
    list_of_showcased_reviews = review_service.get_showcased_reviews()
    return list_of_showcased_reviews
