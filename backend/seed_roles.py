# backend/seed_roles.py
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Roles, UserType

def seed_roles():
    default_roles = [
        UserType.ADMIN,
        UserType.PARENT,
        UserType.LIBRARIAN,
        UserType.KID
    ]

    with Session(engine) as session:
        for role_enum in default_roles:
            existing = session.exec(select(Roles).where(Roles.name == role_enum)).first()
            if not existing:
                session.add(Roles(name=role_enum))
                print(f"✅ Added role: {role_enum}")
        session.commit()
        print("🎉 Roles seeded successfully!")

if __name__ == "__main__":
    seed_roles()
