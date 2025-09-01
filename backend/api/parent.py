# backend/api/parent.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.parent_service import ParentService 
from ..services.review_service import ReviewService

router = APIRouter(
    prefix="/parent",
    tags=["Parent"]
)


# ------------------------------- PARENTS ------------------------------
@router.post("/create-kid-account/")
def create_kid_account(kid_data: models.KidCreate, session: Session = Depends(database.get_session)) -> models.CreateKidAccountMessage:

    parent_service = ParentService(session)
    creation_data = parent_service.create_kid_account(kid_data)
    return creation_data

# This route now requires a valid token
@router.get("/view-kid-accounts/")
def view_kids_accounts(parent_id: int, session: Session = Depends(database.get_session)):
    
    parent_service = ParentService(session)
    kids_list = parent_service.view_kids_accounts(parent_id)
    return kids_list

@router.delete("/delete-kid-account/")
def delete_kid_account(delete_data: models.KidDelete, session: Session = Depends(database.get_session)) -> bool:
     
    parent_service = ParentService(session)
    success = parent_service.delete_kids_account(delete_data)
    return success

@router.post("/add-review/")
def add_review(review_data: models.AddReview, session: Session = Depends(database.get_session)) -> bool:

    review_service = ReviewService(session)
    success = review_service.create_review(review_data)
    return success
