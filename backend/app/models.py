import datetime
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DELIVERY_AGENT = "DELIVERY_AGENT"
    CUSTOMER = "CUSTOMER"

class OrderType(str, enum.Enum):
    B2B = "B2B"
    B2C = "B2C"

class PaymentType(str, enum.Enum):
    PREPAID = "PREPAID"
    COD = "COD"

class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    AGENT_ASSIGNED = "AGENT_ASSIGNED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    RESCHEDULED = "RESCHEDULED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    orders_as_customer = relationship("Order", foreign_keys="Order.customer_id", back_populates="customer")
    orders_as_agent = relationship("Order", foreign_keys="Order.agent_id", back_populates="agent")
    agent_location = relationship("AgentLocation", back_populates="agent", uselist=False)

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    areas = relationship("Area", back_populates="zone", cascade="all, delete-orphan")

class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    zone = relationship("Zone", back_populates="areas")

class RateCard(Base):
    __tablename__ = "rate_cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Standard Rate Card")
    b2b_intra_rate = Column(Float, nullable=False, default=50.0)
    b2b_inter_rate = Column(Float, nullable=False, default=100.0)
    b2c_intra_rate = Column(Float, nullable=False, default=40.0)
    b2c_inter_rate = Column(Float, nullable=False, default=80.0)
    b2b_cod_surcharge = Column(Float, nullable=False, default=30.0)
    b2c_cod_surcharge = Column(Float, nullable=False, default=20.0)
    volumetric_factor = Column(Float, nullable=False, default=5000.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AgentLocation(Base):
    __tablename__ = "agent_locations"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    current_lat = Column(Float, default=12.9716)
    current_lng = Column(Float, default=77.5946)
    is_available = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    agent = relationship("User", back_populates="agent_location")
    zone = relationship("Zone")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    pickup_area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    drop_area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    pickup_address = Column(Text, nullable=False)
    drop_address = Column(Text, nullable=False)

    dimensions_l = Column(Float, nullable=False)  # in cm
    dimensions_b = Column(Float, nullable=False)  # in cm
    dimensions_h = Column(Float, nullable=False)  # in cm
    actual_weight = Column(Float, nullable=False)  # in kg
    volumetric_weight = Column(Float, nullable=False)  # in kg
    billing_weight = Column(Float, nullable=False)  # in kg

    order_type = Column(SQLEnum(OrderType), nullable=False)
    payment_type = Column(SQLEnum(PaymentType), nullable=False)

    base_charge = Column(Float, nullable=False)
    cod_surcharge = Column(Float, default=0.0)
    total_charge = Column(Float, nullable=False)

    current_status = Column(SQLEnum(OrderStatus), default=OrderStatus.CREATED, nullable=False)
    reschedule_count = Column(Integer, default=0)
    scheduled_delivery_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="orders_as_customer")
    created_by = relationship("User", foreign_keys=[created_by_id])
    agent = relationship("User", foreign_keys=[agent_id], back_populates="orders_as_agent")
    pickup_area = relationship("Area", foreign_keys=[pickup_area_id])
    drop_area = relationship("Area", foreign_keys=[drop_area_id])

    tracking_history = relationship("OrderTrackingHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderTrackingHistory.timestamp.asc()")
    notifications = relationship("Notification", back_populates="order", cascade="all, delete-orphan")

class OrderTrackingHistory(Base):
    __tablename__ = "order_tracking_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actor_role = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="tracking_history")
    actor = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    recipient = Column(String(100), nullable=False)
    channel = Column(String(20), nullable=False)  # EMAIL or SMS
    status = Column(String(20), default="SENT")
    subject = Column(String(255), nullable=True)
    payload = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="notifications")
