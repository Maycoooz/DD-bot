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

    




