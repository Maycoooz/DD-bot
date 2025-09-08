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
    
    def delete_book(self, book_id: int) -> models.SuccessMessage:
        
        book_to_delete = self.session.get(models.Books, book_id)

        if not book_to_delete:
            return models.SuccessMessage(
                success=False,
                message="Book does not exist"
            )
        
        self.session.delete(book_to_delete)
        self.session.commit()

        return models.SuccessMessage(
            success=True,
            message="Book successfully removed from database"
        )
    
    # KIV
    def suspend_book(self):
        return
    



    
    def add_video(self, video: models.AddVideo) -> models.SuccessMessage:
        statement = select(models.Videos).where(video.link == models.Videos.link)

        video_exists = self.session.exec(statement).first()

        if video_exists:
            return models.SuccessMessage(
                success=False,
                message="Video already exists in database"
            )
        
        new_video_entry = models.Videos(
            title=video.title,
            creator=video.creator,
            age_group=video.age_group,
            category=video.category,
            description=video.description,
            rating=video.rating,
            link=video.link
        )

        self.session.add(new_video_entry)
        self.session.commit()
        self.session.refresh(new_video_entry)

        return models.SuccessMessage(
            success=True,
            message="Video added successfully"
        )
    
    def search_videos(self, search_term: Optional[str], limit: int, offset: int) -> List[models.Videos]:
        statement = select(models.Videos)
        
        # If a search term is provided, add a where clause
        if search_term:
            # The '%' are wildcards, so it finds partial matches
            search_pattern = f"%{search_term}%"
            statement = statement.where(
                or_(
                    models.Videos.title.ilike(search_pattern),
                    models.Videos.creator.ilike(search_pattern)
                )
            )
            
        # Apply pagination
        final_statement = statement.offset(offset).limit(limit)
        videos = self.session.exec(final_statement).all()
        
        return videos
    
    def update_video(self, video_data: models.UpdateVideo) -> models.SuccessMessage:
        
        # find the video
        video_to_update = self.session.get(models.Videos, video_data.video_id)

        # if video does not exist
        if not video_to_update:
            return models.SuccessMessage(
                success=False,
                message="Video does not exist"
            )
        
        # update the video with the new video_data
        video_to_update.title = video_data.new_title
        video_to_update.creator = video_data.new_creator
        video_to_update.age_group = video_data.new_age_group
        video_to_update.category = video_data.new_category
        video_to_update.description = video_data.new_description
        video_to_update.link = video_data.new_link

        self.session.add(video_to_update)
        self.session.commit()
        self.session.refresh(video_to_update)

        return models.SuccessMessage(
            success=True,
            message="Video successfully updated"
        )
    
    def delete_video(self, video_id: int) -> models.SuccessMessage:
        video_to_delete = self.session.get(models.Videos, video_id)

        if not video_to_delete:
            return models.SuccessMessage(
                success=False,
                message="Video does not exist"
            )
        
        self.session.delete(video_to_delete)
        self.session.commit()

        return models.SuccessMessage(
            success=True,
            message="Video successfully removed from database"
        )
    
    # KIV
    def suspend_video(self):
        return
