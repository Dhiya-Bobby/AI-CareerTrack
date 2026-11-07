import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_careertrack")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Collections:
# 1. users
# 2. job_applications
# 3. resumes
# 4. resume_analysis
# 5. skill_gap_analysis
# 6. interview_sessions
# 7. interview_questions
# 8. notifications

users_collection = db["users"]
applications_collection = db["job_applications"]
resumes_collection = db["resumes"]
resume_analysis_collection = db["resume_analysis"]
skill_gap_collection = db["skill_gap_analysis"]
interview_sessions_collection = db["interview_sessions"]
interview_questions_collection = db["interview_questions"]
notifications_collection = db["notifications"]

async def init_indexes():
    """Ensure database indexes are configured for performance and uniqueness."""
    try:
        await users_collection.create_index("email", unique=True)
        await applications_collection.create_index([("user_id", 1), ("application_date", -1)])
        await resumes_collection.create_index([("user_id", 1), ("createdAt", -1)])
        await notifications_collection.create_index([("user_id", 1), ("read", 1)])
    except Exception as e:
        print(f"Index creation notice: {e}")
