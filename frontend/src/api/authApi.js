const API_BASE_URL = 'http://localhost:8000/api';

export async function loginApi(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Login failed');
    }
    return response.json();
}

export async function registerApi(name, email, phone, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Registration failed');
    }
    return response.json();
}

export async function getMeApi(token) {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Session expired');
    }
    return response.json();
}
