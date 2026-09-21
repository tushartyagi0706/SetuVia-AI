from typing import List
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.db import queries
from app.models.domain import PlaceDomain, RestaurantDomain, ActivityDomain

router = APIRouter()


@router.get("/places", response_model=List[PlaceDomain], tags=["Places"])
async def list_places(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieve all 114 verified places from MongoDB Atlas."""
    return await queries.get_all_places(db)


@router.get("/restaurants", response_model=List[RestaurantDomain], tags=["Restaurants"])
async def list_restaurants(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieve all 25 verified restaurants from MongoDB Atlas."""
    return await queries.get_all_restaurants(db)


@router.get("/activities", response_model=List[ActivityDomain], tags=["Activities"])
async def list_activities(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieve all 25 verified activities from MongoDB Atlas."""
    return await queries.get_all_activities(db)
