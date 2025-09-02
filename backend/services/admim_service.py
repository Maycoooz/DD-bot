import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List
import bleach

class AdminService():

    def __init__(self, session: Session):
        self.session = session

    
    def get_all_librarians(self) -> List[models.LibrarianDetails]:

        statement = select(models.Users, models.LibrarianProfiles).join(
            models.LibrarianProfiles,
            models.Users.user_id == models.LibrarianProfiles.user_id
        )

        # result is a tuplie of (user, profile)
        all_librarians = self.session.exec(statement).all()

        list_of_librarians = []

        for user, librarian_profile in all_librarians:
            librarian_data = models.LibrarianDetails(
                user_id=user.user_id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                status=librarian_profile.status
            )

            list_of_librarians.append(librarian_data)

        return list_of_librarians




