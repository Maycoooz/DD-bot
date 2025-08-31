# backend/api/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.admim_service import AdminService

router = APIRouter(
    prefix = "/admin",
    tags = ["Admin"]
)

# ------------------------------- Admin ------------------------------
@router.get("/view-all-reviews/")
def view_all_reviews(session: Session = Depends(database.get_session)) -> List[models.ViewReviews]:

    admin_service = AdminService(session)
    reviews_list = admin_service.view_reviews()
    return reviews_list
