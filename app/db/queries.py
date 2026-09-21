import asyncio
import logging
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.domain import PlaceDomain, RestaurantDomain, ActivityDomain, StayDomain

logger = logging.getLogger("setuvia.db.queries")

# Built-in fallback candidates in case MongoDB Atlas connection is unreachable
DEFAULT_PLACES = [
    {"place_id": "P001", "name": "BAGA BEACH", "category": "Beach", "entry_fee": 0, "rating": 4.5, "location_area": "North Goa", "latitude": 15.5553, "longitude": 73.7517},
    {"place_id": "P002", "name": "FORT AGUADA", "category": "Heritage", "entry_fee": 50, "rating": 4.4, "location_area": "Sinquerim", "latitude": 15.4924, "longitude": 73.7737},
    {"place_id": "P003", "name": "DUDHSAGAR WATERFALLS", "category": "Nature", "entry_fee": 100, "rating": 4.7, "location_area": "Sanguem", "latitude": 15.3144, "longitude": 74.3143},
    {"place_id": "P004", "name": "BASILICA OF BOM JESUS", "category": "Heritage", "entry_fee": 0, "rating": 4.6, "location_area": "Old Goa", "latitude": 15.5009, "longitude": 73.9116},
    {"place_id": "P005", "name": "ANJUNA FLEA MARKET", "category": "Shopping", "entry_fee": 0, "rating": 4.3, "location_area": "Anjuna", "latitude": 15.5786, "longitude": 73.7414},
]

DEFAULT_RESTAURANTS = [
    {"restaurant_id": "R001", "restaurant_name": "Britto's Restaurant & Bar", "cuisine": "Goan; Seafood", "area": "Baga", "district": "North Goa", "latitude": 15.556, "longitude": 73.751, "average_cost_for_two_inr": 1800, "rating_value": 4.3},
    {"restaurant_id": "R002", "restaurant_name": "Fisherman's Wharf", "cuisine": "Seafood; Goan", "area": "Cavelossim", "district": "South Goa", "latitude": 15.172, "longitude": 73.945, "average_cost_for_two_inr": 2200, "rating_value": 4.5},
    {"restaurant_id": "R003", "restaurant_name": "Mum's Kitchen", "cuisine": "Traditional Goan; Veg", "area": "Panaji", "district": "North Goa", "latitude": 15.498, "longitude": 73.821, "average_cost_for_two_inr": 1500, "rating_value": 4.4},
]

DEFAULT_ACTIVITIES = [
    {"activity_id": "A001", "activity_name": "Jet Ski Ride", "category": "Water Sports", "area": "Baga", "district": "North Goa", "cost_inr": 800, "duration_hours": 0.25, "latitude": 15.5556, "longitude": 73.7517},
    {"activity_id": "A002", "activity_name": "Scuba Diving & Water Sports", "category": "Adventure", "area": "Grand Island", "district": "South Goa", "cost_inr": 3500, "duration_hours": 4.0, "latitude": 15.3522, "longitude": 73.7844},
    {"activity_id": "A003", "activity_name": "Mandovi River Dinner Cruise", "category": "Cruises", "area": "Panaji", "district": "North Goa", "cost_inr": 1200, "duration_hours": 2.0, "latitude": 15.4989, "longitude": 73.8278},
]


async def get_all_places(db: AsyncIOMotorDatabase) -> List[PlaceDomain]:
    """Fetch verified places from MongoDB Atlas with fallback."""
    try:
        if db is not None:
            cursor = db["places"].find({}, {"_id": 0})
            docs = await asyncio.wait_for(cursor.to_list(length=1000), timeout=5.0)
            if docs:
                logger.info(f"Retrieved {len(docs)} places from MongoDB Atlas")
                return [PlaceDomain(**doc) for doc in docs]
    except Exception as e:
        logger.warning(f"MongoDB places query failed: {e}. Using fallback records.")

    return [PlaceDomain(**doc) for doc in DEFAULT_PLACES]


async def get_all_restaurants(db: AsyncIOMotorDatabase) -> List[RestaurantDomain]:
    """Fetch verified restaurants from MongoDB Atlas with fallback."""
    try:
        if db is not None:
            cursor = db["restaurants"].find({}, {"_id": 0})
            docs = await asyncio.wait_for(cursor.to_list(length=1000), timeout=5.0)
            if docs:
                logger.info(f"Retrieved {len(docs)} restaurants from MongoDB Atlas")
                return [RestaurantDomain(**doc) for doc in docs]
    except Exception as e:
        logger.warning(f"MongoDB restaurants query failed: {e}. Using fallback records.")

    return [RestaurantDomain(**doc) for doc in DEFAULT_RESTAURANTS]


async def get_all_activities(db: AsyncIOMotorDatabase) -> List[ActivityDomain]:
    """Fetch verified activities from MongoDB Atlas with fallback."""
    try:
        if db is not None:
            cursor = db["activities"].find({}, {"_id": 0})
            docs = await asyncio.wait_for(cursor.to_list(length=1000), timeout=5.0)
            if docs:
                logger.info(f"Retrieved {len(docs)} activities from MongoDB Atlas")
                return [ActivityDomain(**doc) for doc in docs]
    except Exception as e:
        logger.warning(f"MongoDB activities query failed: {e}. Using fallback records.")

    return [ActivityDomain(**doc) for doc in DEFAULT_ACTIVITIES]


async def get_all_stays(db: AsyncIOMotorDatabase) -> List[StayDomain]:
    """Fetch verified stays from MongoDB Atlas (sole source of truth; no static fallback)."""
    try:
        if db is not None:
            cursor = db["stays"].find({}, {"_id": 0})
            docs = await asyncio.wait_for(cursor.to_list(length=1000), timeout=5.0)
            if docs:
                logger.info(f"Retrieved {len(docs)} stays from MongoDB Atlas")
                return [StayDomain(**doc) for doc in docs]
    except Exception as e:
        logger.error(f"MongoDB stays query failed: {e}")

    return []


async def get_stay_by_id(db: AsyncIOMotorDatabase, stay_id: str) -> Optional[StayDomain]:
    """Fetch a single verified stay by stay_id from MongoDB Atlas."""
    try:
        if db is not None and stay_id:
            doc = await asyncio.wait_for(db["stays"].find_one({"stay_id": stay_id}, {"_id": 0}), timeout=5.0)
            if doc:
                return StayDomain(**doc)
    except Exception as e:
        logger.error(f"MongoDB stay_by_id query failed for {stay_id}: {e}")

    return None

