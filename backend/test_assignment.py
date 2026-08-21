import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token_headers(email: str, password: str):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_auto_assign_nearest_agent():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")

    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    # 1. Create order
    create_res = client.post("/api/orders", headers=customer_headers, json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "789 MG Road, Bengaluru",
        "drop_address": "101 Outer Ring Rd, Bengaluru",
        "dimensions_l": 20.0,
        "dimensions_b": 20.0,
        "dimensions_h": 20.0,
        "actual_weight": 2.0,
        "order_type": "B2C",
        "payment_type": "PREPAID"
    })
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # 2. Auto-assign nearest agent as Admin
    assign_res = client.post(f"/api/orders/{order_id}/assign", headers=admin_headers, json={
        "auto_assign": True
    })
    assert assign_res.status_code == 200
    data = assign_res.json()
    assert data["agent_id"] is not None
    assert data["current_status"] == "AGENT_ASSIGNED"
    assert len(data["tracking_history"]) == 2
    assert data["tracking_history"][1]["new_status"] == "AGENT_ASSIGNED"

def test_manual_assign_agent():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")
    agent_user = client.get("/api/users/agents", headers=admin_headers).json()[0]

    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    # 1. Create order
    create_res = client.post("/api/orders", headers=customer_headers, json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "222 Commercial St, Bengaluru",
        "drop_address": "333 Electronic City, Bengaluru",
        "dimensions_l": 15.0,
        "dimensions_b": 15.0,
        "dimensions_h": 15.0,
        "actual_weight": 1.5,
        "order_type": "B2B",
        "payment_type": "PREPAID"
    })
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # 2. Manually assign specific agent as Admin
    assign_res = client.post(f"/api/orders/{order_id}/assign", headers=admin_headers, json={
        "agent_id": agent_user["id"],
        "auto_assign": False
    })
    assert assign_res.status_code == 200
    data = assign_res.json()
    assert data["agent_id"] == agent_user["id"]
    assert data["current_status"] == "AGENT_ASSIGNED"
