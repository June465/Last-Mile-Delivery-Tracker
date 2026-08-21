import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token_headers(email: str, password: str):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def _create_and_fail_order(customer_headers, admin_headers):
    """Helper: create order, assign agent, advance to FAILED."""
    zones = client.get("/api/zones").json()
    pickup_area_id = zones[0]["areas"][0]["id"]
    drop_area_id = zones[1]["areas"][0]["id"]

    create_res = client.post("/api/orders", headers=customer_headers, json={
        "pickup_area_id": pickup_area_id,
        "drop_area_id": drop_area_id,
        "pickup_address": "900 JP Nagar, Bengaluru",
        "drop_address": "800 Marathahalli, Bengaluru",
        "dimensions_l": 15.0, "dimensions_b": 15.0, "dimensions_h": 15.0,
        "actual_weight": 2.0,
        "order_type": "B2C", "payment_type": "COD"
    })
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # Assign agent
    client.post(f"/api/orders/{order_id}/assign", headers=admin_headers, json={"auto_assign": True})
    # Advance: AGENT_ASSIGNED -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> FAILED
    for next_status in ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED"]:
        client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
            "new_status": next_status,
            "notes": f"Transitioning to {next_status}"
        })
    return order_id

def test_reschedule_failed_order():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")

    order_id = _create_and_fail_order(customer_headers, admin_headers)

    # Reschedule as customer
    res = client.put(f"/api/orders/{order_id}/reschedule", headers=customer_headers, json={
        "scheduled_delivery_date": "2026-09-01T10:00:00",
        "notes": "Please deliver after 5 PM"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["current_status"] == "RESCHEDULED"
    assert data["reschedule_count"] == 1
    assert any(h["new_status"] == "RESCHEDULED" for h in data["tracking_history"])

def test_max_reschedule_limit():
    customer_headers = get_token_headers("customer@delivery.com", "customer123")
    admin_headers = get_token_headers("admin@delivery.com", "admin123")

    order_id = _create_and_fail_order(customer_headers, admin_headers)

    # Reschedule 3 times (cycling back to FAILED each time)
    for i in range(3):
        client.put(f"/api/orders/{order_id}/reschedule", headers=customer_headers, json={
            "scheduled_delivery_date": f"2026-09-0{i+1}T10:00:00",
            "notes": f"Reschedule attempt #{i+1}"
        })
        # Transition back to FAILED for next attempt (RESCHEDULED -> OUT_FOR_DELIVERY -> FAILED)
        if i < 2:
            client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
                "new_status": "OUT_FOR_DELIVERY", "notes": "Re-attempting delivery"
            })
            client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
                "new_status": "FAILED", "notes": "Failed again"
            })

    # 4th attempt must fail (order is RESCHEDULED, not FAILED, but reschedule_count == 3)
    # First transition back to FAILED
    client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
        "new_status": "OUT_FOR_DELIVERY", "notes": "Re-attempt"
    })
    client.put(f"/api/orders/{order_id}/status", headers=admin_headers, json={
        "new_status": "FAILED", "notes": "Failed again"
    })

    bad_res = client.put(f"/api/orders/{order_id}/reschedule", headers=customer_headers, json={
        "scheduled_delivery_date": "2026-09-10T10:00:00",
        "notes": "This should be rejected"
    })
    assert bad_res.status_code == 400
    assert "Maximum reschedule limit" in bad_res.json()["detail"]
