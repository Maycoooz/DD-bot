from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import date

import os
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No DATABASE_URL set for connection")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    

def insert_default_roles():
    print("Inserting Default Roles...")
    from models.tables import Role
    default_roles = [
        {"name": "ADMIN"},
        {"name": "PARENT"},
        {"name": "CHILD"},
        {"name": "LIBRARIAN"}
    ]
    
    db: Session = SessionLocal()
    
    try:
        for role_data in default_roles:
            exists = db.query(Role).filter(Role.name == role_data["name"]).first()
            
            if not exists:
                new_role = Role(name=role_data["name"])
                db.add(new_role)
                print(f"New role added: {role_data['name']}")
            else:
                print(f"Default Role already in database: {role_data['name']}")
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"An error has occurred during default role insertion: {e}")
        
    finally:
        db.close()
        

def insert_default_interests():
    print("Inserting Default Interests...")
    from models.tables import Interest
    default_interests = [
        {"name": "FICTION"},
        {"name": "NONFICTION"},
        {"name": "COMIC"},
        {"name": "ART"},
        {"name": "GEOGRAPHY"},
        {"name": "SCIENCE"},
        {"name": "ANIMALS"},
        {"name": "HISTORY"},
        {"name": "FANTASY"},
        {"name": "TECHNOLOGY"},
        {"name": "SPORTS"},
        {"name": "COOKING"}
    ]
    
    db: Session = SessionLocal()
    
    try:
        for interest_data in default_interests:
            exists = db.query(Interest).filter(Interest.name == interest_data['name']).first()
            
            if not exists:
                new_interest = Interest(name=interest_data['name'])
                db.add(new_interest)
                print(f"New Interest added: {interest_data['name']}")
            else:
                print(f"Default Interest already added in database: {interest_data['name']}")
                
            db.commit()
            
    except Exception as e:
        db.rollback()
        print(f"An error has occurred during defaut interest insertion: {e}")
        
    finally:
        db.close()
        


def insert_default_admin():
    print("Inserting default admin...")
    from models.tables import User
    
    DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hashed = pwd_context.hash(DEFAULT_ADMIN_PASSWORD)
    
    admin_user = User(
        username="admin",
        hashed_password=password_hashed,
        first_name="Administrator",
        last_name="01",
        role_id = 1, # admin role id
        is_verified = True
    )
    
    db: Session = SessionLocal()
    
    try:
        exists = db.query(User).filter(User.username == admin_user.username).first()
        
        if not exists:
            db.add(admin_user)
        else:
            print(f"Default admin already in database: {admin_user.username}")
              
        db.commit()  
          
    except Exception as e:
        db.rollback()
        print(f"An error has occured during default admin insertion: {e}")
    finally:
        db.close()
        
import os
from datetime import date
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from db.database import SessionLocal # Assuming this is your session maker
from models.tables import User

def insert_default_librarians():
    """
    Inserts two default librarian accounts for testing:
    1. A fully verified librarian.
    2. A librarian who is email-verified but pending admin approval.
    """
    print("Inserting default librarian accounts...")
    
    librarian_configs = [
        {
            "username": "librarian_full",
            "email": "librarian_full@example.com",
            "first_name": "Librarian",
            "last_name": "Approved",
            "country": "Singapore",
            "gender": "Female",
            "birthday": date(1990, 1, 1),
            "race": "Not Specified",
            "env_password_var": "DEFAULT_LIBRARIAN_FULL_PASSWORD",
            "is_verified": True,
            "librarian_verified": True
        },
        {
            "username": "librarian_pending",
            "email": "librarian_pending@example.com",
            "first_name": "Librarian",
            "last_name": "Pending",
            "country": "Singapore",
            "gender": "Male",
            "birthday": date(1995, 5, 5),
            "race": "Not Specified",
            "env_password_var": "DEFAULT_LIBRARIAN_PENDING_PASSWORD",
            "is_verified": True,
            "librarian_verified": False
        }
    ]
    
    db: Session = SessionLocal()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        for config in librarian_configs:
            exists = db.query(User).filter(User.username == config["username"]).first()
            if exists:
                print(f"Default librarian '{config['username']}' already exists.")
                continue

            password = os.getenv("DEFAULT_ADMIN_PASSWORD")
            if not password:
                print(f"ERROR: Password environment variable '{config['env_password_var']}' not set. Skipping '{config['username']}'.")
                continue
            
            password_hashed = pwd_context.hash(password)
            
            new_librarian = User(
                username=config["username"],
                email=config["email"],
                hashed_password=password_hashed,
                first_name=config["first_name"],
                last_name=config["last_name"],
                country=config["country"],
                gender=config["gender"],
                birthday=config["birthday"],
                race=config["race"],
                role_id=4, # Assuming 4 is the LIBRARIAN role ID
                is_verified=config["is_verified"],
                librarian_verified=config["librarian_verified"]
            )
            db.add(new_librarian)
            print(f"Staged default librarian '{config['username']}' for creation.")

        db.commit()
        print("Librarian accounts committed successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred during default librarian insertion: {e}")
    finally:
        db.close()

