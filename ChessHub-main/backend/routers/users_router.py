from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
from routers.auth_router import register, login, refresh_token

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/login", response_model=schemas.Token)
@router.post("/login/", response_model=schemas.Token)
async def user_login(request: Request, db: Session = Depends(get_db)):
    return await login(request, db)


@router.post("/register", response_model=schemas.Token)
@router.post("/register/", response_model=schemas.Token)
async def user_register(request: Request, db: Session = Depends(get_db)):
    return await register(request, db)


@router.get("/profile", response_model=schemas.UserOut)
@router.get("/profile/", response_model=schemas.UserOut)
@router.get("/me", response_model=schemas.UserOut)
@router.get("/me/", response_model=schemas.UserOut)
def user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=schemas.Token)
@router.post("/refresh/", response_model=schemas.Token)
@router.post("/refresh-token", response_model=schemas.Token)
@router.post("/refresh-token/", response_model=schemas.Token)
def user_refresh(current_user: models.User = Depends(get_current_user)):
    return refresh_token(current_user)
