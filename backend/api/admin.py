# backend/api/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.admin_service import AdminService
from ..services.review_service import ReviewService

router = APIRouter(
    prefix = "/admin",
    tags = ["Admin"]
)

@router.get("/view-all-reviews/", response_model=List[models.ViewReviews])
def view_all_reviews(session: Session = Depends(database.get_session)):

    review_service = ReviewService(session)
    reviews_list = review_service.view_reviews()
    return reviews_list

@router.post("/showcase-review/", response_model=models.SuccessMessage)
def showcase_review(review_id: int, session: Session = Depends(database.get_session)):

    review_service = ReviewService(session)
    success_message = review_service.showcase_review(review_id)
    return success_message

@router.get("/view-all-showcased-reviews/", response_model=List[models.ShowcasedReviewDetails])
def view_all_showcased_reviews(session: Session = Depends(database.get_session)):

    review_service = ReviewService(session)
    showcased_reviews_list = review_service.get_showcased_reviews()
    return showcased_reviews_list

@router.delete("/remove-showcased-review/", response_model=models.SuccessMessage)
def remove_showcased_review(review_id: int, session: Session = Depends(database.get_session)):

    review_service = ReviewService(session)
    success_message = review_service.remove_showcased_review(review_id)
    return success_message

@router.get("/view-all-librarians/", response_model=List[models.LibrarianDetails])
def view_all_librarians(session: Session = Depends(database.get_session)):

    admin_service = AdminService(session)
    list_of_librarians = admin_service.get_all_librarians()
    return list_of_librarians

@router.patch("/update-librarian-status/", response_model=models.SuccessMessage)
def approve_reject_librarian(update_data: models.UpdateLibrarianStatus, session: Session = Depends(database.get_session)):
    
    admin_service = AdminService(session)
    success_message = admin_service.approve_reject_librarian(update_data)
    return success_message

@router.delete("/delete-librarian-account/", response_model=models.SuccessMessage)
def delete_librarian_account(librarian_id: int, session: Session = Depends(database.get_session)):

    admin_service = AdminService(session)
    success_message = admin_service.delete_librarian_account(librarian_id)
    return success_message