def insert_default_parent():
    print("Inserting default parent account...")
    
    DEFAULT_PARENT_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD")
    
    # Safety check for the missing password
    if not DEFAULT_PARENT_PASSWORD:
        print("ERROR: DEFAULT_PARENT_PASSWORD environment variable not set. Cannot create parent.")
        return

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password_hashed = pwd_context.hash(DEFAULT_PARENT_PASSWORD)
    
    # Define the parent user's details
    parent_user = User(
        username="parent",
        email="parent@example.com",
        hashed_password=password_hashed,
        first_name="Parent",
        last_name="01",
        country="Singapore",
        gender="Male",
        birthday=date(1985, 10, 15),
        race="Chinese",
        role_id=2,  # Assuming 2 is the PARENT role ID
        is_verified=True,
        tier="FREE"
    )
    
    db: Session = SessionLocal()
    
    try:
        # Check if a user with this username already exists
        exists = db.query(User).filter(User.username == parent_user.username).first()
        
        if not exists:
            db.add(parent_user)
            db.commit()
            print("Default parent user 'parent' created successfully.")
        else:
            print(f"Default parent '{exists.username}' already exists in the database.")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred during default parent insertion: {e}")
    finally:
        db.close()
        
        
# Default content for the landing page
DEFAULT_CONTENT = [
    # Introduction
    {"display_type": "INTRODUCTION", "display_text": "DD Bot is an intelligent chatbot designed to help parents find the perfect books and videos for their children. Our AI-powered recommendations are tailored to your child's age, interests, and learning goals."},
    
    # Features (add one for each feature)
    {"display_type": "FEATURE", "display_text": "Get books and videos tailored to your child’s age and interests."},
    {"display_type": "FEATURE", "display_text": "Curated videos that enhance your child’s reading and learning."},
    {"display_type": "FEATURE", "display_text": "All recommendations are age-appropriate and parent-approved."},
    {"display_type": "FEATURE", "display_text": "Monitor reading and watching habits to guide your child’s growth."},
    {"display_type": "FEATURE", "display_text": "Manage child accounts and view personalized insights easily."},
    {"display_type": "FEATURE", "display_text": "Learn and explore in different languages."},

    # How It Works
    {"display_type": "HOW_IT_WORKS", "display_text": "Sign up and create profiles for your children."},
    {"display_type": "HOW_IT_WORKS", "display_text": "Tell us about your child’s interests and preferences."},
    {"display_type": "HOW_IT_WORKS", "display_text": "Receive personalized book and video suggestions instantly."},
]

def seed_landing_page():
    from models.tables import LandingPage
    db = SessionLocal()
    try:
        # Check if the table is already seeded
        if db.query(LandingPage).count() > 0:
            print("LandingPage table already contains data. Skipping seed.")
            return

        print("Seeding LandingPage table with default content...")
        for item in DEFAULT_CONTENT:
            db_item = LandingPage(
                display_type=item["display_type"],
                display_text=item["display_text"]
            )
            db.add(db_item)
        
        db.commit()
        print("Successfully seeded LandingPage table.")
    
    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
    finally:
        db.close()


 
def create_tables():
    
    from models import tables
    
    print("Creating/Checkings tables")
    Base.metadata.create_all(bind=engine)
    print("Tables created/checked successfully")
    
    
def create_tables_and_seed_it():
    create_tables()
    insert_default_roles()
    insert_default_interests()
    insert_default_admin()
    insert_default_librarians()
    insert_default_parent()
    seed_landing_page()
    

    