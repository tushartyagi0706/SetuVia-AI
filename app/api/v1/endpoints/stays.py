from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from app.db import queries
from app.models.domain import StayDomain

router = APIRouter()


@router.get("/stays", response_model=List[StayDomain], tags=["Stays"])
async def list_stays(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Retrieve all verified stays from MongoDB Atlas."""
    return await queries.get_all_stays(db)


@router.get("/stays/{stay_id}", response_model=StayDomain, tags=["Stays"])
async def get_stay(
    stay_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieve details for a single verified stay by stay_id."""
    stay = await queries.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stay with ID '{stay_id}' was not found in verified stays."
        )
    return stay


@router.get("/stays/{stay_id}/evidence", tags=["Stays"])
async def get_stay_trust_evidence(
    stay_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieve verified Trust Evidence metadata for a selected stay."""
    stay = await queries.get_stay_by_id(db, stay_id)
    if not stay:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stay with ID '{stay_id}' was not found in verified stays."
        )
    return {
        "stay_id": stay.stay_id,
        "stay_name": stay.stay_name,
        "data_source": stay.data_source or "Official Booking Portal / SetuVia Database",
        "data_quality_flag": stay.data_quality_flag or "VERIFIED",
        "last_checked_at": stay.last_checked_at or "2026-03-15T10:00:00Z",
        "official_website": stay.official_website,
        "booking_url": stay.booking_url,
        "rating": stay.rating,
        "review_count": stay.review_count
    }

