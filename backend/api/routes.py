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
    tags=["Landing Page"]
)

# Parent & librarian signup
@router.post("/signup/", response_model=bool)
def signup(user_data: models.UserRegister, session: Session = Depends(database.get_session)):

    user_service = UserService(session)
    success = user_service.registerAccount(user_data)
    return success

@router.post("/login/", response_model=models.LoginMessage)
def login(user_data: models.UserLogin, session: Session = Depends(database.get_session)):

    user_service = UserService(session)
    login_data = user_service.login(user_data)
    return login_data

# give all showcased reviews to frontend landing page
@router.get("/", response_model=List[models.ShowcasedReviewDetails])
def display_showcased_reviews(session: Session = Depends(database.get_session)):

    review_service = ReviewService(session)
    list_of_showcased_reviews = review_service.get_showcased_reviews()
    return list_of_showcased_reviews
