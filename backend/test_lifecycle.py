import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token_headers(email: str, password: str):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_order_status_progression_chain():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")
    agent_headers = get_token_headers("agent1@delivery.com", "agent123")

    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    # 1. Create order
    create_res = client.post("/api/orders", headers=customer_headers, json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "100 Indiranagar 100ft Rd, Bengaluru",
        "drop_address": "200 HSR Layout Sector 1, Bengaluru",
        "dimensions_l": 25.0,
        "dimensions_b": 20.0,
        "dimensions_h": 15.0,
        "actual_weight": 3.0,
        "order_type": "B2C",
        "payment_type": "PREPAID"
    })
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # 2. Auto-assign agent as Admin
    assign_res = client.post(f"/api/orders/{order_id}/assign", headers=admin_headers, json={"auto_assign": True})
    assert assign_res.status_code == 200

    # Verify re-assigning agent as Admin fails (agent already assigned)
    reassign_res = client.post(f"/api/orders/{order_id}/assign", headers=admin_headers, json={"auto_assign": True})
    assert reassign_res.status_code == 400
    assert "already assigned" in reassign_res.json()["detail"]

    # Verify Admin trying operational update (PICKED_UP) fails with 403
    admin_op_res = client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
        "new_status": "PICKED_UP",
        "notes": "Admin cannot update operational status."
    })
    assert admin_op_res.status_code == 403

    # 3. Delivery Agent transition: AGENT_ASSIGNED -> PICKED_UP
    step1 = client.put(f"/api/orders/{order_id}/status", headers=agent_headers, json={
        "new_status": "PICKED_UP",
        "notes": "Package collected from merchant."
    })
    assert step1.status_code == 200
    assert step1.json()["current_status"] == "PICKED_UP"

    # 4. Delivery Agent transition: PICKED_UP -> IN_TRANSIT
    step2 = client.put(f"/api/orders/{order_id}/status", headers=agent_headers, json={
        "new_status": "IN_TRANSIT",
        "notes": "Order in transit via delivery vehicle."
    })
    assert step2.status_code == 200
    assert step2.json()["current_status"] == "IN_TRANSIT"

    # 5. Delivery Agent transition: IN_TRANSIT -> OUT_FOR_DELIVERY
    step3 = client.put(f"/api/orders/{order_id}/status", headers=agent_headers, json={
        "new_status": "OUT_FOR_DELIVERY",
        "notes": "Agent out for final delivery."
    })
    assert step3.status_code == 200
    assert step3.json()["current_status"] == "OUT_FOR_DELIVERY"

    # 6. Delivery Agent transition: OUT_FOR_DELIVERY -> DELIVERED
    step4 = client.put(f"/api/orders/{order_id}/status", headers=agent_headers, json={
        "new_status": "DELIVERED",
        "notes": "Handed over to customer recipient."
    })
    assert step4.status_code == 200
    assert step4.json()["current_status"] == "DELIVERED"

    # Verify immutable audit history length == 6
    history = step4.json()["tracking_history"]
    assert len(history) == 6
    statuses = [h["new_status"] for h in history]
    assert statuses == ["CREATED", "AGENT_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"]

def test_admin_can_mark_order_failure():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")

    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    create_res = client.post("/api/orders", headers=customer_headers, json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "555 Brigade Rd, Bengaluru",
        "drop_address": "666 Whitefield, Bengaluru",
        "dimensions_l": 10.0,
        "dimensions_b": 10.0,
        "dimensions_h": 10.0,
        "actual_weight": 1.0,
        "order_type": "B2C",
        "payment_type": "PREPAID"
    })
    order_id = create_res.json()["id"]

    # Admin marks order as FAILED
    fail_res = client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
        "new_status": "FAILED",
        "notes": "Order cancelled by admin due to merchant issue."
    })
    assert fail_res.status_code == 200
    assert fail_res.json()["current_status"] == "FAILED"
