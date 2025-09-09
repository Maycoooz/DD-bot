import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List

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
    
    def approve_reject_librarian(self, update_data: models.UpdateLibrarianStatus) -> models.SuccessMessage:

        # find the librarian
        profile_to_update = self.session.get(models.LibrarianProfiles, update_data.librarian_id)

        # if no profile found
        if not profile_to_update:
            return models.SuccessMessage(
                success=False,
                message="Librarian does not exist"
            )
        
        # update status column
        profile_to_update.status = update_data.new_status

        # commit changes
        self.session.add(profile_to_update)
        self.session.commit()
        self.session.refresh(profile_to_update)

        return models.SuccessMessage(
            success=True,
            message="Librarian status updated"
        )
    
    def delete_librarian_account(self, librarian_id: int) -> models.SuccessMessage:

        statement = select(models.Users).where(
            models.Users.user_id == librarian_id
        ).options(selectinload(models.Users.role))

        user_to_delete = self.session.exec(statement).first()

        # check if user exists
        if not user_to_delete:
            return models.SuccessMessage(
                success=False,
                message="User does not exist"
            )
        
        # check if user is a librarian
        if user_to_delete.role.name != models.UserType.LIBRARIAN:
            return models.SuccessMessage(
                success=False,
                message="This user is not a librarian"
            )
        
        # all checks pass, then delete account
        self.session.delete(user_to_delete)
        self.session.commit()

        return models.SuccessMessage(
            success=True,
            message="Librarian account successfully deleted"
        )





