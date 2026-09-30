import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register", response_model=schemas.Token)
@router.post("/register/", response_model=schemas.Token)
async def register(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    full_name = None
    email = None
    password = None
    age = None
    gender = None
    profile_url = None

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        full_name = form.get("full_name") or form.get("username")
        email = form.get("email")
        password = form.get("password")
        raw_age = form.get("age")
        if raw_age and str(raw_age).isdigit():
            age = int(raw_age)
        gender = form.get("gender")

        file_obj = form.get("profile_picture")
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            ext = os.path.splitext(file_obj.filename)[1] or ".png"
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            contents = await file_obj.read()
            with open(filepath, "wb") as f:
                f.write(contents)
            profile_url = f"/uploads/avatars/{filename}"
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        full_name = body.get("full_name") or body.get("username")
        email = body.get("email")
        password = body.get("password")
        age = body.get("age")
        gender = body.get("gender")
        profile_url = body.get("profile_picture_url")

    if not email and full_name and "@" not in str(full_name):
        email = f"{str(full_name).strip().lower()}@chesshub.com"

    if not email or not password or not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name, email, and password are required."
        )

    email_clean = str(email).strip().lower()

    # Check if email is already registered
    existing_user = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please log in instead."
        )

    hashed_pw = get_password_hash(str(password))
    user = models.User(
        full_name=str(full_name).strip(),
        email=email_clean,
        hashed_password=hashed_pw,
        age=age,
        gender=str(gender) if gender else None,
        profile_picture_url=profile_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "access": access_token,
        "refresh_token": access_token,
        "refresh": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=schemas.Token)
@router.post("/login/", response_model=schemas.Token)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    email_or_user = None
    password = None

    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        email_or_user = form.get("email") or form.get("username")
        password = form.get("password")
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        email_or_user = body.get("email") or body.get("username")
        password = body.get("password")

    if not email_or_user or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    clean_id = str(email_or_user).strip().lower()
    user = db.query(models.User).filter(models.User.email == clean_id).first()
    if not user:
        # Check by email prefix / username
        all_users = db.query(models.User).all()
        for u in all_users:
            if u.email.split("@")[0].lower() == clean_id or u.full_name.strip().lower() == clean_id:
                user = u
                break

    if not user or not verify_password(str(password), user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "access": access_token,
        "refresh_token": access_token,
        "refresh": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=schemas.UserOut)
@router.get("/me/", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
@router.put("/me/", response_model=schemas.UserOut)
def update_me(
    update_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.age is not None:
        current_user.age = update_data.age
    if update_data.gender is not None:
        current_user.gender = update_data.gender
    if update_data.profile_picture_url is not None:
        current_user.profile_picture_url = update_data.profile_picture_url

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password")
@router.put("/change-password/")
def change_password(
    data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/logout")
@router.post("/logout/")
def logout():
    return {"message": "Logged out successfully."}


@router.post("/refresh-token", response_model=schemas.Token)
@router.post("/refresh-token/", response_model=schemas.Token)
@router.post("/refresh", response_model=schemas.Token)
@router.post("/refresh/", response_model=schemas.Token)
def refresh_token(current_user: models.User = Depends(get_current_user)):
    access_token = create_access_token(data={"sub": current_user.email})
    return {
        "access_token": access_token,
        "access": access_token,
        "refresh_token": access_token,
        "refresh": access_token,
        "token_type": "bearer",
        "user": current_user
    }
