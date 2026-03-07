# app/database.py
# pip install motor pymongo python-dotenv

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("MONGO_DB_NAME", "placeko")

client = AsyncIOMotorClient(MONGO_URL)
db     = client[DB_NAME]

# Collections
saved_jobs_col   = db["saved_jobs"]
applications_col = db["applications"]
cover_letters_col = db["cover_letters"]
users_col        = db["users"]  # replace fake_users_db in auth.py with this