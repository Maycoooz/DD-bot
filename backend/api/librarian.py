# backend/api/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database

router = APIRouter(
    prefix="/librarian",
    tag=["Librarian"]
)