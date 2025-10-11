from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, DATE, Enum, TEXT, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base
import enum

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    PARENT = "PARENT"
    CHILD = "CHILD"
    LIBRARIAN = "LIBRARIAN"
    
class SubscriptionTier(enum.Enum):
    PRO = "PRO"
    FREE = "FREE"
    
class InterestsList(enum.Enum):
    FICTION = "FICTION"
    NONFICTION = "NONFICTION"
    COMIC = "COMIC"
    ART = "ART"
    GEOGRAPHY = "GEOGRAPHY"
    SCIENCE = "SCIENCE"
    ANIMALS = "ANIMALS"
    HISTORY = "HISTORY"
    FANTASY = "FANTASY"
    TECHNOLOGY = "TECHNOLOGY"
    SPORTS = "SPORTS"
    COOKING = "COOKING"
    
''' 
class ReviewType(enum.Enum):
    BOOK = "BOOK"
    VIDEO = "VIDEO"
    APP = "APP"


class Review(Base):
    __tablename__ = "review"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"))
    review = Column(TEXT, nullable=False)
    stars = Column(Integer, CheckConstraint('stars >= 1 AND stars <=5'),nullable=False)
    
    # -------------------- TODO ------------------------
    # book_id = Column()
    # video_id = Column()
    # --------------------------------------------------
    
    review_type = Column(
        Enum(ReviewType, native_enum=False, length=50),
        nullable=False,
        index=True
    )
    
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="reviews")
'''

class Interest(Base):
    __tablename__ = "interest"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    name = Column(
        Enum(InterestsList, native_enum=False, length=50),
        unique=True,
        nullable=False,
        index=True
    )
    
    # Relationship to get all children with this interest
    children = relationship(
        "User",
        secondary="childinterest",
        back_populates="interests"
    )

class ChildInterest(Base):
    __tablename__ = "childinterest"
    
    # Foreign key to the User table (specifically, the child)
    child_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    
    # Foreign key to the Interest table
    interest_id = Column(Integer, ForeignKey("interest.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

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
    
    # Only parents and children can have tiers
    tier = Column(
        Enum(SubscriptionTier, native_enum=False, length=30),
        nullable=True
    ) 
    
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    
    role = relationship("Role", back_populates="users")
    
    # Foreign Key that points to the User's own table to identify their parent
    # It is nullable because non children roles wont have them
    primary_parent_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)
    
    # 1. Relationship for getting a user's children:
    # 'children_list' tracks all User records whose primary_parent_id matches this User's ID.
    children_list = relationship(
        "User", 
        back_populates="parent_user", 
        remote_side=[id]
    )
    
    # 2. Relationship for getting a user's parent:
    # 'parent_user' is the single User object pointed to by primary_parent_id.
    parent_user = relationship(
        "User", 
        back_populates="children_list", 
        foreign_keys=[primary_parent_id]
    )
    
    # 3. Relationship for getting a child's interests
    interests = relationship(
        "Interest",
        secondary="childinterest",
        back_populates="children"
    )
    
    '''
    # 4. Relationship for getting user's reviews
    reviews = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    '''

class LandingPage(Base):
    __tablename__ = "landingpage"
   
    id = Column(Integer, primary_key=True, autoincrement="auto") 
    
    # Introduction, 6 Features, 3 How-It-Works, 2 Pricing(FREE, PRO)
    display_type = Column(String(length=50), nullable=False)
    
    # What each of the display type shows
    display_text = Column(String(length=255), nullable=False)
    
    
    
    
    
    
    
    
    
    