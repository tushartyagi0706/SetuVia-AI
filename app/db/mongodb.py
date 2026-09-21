import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("setuvia.db")


class DatabaseManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_manager = DatabaseManager()


async def connect_to_mongo():
    logger.info("Connecting to MongoDB Atlas...")
    try:
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        await db_manager.client.admin.command("ping")
        logger.info(f"Successfully connected to MongoDB database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.warning(f"Standard TLS connection failed: {e}. Retrying with TLS fallback...")
        try:
            db_manager.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=5000
            )
            db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
            await db_manager.client.admin.command("ping")
            logger.info(f"Successfully connected to MongoDB database (TLS fallback): {settings.MONGODB_DB_NAME}")
        except Exception as e2:
            logger.error(f"MongoDB Atlas connection error: {e2}")
            # Initialize client for queries
            db_manager.client = AsyncIOMotorClient(settings.MONGODB_URI)
            db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]


async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    return db_manager.db
