# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_headers():
    login_res = client.post("/api/auth/login", json={"email": "admin@delivery.com", "password": "admin123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_zones():
    res = client.get("/api/zones")
    assert res.status_code == 200
    zones = res.json()
    assert len(zones) >= 2

def test_rate_card_fetch_and_update():
    # 1. Fetch active rate card
    res = client.get("/api/rates/card")
    assert res.status_code == 200
    card = res.json()
    assert "b2b_intra_rate" in card

    # 2. Update rate card as Admin
    headers = get_admin_headers()
    update_res = client.post("/api/rates/card", headers=headers, json={
        "name": "Updated Test Card",
        "b2b_intra_rate": 55.0,
        "b2b_inter_rate": 105.0,
        "b2c_intra_rate": 45.0,
        "b2c_inter_rate": 85.0,
        "b2b_cod_surcharge": 35.0,
        "b2c_cod_surcharge": 25.0,
        "volumetric_factor": 5000.0
    })
    assert update_res.status_code == 200
    assert update_res.json()["b2b_intra_rate"] == 55.0

def test_rate_preview_volumetric_and_intra_zone():
    zones_res = client.get("/api/zones").json()
    intra_zone = zones_res[0]
    pickup_area_id = intra_zone["areas"][0]["id"]
    drop_area_id = intra_zone["areas"][1]["id"] if len(intra_zone["areas"]) > 1 else pickup_area_id

    # Dimensions: 50 x 40 x 30 cm = 60,000 / 5000 = 12 kg volumetric
    # Actual weight: 5 kg -> Billing weight should be 12 kg
    preview_res = client.post("/api/rates/preview", json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "dimensions_l": 50.0,
        "dimensions_b": 40.0,
        "dimensions_h": 30.0,
        "actual_weight": 5.0,
        "order_type": "B2C",
        "payment_type": "COD"
    })

    assert preview_res.status_code == 200
    data = preview_res.json()
    assert data["is_intra_zone"] == True
    assert data["volumetric_weight"] == 12.0
    assert data["actual_weight"] == 5.0
    assert data["billing_weight"] == 12.0
    assert data["cod_surcharge"] == 25.0
    # base_charge = 12 * 45.0 = 540.0, total = 540 + 25 = 565.0
    assert data["base_charge"] == 540.0
    assert data["total_charge"] == 565.0

def test_rate_preview_inter_zone():
    zones_res = client.get("/api/zones").json()
    pickup_area_id = zones_res[0]["areas"][0]["id"]
    drop_area_id = zones_res[1]["areas"][0]["id"]

    preview_res = client.post("/api/rates/preview", json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "dimensions_l": 10.0,
        "dimensions_b": 10.0,
        "dimensions_h": 10.0,
        "actual_weight": 10.0,
        "order_type": "B2B",
        "payment_type": "PREPAID"
    })

    assert preview_res.status_code == 200
    data = preview_res.json()
    assert data["is_intra_zone"] == False
    assert data["billing_weight"] == 10.0
    assert data["cod_surcharge"] == 0.0
    # Inter B2B rate = 105.0 * 10 = 1050.0
    assert data["base_charge"] == 1050.0
    assert data["total_charge"] == 1050.0
