from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List

class MediaService():

    def __init__(self, session: Session):
        self.session = session

    def add_book(self, book: models.AddBook) -> models.SuccessMessage:
        
        statement = select(models.Books).where(book.link == models.Books.link)

        book_exists = self.session.exec(statement).first()

        if book_exists:
            return models.SuccessMessage(
                success=False,
                message="Book already exists in database"
            )
        
        new_book_entry = models.Books(
            title=book.title,
            author=book.author,
            age_group=book.age_group,
            category=book.category,
            description=book.description,
            rating=book.rating,
            link=book.link
        )

        self.session.add(new_book_entry)
        self.session.commit()
        self.session.refresh(new_book_entry)

        return models.SuccessMessage(
            success=True,
            message="Book added successfully"
        )
    
    def view_books(self, limit: int, offset: int) -> List[models.Books]:

        statement = select(models.Books).offset(offset).limit(limit)
        books = self.session.exec(statement).all()
        return books


    def update_book(self, ) -> models.SuccessMessage:
        return
    
    def search_book(self):
        return
    
    def delete_book(self):
        return
    
    def suspend_book(self):
        return
    
    def add_video(self) -> models.SuccessMessage:
        return
    
    def update_video(self) -> models.SuccessMessage:
        return
    
    def view_all_videos(self):
        return
    
    def search_video(self):
        return
    
    def delete_video(self):
        return
    
    def suspend_video(self):
        return
