from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()  # loads variables from .env in current working directory

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is missing")

client = MongoClient(MONGO_URI)
db = client["krishisaathi"]
users_collection = db["users"]
