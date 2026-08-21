from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Zone, Area, UserRole, User
from app.schemas import ZoneCreate, ZoneResponse, AreaCreate, AreaResponse
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/zones", tags=["Zones & Areas"])

@router.get("", response_model=List[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()

@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone_data: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    existing = db.query(Zone).filter(Zone.name == zone_data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zone with this name already exists")

    new_zone = Zone(name=zone_data.name, code=zone_data.code, description=zone_data.description)
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.put("/{zone_id}", response_model=ZoneResponse)
def update_zone(
    zone_id: int,
    zone_data: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    zone.name = zone_data.name
    zone.code = zone_data.code
    zone.description = zone_data.description
    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    db.delete(zone)
    db.commit()
    return None

@router.post("/{zone_id}/areas", response_model=AreaResponse, status_code=status.HTTP_201_CREATED)
def add_area_to_zone(
    zone_id: int,
    area_data: AreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

    new_area = Area(name=area_data.name, pincode=area_data.pincode, zone_id=zone_id)
    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return new_area

@router.delete("/areas/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    db.delete(area)
    db.commit()
    return None
