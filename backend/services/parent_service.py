import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from typing import List

class ParentService():

    def __init__(self, session: Session):
        self.session = session

    # parent creating a kid account
    def create_kid_account(self, kid_data: models.KidCreate) -> models.CreateKidAccountMessage:

        # check if username already exists
        statement = select(models.Users).where(
            models.Users.username == kid_data.username
        )

        user_exists = self.session.exec(statement).first()

        if user_exists:
            creation_data = models.CreateKidAccountMessage
            creation_data.success = False
            creation_data.message = "Username already exists"
            return creation_data

        # if username is available, hash pw
        password_bytes = kid_data.password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hashed = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

       # Get role_id for Kid
        role_statement = select(models.Roles).where(models.Roles.name == models.UserType.KID)
        kid_role = self.session.exec(role_statement).one()

        # Create the new User object to insert into table
        new_kid_user = models.Users(
            username = kid_data.username,
            email = None,
            password_hash = password_hashed,
            role_id = kid_role.role_id,
            first_name = kid_data.first_name,
            last_name = kid_data.last_name
        )

        self.session.add(new_kid_user)
        self.session.commit()
        self.session.refresh(new_kid_user)

        # Create the kid profile to link them to the parent
        kid_profile = models.KidProfiles(
            user_id = new_kid_user.user_id,
            parent_id = kid_data.parent_id
        )
        self.session.add(kid_profile)
        self.session.commit()
        self.session.refresh(kid_profile)

        creation_data = models.CreateKidAccountMessage(
            success=True,
            message="Kid account successfully created"
        )
        return creation_data

    def view_kids_accounts(self, parent_id: int) -> List[models.KidAccountDetails]:

        statement = select(models.Users).join(
            models.KidProfiles,
            models.Users.user_id == models.KidProfiles.user_id
        ).where(
            models.KidProfiles.parent_id == parent_id
        )

        kids_from_db = self.session.exec(statement).all()

        kids_details_list = []
        for kid in kids_from_db:
            kid_detail = models.KidAccountDetails(
                username = kid.username,
                first_name = kid.first_name,
                last_name = kid.last_name,
                user_id=kid.user_id
            )

            kids_details_list.append(kid_detail)

        return kids_details_list
    
    def delete_kids_account(self, delete_data: models.KidDelete) -> models.SuccessMessage:
        
        statement = select(models.Users).join(
            models.KidProfiles,
            models.Users.user_id == models.KidProfiles.user_id
        ).where(
            models.Users.user_id == delete_data.kid_id,
            models.KidProfiles.parent_id == delete_data.parent_id
        )

        user_to_delete = self.session.exec(statement).first()

        if not user_to_delete:
            return models.SuccessMessage(
                success=False,
                message="Kid account does not exist"
            )
        
        self.session.delete(user_to_delete)
        self.session.commit()
        
        return models.SuccessMessage(
            success=True,
            message="Kid account successfully deleted"
        )
    
    def delete_my_account(self, account_data: models.DeleteParentAccount) -> models.SuccessMessage:

        # check if used_id, username & password match parent account first
        user_to_delete = self.session.get(models.Users, account_data.user_id)

        # check if account exists and username matches
        if not user_to_delete or user_to_delete.username != account_data.username:
            return models.SuccessMessage(
                success=False,
                message="Invalid account details provided."
            )
        
        # verify password matches
        password_bytes = account_data.password.encode('utf-8')
        stored_hash_bytes = user_to_delete.password_hash.encode('utf-8')
        is_password_correct = bcrypt.checkpw(password_bytes, stored_hash_bytes)

        if not is_password_correct:
            return models.SuccessMessage(
                success=False,
                message="Invalid account details provided."
            )
        
        # Before deleting parent user delete all the kids account too
        kids = self.session.exec(
            select(models.Users)
            .join(models.KidProfiles, models.Users.user_id == models.KidProfiles.user_id)
            .where(models.KidProfiles.parent_id == user_to_delete.user_id)
        ).all()

        for kid in kids:
            self.session.delete(kid)

        self.session.delete(user_to_delete)
        self.session.commit()


        return models.SuccessMessage(
            success=True,
            message="Your account has been successfully deleted."
        )