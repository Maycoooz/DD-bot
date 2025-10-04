from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, DATE, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base
import enum

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    PARENT = "PARENT"
    CHILD = "CHILD"
    LIBRARIAN = "LIBRARIAN"
    
class Role(Base):
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    name = Column(
        Enum(UserRole, native_enum=False, length=50),
        unique=True,
        nullable=False,
        index=True
    )
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement="auto")
    username = Column(String(length=50), nullable=False, unique=True, index=True)
    email = Column(String(length=100), nullable=True, unique=True, index=True)
    hashed_password = Column(String(length=100), nullable=False)
    
    first_name = Column(String(length=50), nullable=False, index=True)
    last_name = Column(String(length=50), nullable=False, index=True)
    country = Column(String(length=50), nullable=True)
    gender = Column(String(length=20), nullable=True)
    birthday = Column(DATE, nullable=True)
    race = Column(String(length=50), nullable=True)
    
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    role = relationship("Role", back_populates="users")
    
    # Foreign Key that points to the User's own table to identify their parent
    # It is nullable because non children roles wont have them
    primary_parent_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)
    
    # 1. Relationship for getting a user's children:
    # 'children_list' tracks all User records whose primary_parent_id matches this User's ID.
    children_list = relationship(
        "User", 
        back_populates="parent_user", 
        # This tells SQLAlchemy that the 'id' on the remote side is the one being matched.
        remote_side=[id]  
    )
    
    # 2. Relationship for getting a user's parent:
    # 'parent_user' is the single User object pointed to by primary_parent_id.
    parent_user = relationship(
        "User", 
        back_populates="children_list", 
        foreign_keys=[primary_parent_id]
    )

    
    
    
    
    
    
    
    