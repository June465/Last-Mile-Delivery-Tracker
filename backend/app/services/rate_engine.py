from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Area, Zone, RateCard, OrderType, PaymentType
from app.schemas import RatePreviewRequest, RatePreviewResponse

def get_active_rate_card(db: Session) -> RateCard:
    rate_card = db.query(RateCard).filter(RateCard.is_active == True).first()
    if not rate_card:
        # Fallback default rate card if none marked active
        rate_card = RateCard(
            name="Default Fallback Rate Card",
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
        db.commit()
        db.refresh(rate_card)
    return rate_card

def detect_zone_type(db: Session, pickup_area_id: int, drop_area_id: int):
    pickup_area = db.query(Area).filter(Area.id == pickup_area_id).first()
    drop_area = db.query(Area).filter(Area.id == drop_area_id).first()

    if not pickup_area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pickup Area ID {pickup_area_id} not found")
    if not drop_area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Drop Area ID {drop_area_id} not found")

    is_intra_zone = (pickup_area.zone_id == drop_area.zone_id)
    return pickup_area, drop_area, is_intra_zone

def calculate_volumetric_weight(dimensions_l: float, dimensions_b: float, dimensions_h: float, volumetric_factor: float = 5000.0) -> float:
    if volumetric_factor <= 0:
        volumetric_factor = 5000.0
    vol_weight = (dimensions_l * dimensions_b * dimensions_h) / volumetric_factor
    return round(vol_weight, 2)

def resolve_billing_weight(actual_weight: float, volumetric_weight: float) -> float:
    return round(max(actual_weight, volumetric_weight), 2)

def compute_rate_preview(db: Session, request: RatePreviewRequest) -> RatePreviewResponse:
    pickup_area, drop_area, is_intra_zone = detect_zone_type(db, request.pickup_area_id, request.drop_area_id)
    rate_card = get_active_rate_card(db)

    volumetric_weight = calculate_volumetric_weight(
        request.dimensions_l, request.dimensions_b, request.dimensions_h, rate_card.volumetric_factor
    )
    billing_weight = resolve_billing_weight(request.actual_weight, volumetric_weight)

    # Determine rate per kg based on order_type and zone match
    if request.order_type == OrderType.B2B:
        applied_rate = rate_card.b2b_intra_rate if is_intra_zone else rate_card.b2b_inter_rate
        cod_surcharge = rate_card.b2b_cod_surcharge if request.payment_type == PaymentType.COD else 0.0
    else:
        applied_rate = rate_card.b2c_intra_rate if is_intra_zone else rate_card.b2c_inter_rate
        cod_surcharge = rate_card.b2c_cod_surcharge if request.payment_type == PaymentType.COD else 0.0

    base_charge = round(billing_weight * applied_rate, 2)
    total_charge = round(base_charge + cod_surcharge, 2)

    return RatePreviewResponse(
        pickup_zone_name=pickup_area.zone.name if pickup_area.zone else "Unknown Zone",
        drop_zone_name=drop_area.zone.name if drop_area.zone else "Unknown Zone",
        is_intra_zone=is_intra_zone,
        volumetric_weight=volumetric_weight,
        actual_weight=round(request.actual_weight, 2),
        billing_weight=billing_weight,
        applied_rate_per_kg=applied_rate,
        base_charge=base_charge,
        cod_surcharge=cod_surcharge,
        total_charge=total_charge
    )
