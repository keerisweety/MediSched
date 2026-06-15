# Before (PyMongo - sync)
from pymongo import MongoClient
client = MongoClient(MONGO_URL)

# After (Motor - async)
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient(MONGO_URL)
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME   = os.getenv("DB_NAME")


async def connect_db():
    global client, db
    print("MONGO_URL:", MONGO_URL)
    print("DB_NAME:", DB_NAME)
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db


client = None
db     = None
