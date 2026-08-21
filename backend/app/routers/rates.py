from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RateCard, UserRole, User
from app.schemas import RateCardCreate, RateCardResponse, RatePreviewRequest, RatePreviewResponse
from app.auth import get_current_user, require_roles
from app.services.rate_engine import get_active_rate_card, compute_rate_preview

router = APIRouter(prefix="/rates", tags=["Rate Card & Rate Calculations"])

@router.get("/card", response_model=RateCardResponse)
def get_rate_card(db: Session = Depends(get_db)):
    return get_active_rate_card(db)

@router.post("/card", response_model=RateCardResponse)
def update_rate_card(
    rate_card_data: RateCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN))
):
    # Deactivate current active rate cards
    db.query(RateCard).update({RateCard.is_active: False})

    new_card = RateCard(
        name=rate_card_data.name,
        b2b_intra_rate=rate_card_data.b2b_intra_rate,
        b2b_inter_rate=rate_card_data.b2b_inter_rate,
        b2c_intra_rate=rate_card_data.b2c_intra_rate,
        b2c_inter_rate=rate_card_data.b2c_inter_rate,
        b2b_cod_surcharge=rate_card_data.b2b_cod_surcharge,
        b2c_cod_surcharge=rate_card_data.b2c_cod_surcharge,
        volumetric_factor=rate_card_data.volumetric_factor,
        is_active=True
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.post("/preview", response_model=RatePreviewResponse)
def preview_rate(
    preview_request: RatePreviewRequest,
    db: Session = Depends(get_db)
):
    return compute_rate_preview(db, preview_request)
