from models import Users
from passlib.hash import bcrypt

print(bcrypt.hash("password"))

