# backend/models.py
import enum
from typing import Optional, List

from sqlalchemy import Column, Enum, ForeignKey, TEXT, INTEGER, CheckConstraint
from sqlmodel import Field, SQLModel, Relationship, Session 

# The Enum for all possible user types in the database
class UserType(str, enum.Enum):
    ADMIN = "admin"
    PARENT = "parent"
    KID = "kid"
    LIBRARIAN = "librarian"

# Restrictive Enum for registration
class RegisterableUserType(str, enum.Enum):
    PARENT = "parent"
    LIBRARIAN = "librarian"
    KID = "kid"

#status types for librarians 
class StatusType(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SuccessMessage(SQLModel):
    success: bool
    message: str

class MaterialStatus(str, enum.Enum):
    AVAILABLE = "available"
    SUSPENDED = "suspended"

# ---------------------- SCHEMAS FOR ROUTES (INTAKE) ---------------------------------
class UserRegister(SQLModel):
    username: str
    password: str
    first_name: str
    last_name: str
    email: str
    usertype: RegisterableUserType

class UserLogin(SQLModel):
    username: str
    password: str

class KidCreate(SQLModel):
    username: str
    first_name: str
    last_name: str
    password: str
    parent_id: int

class KidDelete(SQLModel):
    username: str
    parent_id: int
    kid_id: int

class DeleteParentAccount(SQLModel):
    user_id: int
    username: str
    password: str

class AddReview(SQLModel):
    parent_id: int
    message: str
    stars: Optional[int] = None

class UpdateLibrarianStatus(SQLModel):
    librarian_id: int
    new_status: StatusType

class AddBook(SQLModel):
    title: str
    author: str
    age_group: Optional[str] = "5-12"
    category: str
    description: str
    link: str
    rating: Optional[int] = 0
    status: Optional[MaterialStatus] = MaterialStatus.AVAILABLE





# ---------------------- SCHEMAS FOR ROUTES (OUTPUT) ---------------------------------
class LoginMessage(SQLModel):
    success: bool
    message: str
    user_id: Optional[int] = None
    usertype: Optional[str] = None

# for parents creating kid account
class CreateKidAccountMessage(SQLModel):
    success: bool
    message: str

# to view kids accounts
class KidAccountDetails(SQLModel):
    username: str
    first_name: str
    last_name: str
    user_id: int
    
class ViewReviews(SQLModel):
    review_id: int
    username: str
    review: str
    stars: Optional[int] = None

class ShowcasedReviewDetails(SQLModel):
    review_id: int
    username: str
    review: str
    stars: int

class LibrarianDetails(SQLModel):
    user_id: int
    username: str
    first_name: str
    last_name: str
    email: str
    status: StatusType




# ------------------------ SQL TABLES ----------------------------------------
class Roles (SQLModel, table=True):
    role_id: int = Field(default=None, primary_key=True)
    name: UserType = Field(sa_column=Column(Enum(UserType), unique=True))
    users: List["Users"] = Relationship(back_populates="role")

class Users(SQLModel, table=True):
    user_id: int = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, nullable=False, max_length=30)
    first_name: str = Field(nullable=False, max_length=50)
    last_name: str = Field(nullable=False, max_length=50)
    email: str = Field(unique=True, nullable=True, max_length=50)
    password_hash: str = Field(nullable=False)

    # Foreign Key
    role_id: int = Field(
        default=None, 
        sa_column=Column(ForeignKey("roles.role_id", ondelete="CASCADE", onupdate="CASCADE"))
    )

    role: Optional["Roles"] = Relationship(back_populates="users")
    reviews: List["ParentReviews"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"passive_deletes": True} 
        )

class LibrarianProfiles(SQLModel, table=True):

    # Foreign Key and Primary Key
    user_id: int = Field(
        default=None,
        sa_column=Column(
            ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"),
            primary_key=True
        )
    )
    status: StatusType = Field(sa_column=Column(Enum(StatusType)), default=StatusType.PENDING)

class KidProfiles(SQLModel, table=True):

    # Foreign Key and Primary Key
    user_id: int = Field(
        default=None,
        sa_column=Column(
            ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"),
            primary_key=True
        )
    )
    parent_id: int = Field(
        sa_column=Column(ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"))
    )

class ParentReviews(SQLModel, table=True):
    # Auto-incrementing primary key for the review itself
    review_id: int = Field(default=None, primary_key=True)

    # user_id foreign key
    user_id: int = Field(
        default=None,
        sa_column=Column(ForeignKey("users.user_id", ondelete="CASCADE", onupdate="CASCADE"))
    )

    # 1 - 5 stars for reviews
    stars: int = Field(
        default=None,
        sa_column=Column(INTEGER, CheckConstraint('stars >= 1 AND stars <= 5'))
    )

    review: str = Field(sa_column=Column(TEXT, nullable=False), default="No comment")

    user: Optional["Users"] = Relationship(
        back_populates="reviews",
        sa_relationship_kwargs={"passive_deletes": True} # when parent delete their account their review is deleted too
        
        )

    chosen_review: Optional["ChosenReviews"] = Relationship(back_populates="original_review")

class ChosenReviews(SQLModel, table=True):
    # the chosen review's ID (review_id), which is both the primary key
    # and a foreign key to the original review.
    review_id: int | None = Field(
        default=None,
        sa_column=Column(
            ForeignKey("parentreviews.review_id", ondelete="CASCADE", onupdate="CASCADE"),
            primary_key=True
        )
    )

    original_review: "ParentReviews" = Relationship(back_populates="chosen_review")


class Books(SQLModel, table=True):

    book_id: int = Field(default=None, primary_key=True)
    title: str = Field(nullable=False, max_length=255)
    author: str = Field(nullable=False, max_length=255)
    age_group: str = Field(nullable=False, max_length=50, default="5-12")
    category: str = Field(nullable=False, max_length=100)
    description: str = Field(
        sa_column=Column(TEXT, nullable=False, default="No description found")
    )
    link: str = Field(nullable=False, max_length=500, unique=True)
    rating: float = Field(default=0.0)
    status: MaterialStatus = Field(
        sa_column=Column(Enum(MaterialStatus), nullable=False, default=MaterialStatus.AVAILABLE)
    )

class Videos(SQLModel, table=True):

    video_id: int = Field(default=None, primary_key=True)
    title: str = Field(nullable=False, max_length=255)
    creator: str = Field(nullable=False, max_length=255)
    age_group: str = Field(nullable=False, max_length=50, default="5-12")
    category: str = Field(nullable=False, max_length=100)
    description: str = Field(
        sa_column=Column(TEXT, nullable=False, default="No description found")
    )
    link: str = Field(nullable=False, max_length=500, unique=True)
    rating: float = Field(default=0.0)
    status: MaterialStatus = Field(
        sa_column=Column(Enum(MaterialStatus), nullable=False, default=MaterialStatus.AVAILABLE)
    )








