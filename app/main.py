import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.v1.api import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("setuvia.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database connection management."""
    logger.info("Starting SetuVia AI FastAPI backend...")
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.warning(f"MongoDB connection failed at startup: {e}. API will run in offline mode.")
    yield
    logger.info("Shutting down SetuVia AI FastAPI backend...")
    await close_mongo_connection()


app = FastAPI(
    title="SetuVia AI - Trip Concierge API",
    description="Grounded travel concierge API using MongoDB Atlas and Gemini AI.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React frontend (http://localhost:5173 & http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "SetuVia AI API",
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "database": settings.MONGODB_DB_NAME
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "setuvia-backend"
    }
