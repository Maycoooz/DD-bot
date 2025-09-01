# backend/api/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.admim_service import AdminService
from ..services.review_service import ReviewService

router = APIRouter(
    prefix = "/admin",
    tags = ["Admin"]
)

# ------------------------------- Admin ------------------------------
@router.get("/view-all-reviews/")
def view_all_reviews(session: Session = Depends(database.get_session)) -> List[models.ViewReviews]:

    review_service = ReviewService(session)
    reviews_list = review_service.view_reviews()
    return reviews_list
