import datetime
import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Order, OrderTrackingHistory, Notification, OrderStatus, User, UserRole, Area
from app.schemas import OrderCreate, OrderResponse, RatePreviewRequest
from app.auth import get_current_user
from app.services.rate_engine import compute_rate_preview

router = APIRouter(prefix="/orders", tags=["Orders"])

def generate_tracking_number() -> str:
    date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TRK-{date_str}-{random_str}"

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Customer ID resolution: Admin can specify, Customer defaults to self
    if current_user.role == UserRole.CUSTOMER or order_data.customer_id is None:
        customer_id = current_user.id
    else:
        customer = db.query(User).filter(User.id == order_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified Customer ID not found")
        customer_id = customer.id

    # Compute rate breakdown using Rate Engine
    rate_request = RatePreviewRequest(
        pickup_area_id=order_data.pickup_area_id,
        drop_area_id=order_data.drop_area_id,
        dimensions_l=order_data.dimensions_l,
        dimensions_b=order_data.dimensions_b,
        dimensions_h=order_data.dimensions_h,
        actual_weight=order_data.actual_weight,
        order_type=order_data.order_type,
        payment_type=order_data.payment_type
    )
    rate_calc = compute_rate_preview(db, rate_request)

    tracking_num = generate_tracking_number()

    new_order = Order(
        tracking_number=tracking_num,
        customer_id=customer_id,
        created_by_id=current_user.id,
        pickup_area_id=order_data.pickup_area_id,
        drop_area_id=order_data.drop_area_id,
        pickup_address=order_data.pickup_address,
        drop_address=order_data.drop_address,
        dimensions_l=order_data.dimensions_l,
        dimensions_b=order_data.dimensions_b,
        dimensions_h=order_data.dimensions_h,
        actual_weight=order_data.actual_weight,
        volumetric_weight=rate_calc.volumetric_weight,
        billing_weight=rate_calc.billing_weight,
        order_type=order_data.order_type,
        payment_type=order_data.payment_type,
        base_charge=rate_calc.base_charge,
        cod_surcharge=rate_calc.cod_surcharge,
        total_charge=rate_calc.total_charge,
        current_status=OrderStatus.CREATED
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Initial Immutable Audit Log
    history_log = OrderTrackingHistory(
        order_id=new_order.id,
        previous_status=None,
        new_status=OrderStatus.CREATED.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes="Order created successfully and placed in system pool."
    )
    db.add(history_log)

    # Trigger Initial Notification
    cust_user = db.query(User).filter(User.id == customer_id).first()
    notif = Notification(
        order_id=new_order.id,
        recipient=cust_user.email if cust_user else "customer@delivery.com",
        channel="EMAIL",
        status="SENT",
        subject=f"Order Placed: {tracking_num}",
        payload=f"Your order {tracking_num} has been successfully created with status CREATED. Total estimate: ₹{rate_calc.total_charge}"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("", response_model=List[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.agent),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.tracking_history)
    )

    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Order.customer_id == current_user.id)
    elif current_user.role == UserRole.DELIVERY_AGENT:
        query = query.filter((Order.agent_id == current_user.id) | (Order.current_status == OrderStatus.CREATED))

    orders = query.order_by(Order.created_at.desc()).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.agent),
        joinedload(Order.pickup_area).joinedload(Area.zone),
        joinedload(Order.drop_area).joinedload(Area.zone),
        joinedload(Order.tracking_history)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == UserRole.CUSTOMER and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this order")

    return order
