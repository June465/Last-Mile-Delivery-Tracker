import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import User, UserRole, AgentLocation, Order, Area, Zone

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    # Standard Euclidean distance for fast local spatial matching
    return math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2)

def find_nearest_available_agent(db: Session, order: Order) -> Optional[User]:
    # 1. Fetch pickup area & zone
    pickup_area = db.query(Area).filter(Area.id == order.pickup_area_id).first()
    pickup_zone_id = pickup_area.zone_id if pickup_area else None

    # Target coordinates (Default to Bengaluru center 12.9716, 77.5946 if area doesn't specify)
    target_lat = 12.9716
    target_lng = 77.5946

    # Query active delivery agents who have location records and are marked available
    query = db.query(User).join(AgentLocation).filter(
        User.role == UserRole.DELIVERY_AGENT,
        User.is_active == True,
        AgentLocation.is_available == True
    )

    # 2. Try to match agents in the pickup zone first
    zone_agents = []
    if pickup_zone_id:
        zone_agents = query.filter(AgentLocation.zone_id == pickup_zone_id).all()

    candidate_agents = zone_agents if zone_agents else query.all()

    if not candidate_agents:
        return None

    # 3. Find candidate with minimum distance to target pickup
    best_agent = None
    min_dist = float("inf")

    for agent in candidate_agents:
        loc = agent.agent_location
        if loc:
            dist = calculate_distance(loc.current_lat, loc.current_lng, target_lat, target_lng)
            if dist < min_dist:
                min_dist = dist
                best_agent = agent

    return best_agent
