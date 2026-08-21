const API_BASE_URL = 'http://localhost:8000/api';

export async function createOrderApi(token, orderData) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create order');
    }
    return response.json();
}

export async function fetchOrdersApi(token) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
}

export async function fetchOrderByIdApi(token, orderId) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) throw new Error('Failed to fetch order details');
    return response.json();
}

export async function assignAgentApi(token, orderId, assignData) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignData),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to assign agent');
    }
    return response.json();
}

export async function updateOrderStatusApi(token, orderId, statusData) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusData),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update order status');
    }
    return response.json();
}
