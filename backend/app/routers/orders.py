import datetime
import random
import string
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Order, OrderTrackingHistory, Notification, OrderStatus, User, UserRole, Area
from app.schemas import OrderCreate, OrderResponse, RatePreviewRequest, OrderAssignRequest, OrderStatusUpdate, OrderRescheduleRequest
from app.auth import get_current_user, require_roles
from app.services.rate_engine import compute_rate_preview
from app.services.assignment_engine import find_nearest_available_agent

router = APIRouter(prefix="/orders", tags=["Orders"])

ALLOWED_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
    OrderStatus.CREATED: [OrderStatus.AGENT_ASSIGNED],
    OrderStatus.AGENT_ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.CREATED],
    OrderStatus.PICKED_UP: [OrderStatus.IN_TRANSIT],
    OrderStatus.IN_TRANSIT: [OrderStatus.OUT_FOR_DELIVERY],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.FAILED],
    OrderStatus.FAILED: [OrderStatus.RESCHEDULED],
    OrderStatus.RESCHEDULED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.AGENT_ASSIGNED],
    OrderStatus.DELIVERED: []
}

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
    if current_user.role == UserRole.CUSTOMER or order_data.customer_id is None:
        customer_id = current_user.id
    else:
        customer = db.query(User).filter(User.id == order_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified Customer ID not found")
        customer_id = customer.id

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

    history_log = OrderTrackingHistory(
        order_id=new_order.id,
        previous_status=None,
        new_status=OrderStatus.CREATED.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes="Order created successfully and placed in system pool."
    )
    db.add(history_log)

    # 1. Customer Email & SMS Notifications
    cust_user = db.query(User).filter(User.id == customer_id).first()
    cust_email = cust_user.email if cust_user else "customer@delivery.com"
    cust_phone = (cust_user.phone if cust_user and cust_user.phone else cust_email)

    db.add(Notification(
        order_id=new_order.id,
        recipient=cust_email,
        channel="EMAIL",
        status="SENT",
        subject=f"Order Placed: {tracking_num}",
        payload=f"Your order {tracking_num} has been created with status CREATED. Total: ₹{rate_calc.total_charge}"
    ))
    db.add(Notification(
        order_id=new_order.id,
        recipient=cust_phone,
        channel="SMS",
        status="SENT",
        subject=f"Order Placed: {tracking_num}",
        payload=f"Order {tracking_num} placed successfully. Total: ₹{rate_calc.total_charge}"
    ))

    # 2. Admin Email & SMS Notifications on Order Placing
    admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).all()
    for admin in admins:
        db.add(Notification(
            order_id=new_order.id,
            recipient=admin.email,
            channel="EMAIL",
            status="SENT",
            subject=f"New Order Alert: {tracking_num}",
            payload=f"New order {tracking_num} placed by {cust_user.name if cust_user else 'Customer'}. Total: ₹{rate_calc.total_charge}"
        ))
        db.add(Notification(
            order_id=new_order.id,
            recipient=admin.phone or admin.email,
            channel="SMS",
            status="SENT",
            subject=f"New Order Alert: {tracking_num}",
            payload=f"New order {tracking_num} placed in pool."
        ))

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

