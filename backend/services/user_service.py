import bcrypt
from sqlmodel import Session, select
from .. import models
from sqlalchemy.orm import selectinload

class UserService():

    def __init__(self, session:Session):
        self.session = session

    # only parents and librarians register accounts
    def registerAccount(self, user_data: models.UserRegister) -> bool:

        # check if username or email exists in users tables first
        statement = select(models.Users).where(
            (models.Users.username == user_data.username) |
            (models.Users.email == user_data.email)
        )

        existing_user = self.session.exec(statement).first()

        # if exists return false
        if existing_user:
            return False
        
        # if not exists hash pw
        password_bytes = user_data.password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hashed = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

        # get role based on role type
        role_statement = select(models.Roles).where(models.Roles.name == user_data.usertype.value)
        role = self.session.exec(role_statement).one()

        # create the user
        new_user = models.Users(
            username = user_data.username,
            email = user_data.email,
            password_hash = password_hashed,
            role_id = role.role_id,
            first_name = user_data.first_name,
            last_name = user_data.last_name
        )

        self.session.add(new_user)
        self.session.commit()
        self.session.refresh(new_user)

        # if the user is a librarian add to librarianprofiles table
        if user_data.usertype == models.RegisterableUserType.LIBRARIAN:
            librarian_profile = models.LibrarianProfiles(user_id=new_user.user_id)
            self.session.add(librarian_profile)
            self.session.commit()
            self.session.refresh(librarian_profile)
        
        return True
    
    # login check order
    def login(self, user_data: models.UserLogin) -> models.LoginMessage:
        
        # check if user exists
        statement = select(models.Users).where(
            (models.Users.username == user_data.username)
        ).options(selectinload(models.Users.role))

        existing_user = self.session.exec(statement).first()

        if not existing_user:
            return models.LoginMessage(success=False, message="User does not exist")

        # user exists, so check password
        password_bytes = user_data.password.encode('utf-8')
        stored_hash_bytes = existing_user.password_hash.encode('utf-8')

        is_password_correct = bcrypt.checkpw(password_bytes, stored_hash_bytes)

        if not is_password_correct:
            return models.LoginMessage(success=False, message="Password incorrect")
        
        # check if user is a librarian, check status
        if existing_user.role.name == models.UserType.LIBRARIAN:
            profile_statement = select(models.LibrarianProfiles).where(
                models.LibrarianProfiles.user_id == existing_user.user_id
            )
            librarian_profile = self.session.exec(profile_statement).first()

            # check if librarian profile is NOT approved
            if not librarian_profile or librarian_profile.status != models.StatusType.APPROVED:
                return models.LoginMessage(success=False, message="Librarian account pending review or rejected")
            
        return models.LoginMessage(
            success=True,
            message="Login Successful",
            user_id=existing_user.user_id,
            usertype=existing_user.role.name.value
        )