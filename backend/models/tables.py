from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, TEXT, CheckConstraint, FLOAT, Enum, and_, DATE
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base
import enum

# --- Enums (No changes needed here) ---
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
    
class ReviewType(enum.Enum):
    BOOK = "BOOK"
    VIDEO = "VIDEO"
    APP = "APP"

# --- Models ---

class Book(Base):
    __tablename__ = "book"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    title = Column(String(length=255), nullable=False, index=True)
    author = Column(String(length=100), nullable=False, index=True)
    age_group = Column(String(length=50), nullable=True)
    category = Column(String(length=100))
    description = Column(TEXT)
    link = Column(String(length=500), nullable=False, unique=True)
    rating = Column(FLOAT, default=0)
    source = Column(String(length=100), nullable=False, default="Kaggle")
    
    # Relationship to get all reviews for this book
    reviews = relationship(
        "Review",
        primaryjoin="and_(Book.id == foreign(Review.reviewable_id), Review.review_type == 'BOOK')",
        cascade="all, delete-orphan",
        lazy="dynamic" # Use lazy='dynamic' if you expect many reviews
    )

class Video(Base):
    __tablename__ = "video"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    title = Column(String(length=255), nullable=False, index=True)
    creator = Column(String(length=100), nullable=False, index=True)
    age_group = Column(String(length=50), nullable=True)
    category = Column(String(length=100))
    description = Column(TEXT)
    link = Column(String(length=500), nullable=False, unique=True)
    rating = Column(FLOAT, default=0)
    source = Column(String(length=100), nullable=False, default="Youtube")

    # Relationship to get all reviews for this video
    reviews = relationship(
        "Review",
        primaryjoin="and_(Video.id == foreign(Review.reviewable_id), Review.review_type == 'VIDEO')",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

class Review(Base):
    __tablename__ = "review"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"))
    review = Column(TEXT, nullable=False)
    stars = Column(Integer, CheckConstraint('stars >= 1 AND stars <= 5'), nullable=False)
    
    # Polymorphic relationship columns
    reviewable_id = Column(Integer, nullable=False)
    review_type = Column(
        Enum(ReviewType, native_enum=False, length=50),
        nullable=False,
        index=True
    )
    
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="reviews")

class Interest(Base):
    __tablename__ = "interest"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    name = Column(Enum(InterestsList, native_enum=False, length=50), unique=True, nullable=False, index=True)
    children = relationship("User", secondary="childinterest", back_populates="interests")

class ChildInterest(Base):
    __tablename__ = "childinterest"
    child_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    interest_id = Column(Integer, ForeignKey("interest.id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)

class Role(Base):
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, autoincrement="auto")
    name = Column(Enum(UserRole, native_enum=False, length=50), unique=True, nullable=False, index=True)
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
    tier = Column(Enum(SubscriptionTier, native_enum=False, length=30), nullable=True) 
    role_id = Column(Integer, ForeignKey("role.id"), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    librarian_verified = Column(Boolean, default=False, nullable=False, index=True)
    
    role = relationship("Role", back_populates="users")
    
    primary_parent_id = Column(Integer, ForeignKey("user.id"), nullable=True, index=True)
    children_list = relationship("User", back_populates="parent_user", remote_side=[id])
    parent_user = relationship("User", back_populates="children_list", foreign_keys=[primary_parent_id])
    
    interests = relationship("Interest", secondary="childinterest", back_populates="children")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

class LandingPage(Base):
    __tablename__ = "landingpage"
   
    id = Column(Integer, primary_key=True, autoincrement="auto") 
    # Intro, Feature, How it work
    display_type = Column(String(length=50), nullable=False)
    # 1 + 6 + 3
    display_text = Column(String(length=255), nullable=False)