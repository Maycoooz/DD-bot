from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

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
              
def create_tables():
    
    from models import tables
    
    print("Creating/Checkings tables")
    Base.metadata.create_all(bind=engine)
    print("Tables created/checked successfully")
    
    
def create_tables_and_seed_it():
    create_tables()
    insert_default_roles()
    insert_default_interests()


    