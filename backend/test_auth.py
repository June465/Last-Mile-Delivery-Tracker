import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_login():
    response = client.post("/api/auth/login", json={"email": "admin@delivery.com", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_agent_login():
    response = client.post("/api/auth/login", json={"email": "agent1@delivery.com", "password": "agent123"})
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "DELIVERY_AGENT"

def test_customer_register_and_login():
    unique_email = f"testcust_{int(time.time())}@delivery.com"
    reg_response = client.post("/api/auth/register", json={
        "name": "Test Customer",
        "email": unique_email,
        "password": "customer123",
        "phone": "9876543210"
    })
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == unique_email

    login_response = client.post("/api/auth/login", json={"email": unique_email, "password": "customer123"})
    assert login_response.status_code == 200
    assert login_response.json()["user"]["role"] == "CUSTOMER"

def test_rbac_protection():
    # Login as Customer
    cust_token = client.post("/api/auth/login", json={"email": "customer@delivery.com", "password": "customer123"}).json()["access_token"]
    
    # Customer attempts admin endpoint -> 403 Forbidden
    response = client.get("/api/users/agents", headers={"Authorization": f"Bearer {cust_token}"})
    assert response.status_code == 403

    # Login as Admin
    admin_token = client.post("/api/auth/login", json={"email": "admin@delivery.com", "password": "admin123"}).json()["access_token"]
    
    # Admin attempts admin endpoint -> 200 OK
    admin_response = client.get("/api/users/agents", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_response.status_code == 200
    assert len(admin_response.json()) >= 2
