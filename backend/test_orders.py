import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token_headers(email: str, password: str):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_order_customer():
    headers = get_token_headers("customer@delivery.com", "customer123")
    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    order_payload = {
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "123 Indiranagar 100ft Rd, Bengaluru",
        "drop_address": "456 Yelahanka Main Rd, Bengaluru",
        "dimensions_l": 50.0,
        "dimensions_b": 40.0,
        "dimensions_h": 30.0,
        "actual_weight": 5.0,
        "order_type": "B2C",
        "payment_type": "COD"
    }

    res = client.post("/api/orders", headers=headers, json=order_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["tracking_number"].startswith("TRK-")
    assert data["current_status"] == "CREATED"
    assert data["volumetric_weight"] == 12.0
    assert data["billing_weight"] == 12.0
    assert data["total_charge"] > 0
    assert len(data["tracking_history"]) == 1
    assert data["tracking_history"][0]["new_status"] == "CREATED"

def test_list_orders_customer_vs_admin():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")

    cust_res = client.get("/api/orders", headers=customer_headers)
    assert cust_res.status_code == 200
    cust_orders = cust_res.json()

    admin_res = client.get("/api/orders", headers=admin_headers)
    assert admin_res.status_code == 200
    admin_orders = admin_res.json()

    assert len(admin_orders) >= len(cust_orders)

def test_get_order_by_id():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    cust_orders = client.get("/api/orders", headers=customer_headers).json()
    order_id = cust_orders[0]["id"]

    res = client.get(f"/api/orders/{order_id}", headers=customer_headers)
    assert res.status_code == 200
    assert res.json()["id"] == order_id
