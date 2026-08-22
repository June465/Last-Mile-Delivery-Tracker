import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models import UserRole, OrderType, PaymentType, OrderStatus

# --- Auth & User Schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# --- Zone & Area Schemas ---
class AreaCreate(BaseModel):
    name: str
    pincode: str

class AreaResponse(BaseModel):
    id: int
    name: str
    pincode: str
    zone_id: int

    class Config:
        from_attributes = True

class ZoneCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class ZoneResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    areas: List[AreaResponse] = []

    class Config:
        from_attributes = True

# --- Rate Card & Calculation Schemas ---
class RateCardCreate(BaseModel):
    name: str = "Standard Rate Card"
    b2b_intra_rate: float
    b2b_inter_rate: float
    b2c_intra_rate: float
    b2c_inter_rate: float
    b2b_cod_surcharge: float
    b2c_cod_surcharge: float
    volumetric_factor: float = 5000.0

class RateCardResponse(RateCardCreate):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class RatePreviewRequest(BaseModel):
    pickup_area_id: int
    drop_area_id: int
    dimensions_l: float = Field(..., gt=0, description="Length in cm")
    dimensions_b: float = Field(..., gt=0, description="Breadth in cm")
    dimensions_h: float = Field(..., gt=0, description="Height in cm")
    actual_weight: float = Field(..., gt=0, description="Weight in kg")
    order_type: OrderType
    payment_type: PaymentType

class RatePreviewResponse(BaseModel):
    pickup_zone_name: str
    drop_zone_name: str
    is_intra_zone: bool
    volumetric_weight: float
    actual_weight: float
    billing_weight: float
    applied_rate_per_kg: float
    base_charge: float
    cod_surcharge: float
    total_charge: float

# --- Agent Location Schemas ---
class AgentLocationUpdate(BaseModel):
    zone_id: Optional[int] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    is_available: Optional[bool] = None

class AgentLocationResponse(BaseModel):
    id: int
    agent_id: int
    zone_id: Optional[int] = None
    current_lat: float
    current_lng: float
    is_available: bool
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Order & Lifecycle Schemas ---
class OrderCreate(BaseModel):
    customer_id: Optional[int] = None  # Admin can specify; Customer defaults to self
    pickup_area_id: int
    drop_area_id: int
    pickup_address: str
    drop_address: str
    dimensions_l: float = Field(..., gt=0)
    dimensions_b: float = Field(..., gt=0)
    dimensions_h: float = Field(..., gt=0)
    actual_weight: float = Field(..., gt=0)
    order_type: OrderType
    payment_type: PaymentType

class OrderStatusUpdate(BaseModel):
    new_status: OrderStatus
    notes: Optional[str] = None

class OrderAssignRequest(BaseModel):
    agent_id: Optional[int] = None
    auto_assign: bool = False

class OrderRescheduleRequest(BaseModel):
    scheduled_delivery_date: datetime.datetime
    notes: Optional[str] = None

class OrderTrackingHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str]
    new_status: str
    actor_id: int
    actor_role: str
    notes: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    recipient: str
    channel: str
    status: str
    subject: Optional[str]
    payload: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    tracking_number: str
    customer_id: int
    created_by_id: int
    agent_id: Optional[int]
    pickup_area_id: int
    drop_area_id: int
    pickup_address: str
    drop_address: str
    dimensions_l: float
    dimensions_b: float
    dimensions_h: float
    actual_weight: float
    volumetric_weight: float
    billing_weight: float
    order_type: OrderType
    payment_type: PaymentType
    base_charge: float
    cod_surcharge: float
    total_charge: float
    current_status: OrderStatus
    reschedule_count: int
    scheduled_delivery_date: Optional[datetime.datetime]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    customer: Optional[UserResponse] = None
    agent: Optional[UserResponse] = None
    pickup_area: Optional[AreaResponse] = None
    drop_area: Optional[AreaResponse] = None
    tracking_history: List[OrderTrackingHistoryResponse] = []

    class Config:
        from_attributes = True