@router.post("/{order_id}/assign", response_model=OrderResponse)
def assign_agent_to_order(
    order_id: int,
    assign_data: OrderAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.DELIVERY_AGENT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin or Delivery Agents can assign orders")

    assigned_agent: Optional[User] = None

    if assign_data.auto_assign:
        assigned_agent = find_nearest_available_agent(db, order)
        if not assigned_agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No available delivery agent found in pickup zone or city."
            )
    elif assign_data.agent_id:
        assigned_agent = db.query(User).filter(
            User.id == assign_data.agent_id,
            User.role == UserRole.DELIVERY_AGENT,
            User.is_active == True
        ).first()
        if not assigned_agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified active Delivery Agent not found"
            )
    elif current_user.role == UserRole.DELIVERY_AGENT:
        assigned_agent = current_user
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify agent_id or set auto_assign to true"
        )

    prev_status = order.current_status.value
    order.agent_id = assigned_agent.id
    order.current_status = OrderStatus.AGENT_ASSIGNED

    history_log = OrderTrackingHistory(
        order_id=order.id,
        previous_status=prev_status,
        new_status=OrderStatus.AGENT_ASSIGNED.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=f"Assigned to Delivery Agent '{assigned_agent.name}' (ID: {assigned_agent.id})"
    )
    db.add(history_log)

    # Customer Email & SMS Notifications on Assignment
    cust_recipient_email = order.customer.email if order.customer else "customer@delivery.com"
    cust_recipient_phone = (order.customer.phone if order.customer and order.customer.phone else cust_recipient_email)

    db.add(Notification(
        order_id=order.id,
        recipient=cust_recipient_email,
        channel="EMAIL",
        status="SENT",
        subject=f"Agent Assigned: {order.tracking_number}",
        payload=f"Agent {assigned_agent.name} ({assigned_agent.phone or 'N/A'}) has been assigned to your order."
    ))
    db.add(Notification(
        order_id=order.id,
        recipient=cust_recipient_phone,
        channel="SMS",
        status="SENT",
        subject=f"Agent Assigned: {order.tracking_number}",
        payload=f"Agent {assigned_agent.name} has been assigned to your order {order.tracking_number}."
    ))

    # Agent Email & SMS Notifications on Assignment
    db.add(Notification(
        order_id=order.id,
        recipient=assigned_agent.email,
        channel="EMAIL",
        status="SENT",
        subject=f"New Delivery Order Assigned: {order.tracking_number}",
        payload=f"You have been assigned order {order.tracking_number}. Pickup address: {order.pickup_address}"
    ))
    db.add(Notification(
        order_id=order.id,
        recipient=assigned_agent.phone or assigned_agent.email,
        channel="SMS",
        status="SENT",
        subject=f"New Delivery Order Assigned: {order.tracking_number}",
        payload=f"New delivery order {order.tracking_number} assigned. Pickup address: {order.pickup_address}"
    ))

    db.commit()
    db.refresh(order)
    return get_order_by_id(order_id, db, current_user)

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Authorization Check: Admin or Assigned Delivery Agent
    if current_user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers cannot directly change order status")
    if current_user.role == UserRole.DELIVERY_AGENT and order.agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Delivery Agent not assigned to this order")

    curr_status = order.current_status
    target_status = status_update.new_status

    # Validate state machine transition
    allowed_next = ALLOWED_TRANSITIONS.get(curr_status, [])
    if target_status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from {curr_status.value} to {target_status.value}. Allowed next states: {[s.value for s in allowed_next]}"
        )

    # Perform status update
    prev_status_str = curr_status.value
    order.current_status = target_status

    # Immutable Audit Log
    notes_str = status_update.notes or f"Order status updated from {prev_status_str} to {target_status.value}."
    history_log = OrderTrackingHistory(
        order_id=order.id,
        previous_status=prev_status_str,
        new_status=target_status.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=notes_str
    )
    db.add(history_log)

    # Customer Email & SMS Notifications on Phase Update
    cust_recipient_email = order.customer.email if order.customer else "customer@delivery.com"
    cust_recipient_phone = (order.customer.phone if order.customer and order.customer.phone else cust_recipient_email)

    db.add(Notification(
        order_id=order.id,
        recipient=cust_recipient_email,
        channel="EMAIL",
        status="SENT",
        subject=f"Order Status Update: {order.tracking_number} is now {target_status.value}",
        payload=f"Order {order.tracking_number} status changed to {target_status.value}. Notes: {notes_str}"
    ))
    db.add(Notification(
        order_id=order.id,
        recipient=cust_recipient_phone,
        channel="SMS",
        status="SENT",
        subject=f"Order Status Update: {order.tracking_number}",
        payload=f"Order {order.tracking_number} status updated to {target_status.value}."
    ))

    # Agent Email & SMS Notifications on Phase Update
    if order.agent:
        db.add(Notification(
            order_id=order.id,
            recipient=order.agent.email,
            channel="EMAIL",
            status="SENT",
            subject=f"Assigned Order Update: {order.tracking_number}",
            payload=f"Order {order.tracking_number} updated to {target_status.value}."
        ))
        db.add(Notification(
            order_id=order.id,
            recipient=order.agent.phone or order.agent.email,
            channel="SMS",
            status="SENT",
            subject=f"Assigned Order Update: {order.tracking_number}",
            payload=f"Order {order.tracking_number} updated to {target_status.value}."
        ))

    db.commit()
    db.refresh(order)
    return get_order_by_id(order_id, db, current_user)

MAX_RESCHEDULE_ATTEMPTS = 3

@router.put("/{order_id}/reschedule", response_model=OrderResponse)
def reschedule_order(
    order_id: int,
    reschedule_data: OrderRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only FAILED orders can be rescheduled
    if order.current_status != OrderStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only FAILED orders can be rescheduled. Current status: {order.current_status.value}"
        )

    # Enforce max reschedule limit
    if order.reschedule_count >= MAX_RESCHEDULE_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum reschedule limit ({MAX_RESCHEDULE_ATTEMPTS}) reached for this order."
        )

    prev_status = order.current_status.value
    order.current_status = OrderStatus.RESCHEDULED
    order.reschedule_count += 1
    order.scheduled_delivery_date = reschedule_data.scheduled_delivery_date

    notes_str = reschedule_data.notes or f"Order rescheduled for {reschedule_data.scheduled_delivery_date.strftime('%Y-%m-%d')}. Attempt {order.reschedule_count}/{MAX_RESCHEDULE_ATTEMPTS}."
    history_log = OrderTrackingHistory(
        order_id=order.id,
        previous_status=prev_status,
        new_status=OrderStatus.RESCHEDULED.value,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        notes=notes_str
    )
    db.add(history_log)

    cust_notif = Notification(
        order_id=order.id,
        recipient=order.customer.email if order.customer else "customer@delivery.com",
        channel="EMAIL",
        status="SENT",
        subject=f"Order Rescheduled: {order.tracking_number}",
        payload=f"Your order {order.tracking_number} has been rescheduled for {reschedule_data.scheduled_delivery_date.strftime('%Y-%m-%d')}. Attempt {order.reschedule_count}/{MAX_RESCHEDULE_ATTEMPTS}."
    )
    db.add(cust_notif)

    db.commit()
    db.refresh(order)
    return get_order_by_id(order_id, db, current_user)
