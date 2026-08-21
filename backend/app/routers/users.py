from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, AgentLocation
from app.schemas import UserResponse, UserRegister, AgentLocationResponse, AgentLocationUpdate
from app.auth import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/agents", response_model=List[UserResponse])
def get_delivery_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    agents = db.query(User).filter(User.role == UserRole.DELIVERY_AGENT).all()
    return agents

@router.post("/agents", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_agent(
    agent_data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    existing_user = db.query(User).filter(User.email == agent_data.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    new_agent = User(
        name=agent_data.name,
        email=agent_data.email,
        phone=agent_data.phone,
        hashed_password=hash_password(agent_data.password),
        role=UserRole.DELIVERY_AGENT,
        is_active=True
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)

    # Initialize agent location record
    loc = AgentLocation(
        agent_id=new_agent.id,
        is_available=True,
        current_lat=12.9716,
        current_lng=77.5946
    )
    db.add(loc)
    db.commit()

    return new_agent

@router.patch("/agents/{agent_id}/availability", response_model=AgentLocationResponse)
def update_agent_availability(
    agent_id: int,
    location_update: AgentLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Agent can only update self, Admin can update any agent
    if current_user.role != UserRole.ADMIN and current_user.id != agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this agent's status")

    loc = db.query(AgentLocation).filter(AgentLocation.agent_id == agent_id).first()
    if not loc:
        loc = AgentLocation(agent_id=agent_id)
        db.add(loc)

    if location_update.is_available is not None:
        loc.is_available = location_update.is_available
    if location_update.zone_id is not None:
        loc.zone_id = location_update.zone_id
    if location_update.current_lat is not None:
        loc.current_lat = location_update.current_lat
    if location_update.current_lng is not None:
        loc.current_lng = location_update.current_lng

    db.commit()
    db.refresh(loc)
    return loc

@router.get("/customers", response_model=List[UserResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    return customers
