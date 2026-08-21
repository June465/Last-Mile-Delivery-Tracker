from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Zone, Area, RateCard, AgentLocation
from app.auth import hash_password

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).first():
            return

        admin = User(
            name="Admin User",
            email="admin@delivery.com",
            phone="9999999999",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        agent1 = User(
            name="Rahul Agent (Central)",
            email="agent1@delivery.com",
            phone="9888888881",
            hashed_password=hash_password("agent123"),
            role=UserRole.DELIVERY_AGENT
        )
        agent2 = User(
            name="Vikram Agent (South)",
            email="agent2@delivery.com",
            phone="9888888882",
            hashed_password=hash_password("agent123"),
            role=UserRole.DELIVERY_AGENT
        )
        customer1 = User(
            name="Priya Customer",
            email="customer@delivery.com",
            phone="9777777777",
            hashed_password=hash_password("customer123"),
            role=UserRole.CUSTOMER
        )

        db.add_all([admin, agent1, agent2, customer1])
        db.commit()

        zone_central = Zone(name="Central Zone", code="Z-CENTRAL", description="Downtown & Business Hubs")
        zone_south = Zone(name="South Zone", code="Z-SOUTH", description="Residential & IT Corridors")
        zone_north = Zone(name="North Zone", code="Z-NORTH", description="Suburbs & Airport Link")

        db.add_all([zone_central, zone_south, zone_north])
        db.commit()

        areas = [
            Area(name="MG Road", pincode="560001", zone_id=zone_central.id),
            Area(name="Indiranagar", pincode="560038", zone_id=zone_central.id),
            Area(name="Koramangala", pincode="560095", zone_id=zone_south.id),
            Area(name="Electronic City", pincode="560100", zone_id=zone_south.id),
            Area(name="Hebbal", pincode="560024", zone_id=zone_north.id),
            Area(name="Yelahanka", pincode="560064", zone_id=zone_north.id),
        ]
        db.add_all(areas)
        db.commit()

        rate_card = RateCard(
            name="Default Rate Card 2026",
            b2b_intra_rate=50.0,
            b2b_inter_rate=100.0,
            b2c_intra_rate=40.0,
            b2c_inter_rate=80.0,
            b2b_cod_surcharge=30.0,
            b2c_cod_surcharge=20.0,
            volumetric_factor=5000.0,
            is_active=True
        )
        db.add(rate_card)

        loc1 = AgentLocation(
            agent_id=agent1.id,
            zone_id=zone_central.id,
            current_lat=12.9716,
            current_lng=77.5946,
            is_available=True
        )
        loc2 = AgentLocation(
            agent_id=agent2.id,
            zone_id=zone_south.id,
            current_lat=12.9352,
            current_lng=77.6245,
            is_available=True
        )
        db.add_all([loc1, loc2])

        db.commit()
        print("Database successfully seeded with default users, zones, areas, and rate cards.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
