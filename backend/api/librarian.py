# backend/api/routes.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.media_service import MediaService

router = APIRouter(
    prefix="/librarian",
    tags=["Librarian"]
)

@router.post("/add-book/")
def add_book(book: models.AddBook, session: Session = Depends(database.get_session)) -> models.SuccessMessage:

    media_service = MediaService(session)
    success_message = media_service.add_book(book)
    return success_message

@router.get("/view-books/")
def view_books(limit: int = Query(default=20, le=20), 
               offset: int = Query(default=0, ge=0),
               session: Session = Depends(database.get_session)
               ) -> List[models.Books]:
    
    media_service = MediaService(session)
    list_of_books = media_service.view_books(limit, offset)
    return list_of_books

@router.patch("/update-book/")
def update_book(book_data: models.UpdateBook, session: Session = Depends(database.get_session)) -> models.SuccessMessage:

    media_service = MediaService(session)
    success_message = media_service.update_book(book_data)
    return success_message

@router.get("/search-books/")
def search_book(filter_title: str, session: Session = Depends(database.get_session)) -> List[models.Books]:

    return

