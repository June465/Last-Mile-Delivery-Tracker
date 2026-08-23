const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function fetchZonesApi() {
    const response = await fetch(`${API_BASE_URL}/zones`);
    if (!response.ok) throw new Error('Failed to fetch zones');
    return response.json();
}

export async function createZoneApi(token, name, code, description) {
    const response = await fetch(`${API_BASE_URL}/zones`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, code, description }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create zone');
    }
    return response.json();
}

export async function addAreaApi(token, zoneId, name, pincode) {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}/areas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, pincode, zone_id: zoneId }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to add area');
    }
    return response.json();
}

export async function deleteZoneApi(token, zoneId) {
    const response = await fetch(`${API_BASE_URL}/zones/${zoneId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete zone');
}

export async function deleteAreaApi(token, areaId) {
    const response = await fetch(`${API_BASE_URL}/zones/areas/${areaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete area');
}

export async function fetchRateCardApi() {
    const response = await fetch(`${API_BASE_URL}/rates/card`);
    if (!response.ok) throw new Error('Failed to fetch rate card');
    return response.json();
}

export async function updateRateCardApi(token, rateCardData) {
    const response = await fetch(`${API_BASE_URL}/rates/card`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rateCardData),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update rate card');
    }
    return response.json();
}

export async function previewRateApi(previewData) {
    const response = await fetch(`${API_BASE_URL}/rates/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to calculate rate preview');
    }
    return response.json();
}
