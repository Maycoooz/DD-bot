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
    success = media_service.add_book(book)
    return success

@router.get("/view-books/")
def view_books(limit: int = Query(default=20, le=20), 
               offset: int = Query(default=0, ge=0),
               session: Session = Depends(database.get_session)
               ) -> List[models.Books]:
    
    media_service = MediaService(session)
    list_of_books = media_service.view_books(limit, offset)
    return list_of_books

