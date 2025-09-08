from sqlmodel import Session, select, or_
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

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

    def update_book(self, book_data: models.UpdateBook) -> models.SuccessMessage:

        # find the book
        book_to_update = self.session.get(models.Books, book_data.book_id)

        # if book does not exist
        if not book_to_update:
            return models.SuccessMessage(
                success=False,
                message="Book does not exist"
            )
        
        # update the book with the new book_data
        book_to_update.title = book_data.new_title
        book_to_update.author = book_data.new_author
        book_to_update.age_group = book_data.new_age_group
        book_to_update.category = book_data.new_category
        book_to_update.description = book_data.new_description
        book_to_update.link = book_data.new_link

        self.session.add(book_to_update)
        self.session.commit()
        self.session.refresh(book_to_update)

        return models.SuccessMessage(
            success=True,
            message="Book successfully updated"
        )
    
    def search_books(self, search_term: Optional[str], limit: int, offset: int) -> List[models.Books]:
        statement = select(models.Books)
        
        # If a search term is provided, add a where clause
        if search_term:
            # The '%' are wildcards, so it finds partial matches
            search_pattern = f"%{search_term}%"
            statement = statement.where(
                or_(
                    models.Books.title.ilike(search_pattern),
                    models.Books.author.ilike(search_pattern)
                )
            )
            
        # Apply pagination
        final_statement = statement.offset(offset).limit(limit)
        books = self.session.exec(final_statement).all()
        
        return books
    
    def delete_book(self):
        return
    
    # KIV
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
    
    # KIV
    def suspend_video(self):
        return
