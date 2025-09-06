from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List

class LibrarianService():

    def __init__(self, session: Session):
        self.session = session

    def add_book(self) -> models.SuccessMessage:
        return
    
    def update_book(self) -> models.SuccessMessage:
        return
    
    def view_all_books(self):
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
