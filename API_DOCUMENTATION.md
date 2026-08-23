# Last-Mile Delivery Tracker — API Documentation

Comprehensive REST API reference for the **Last-Mile Delivery Tracker** platform.

Base URL: `/api/v1`

---

## Authentication & Authorization

The system utilizes **JWT (JSON Web Token)** bearer authentication with standard OAuth2 password flows.
- Include header: `Authorization: Bearer <your_jwt_token>`
- Roles: `ADMIN`, `DELIVERY_AGENT`, `CUSTOMER`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Registers a new user (Customer or Delivery Agent).
- **Access**: Public
- **Request Body**:
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+19876543210",
    "password": "SecurePassword123",
    "role": "CUSTOMER"
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "id": 1,
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "created_at": "2026-08-23T12:00:00Z"
  }
  ```

### `POST /auth/token` (Login)
Authenticates user and returns JWT access token.
- **Access**: Public
- **Content-Type**: `application/x-www-form-urlencoded`
- **Form Data**: `username` (email), `password`
- **Response** `(200 OK)`:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "jane@example.com",
      "role": "CUSTOMER"
    }
  }
  ```

### `GET /auth/me`
Fetches current authenticated user profile.
- **Access**: Authenticated (`CUSTOMER`, `DELIVERY_AGENT`, `ADMIN`)

---

## 2. Dynamic Rate Engine Endpoints

### `POST /rates/calculate`
Calculates delivery charges before order placement based on dimensions, weight, pincodes, order type, and payment type.
- **Access**: Public / Authenticated
- **Request Body**:
  ```json
  {
    "pickup_pincode": "560001",
    "drop_pincode": "560038",
    "length_cm": 30.0,
    "breadth_cm": 20.0,
    "height_cm": 15.0,
    "actual_weight_kg": 2.5,
    "order_type": "B2C",
    "payment_type": "COD"
  }
  ```
- **Response** `(200 OK)`:
  ```json
  {
    "actual_weight_kg": 2.5,
    "volumetric_weight_kg": 1.8,
    "billing_weight_kg": 2.5,
    "pickup_zone": "Central Zone",
    "drop_zone": "East Zone",
    "is_inter_zone": true,
    "base_charge": 200.0,
    "cod_surcharge": 20.0,
    "total_charge": 220.0,
    "breakdown": {
      "applied_rate_per_kg": 80.0,
      "rate_card_type": "INTER_ZONE_B2C",
      "cod_fee": 20.0
    }
  }
  ```

---

## 3. Order Management Endpoints

### `POST /orders`
Creates a new delivery order.
- **Access**: `CUSTOMER`, `ADMIN`
- **Request Body**:
  ```json
  {
    "pickup_address": "123 MG Road, Bangalore",
    "pickup_pincode": "560001",
    "drop_address": "456 Indiranagar, Bangalore",
    "drop_pincode": "560038",
    "length_cm": 30.0,
    "breadth_cm": 20.0,
    "height_cm": 15.0,
    "actual_weight_kg": 2.5,
    "order_type": "B2C",
    "payment_type": "COD",
    "customer_name": "Jane Doe",
    "customer_phone": "+19876543210"
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "id": 101,
    "tracking_number": "LMD-2026-894123",
    "status": "CREATED",
    "total_charge": 220.0,
    "pickup_zone_id": 1,
    "drop_zone_id": 2,
    "assigned_agent_id": null,
    "created_at": "2026-08-23T12:30:00Z"
  }
  ```

### `GET /orders`
Lists orders. Customers view their own orders; Admins view all orders with filtering.
- **Access**: Authenticated
- **Query Params**: `status`, `zone_id`, `agent_id`, `skip`, `limit`

### `GET /orders/{tracking_number}`
Fetches full order details and live tracking history timeline.
- **Access**: Public / Authenticated

### `PUT /orders/{order_id}/status`
Updates order delivery status. Generates an append-only tracking history log.
- **Access**: `DELIVERY_AGENT` (assigned agent), `ADMIN`
- **Request Body**:
  ```json
  {
    "status": "IN_TRANSIT",
    "notes": "Package scanned at Central Sorting Hub",
    "current_lat": 12.9716,
    "current_lng": 77.5946
  }
  ```
- **Status Lifecycle**: `CREATED` $\rightarrow$ `AGENT_ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `FAILED`

---

## 4. Agent Auto-Assignment & Allocation

### `POST /orders/{order_id}/auto-assign`
Triggers nearest-agent spatial search & auto-assignment algorithm.
- **Access**: `ADMIN` (or auto-triggered on order creation)
- **Response** `(200 OK)`:
  ```json
  {
    "order_id": 101,
    "assigned_agent_id": 5,
    "agent_name": "John Courier",
    "distance_km": 1.2,
    "assignment_mode": "HOME_ZONE"
  }
  ```

### `POST /orders/{order_id}/manual-assign`
Manually assigns a delivery agent to an order.
- **Access**: `ADMIN`
- **Request Body**: `{ "agent_id": 5 }`

---

## 5. Failed Delivery & Rescheduling Portal

### `POST /orders/{tracking_number}/reschedule`
Reschedules a failed delivery attempt up to 3 times maximum.
- **Access**: `CUSTOMER`, `ADMIN`
- **Request Body**:
  ```json
  {
    "rescheduled_date": "2026-08-25",
    "preferred_time_slot": "14:00 - 17:00",
    "reschedule_notes": "Please call before arriving"
  }
  ```
- **Response** `(200 OK)`:
  ```json
  {
    "order_id": 101,
    "status": "RESCHEDULED",
    "reschedule_count": 1,
    "max_allowed": 3,
    "rescheduled_date": "2026-08-25"
  }
  ```

---

## 6. Admin Zone & Rate Card Management

### `POST /admin/zones`
Creates or updates geographic zones and pincode area mappings.
- **Access**: `ADMIN`

### `POST /admin/rate-cards`
Configures B2B/B2C rate cards for intra-zone and inter-zone delivery.
- **Access**: `ADMIN`

---

## 7. Audit & Analytics

### `GET /admin/analytics/kpi`
Returns administrative operational KPIs (total revenue, active fleet, failed rate, SLA compliance).
- **Access**: `ADMIN`
