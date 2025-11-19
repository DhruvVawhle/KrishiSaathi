from fastapi import APIRouter, HTTPException, Depends
from models import UserRegister, UserLogin
from database import users_collection
from utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(user: UserRegister):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pw = hash_password(user.password)
    new_user = {"name": user.name, "email": user.email, "password": hashed_pw}
    users_collection.insert_one(new_user)
    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_access_token({"id": str(db_user["_id"]), "email": db_user["email"]})
    return {"token": token, "user": {"name": db_user["name"], "email": db_user["email"]}}
