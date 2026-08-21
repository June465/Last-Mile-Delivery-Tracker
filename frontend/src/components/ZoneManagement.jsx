import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchZonesApi, createZoneApi, addAreaApi, deleteZoneApi, deleteAreaApi } from '../api/zoneRateApi';
import { MapPin, Plus, Trash2, Map, Tag } from 'lucide-react';

export function ZoneManagement() {
    const { token } = useAuth();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New Zone form
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneCode, setNewZoneCode] = useState('');
    const [newZoneDesc, setNewZoneDesc] = useState('');

    // New Area form
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [newPincode, setNewPincode] = useState('');

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        try {
            setLoading(true);
            const data = await fetchZonesApi();
            setZones(data);
            if (data.length > 0 && !selectedZoneId) {
                setSelectedZoneId(data[0].id);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateZone = async (e) => {
        e.preventDefault();
        try {
            await createZoneApi(token, newZoneName, newZoneCode, newZoneDesc);
            setNewZoneName('');
            setNewZoneCode('');
            setNewZoneDesc('');
            loadZones();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddArea = async (e) => {
        e.preventDefault();
        if (!selectedZoneId) return;
        try {
            await addAreaApi(token, Number(selectedZoneId), newAreaName, newPincode);
            setNewAreaName('');
            setNewPincode('');
            loadZones();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteZone = async (zoneId) => {
        if (!window.confirm('Are you sure you want to delete this zone? All associated areas will be deleted.')) return;
        try {
            await deleteZoneApi(token, zoneId);
            loadZones();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteArea = async (areaId) => {
        if (!window.confirm('Delete this area?')) return;
        try {
            await deleteAreaApi(token, areaId);
            loadZones();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Zones & Areas...</div>;
    }

    return (
        <div className="space-y-8">
            {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Zone Form */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <Map className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-lg">Create New Delivery Zone</h3>
                    </div>
                    <form onSubmit={handleCreateZone} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Zone Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. North Bengaluru"
                                value={newZoneName}
                                onChange={(e) => setNewZoneName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Zone Code</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. ZONE_BLR_NORTH"
                                value={newZoneCode}
                                onChange={(e) => setNewZoneCode(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                            <textarea
                                placeholder="Zone coverage description"
                                value={newZoneDesc}
                                onChange={(e) => setNewZoneDesc(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                rows={2}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Zone</span>
                        </button>
                    </form>
                </div>

                {/* Add Area Form */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-lg">Add Area to Zone</h3>
                    </div>
                    <form onSubmit={handleAddArea} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Zone</label>
                            <select
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            >
                                {zones.map((z) => (
                                    <option key={z.id} value={z.id}>
                                        {z.name} ({z.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Area Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Yelahanka New Town"
                                value={newAreaName}
                                onChange={(e) => setNewAreaName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pincode</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 560064"
                                value={newPincode}
                                onChange={(e) => setNewPincode(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Area</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Zone & Area Cards List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-xl">Active Delivery Zones & Covered Areas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {zones.map((zone) => (
                        <div key={zone.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900">{zone.name}</h4>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 font-mono font-semibold px-2 py-0.5 rounded">
                                        {zone.code}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteZone(zone.id)}
                                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                    title="Delete Zone"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">{zone.description || 'No description provided'}</p>

                            <div className="border-t border-gray-100 pt-3">
                                <p className="text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center space-x-1">
                                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Covered Areas ({zone.areas ? zone.areas.length : 0})</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {zone.areas && zone.areas.length > 0 ? (
                                        zone.areas.map((area) => (
                                            <span
                                                key={area.id}
                                                className="inline-flex items-center space-x-1 bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200"
                                            >
                                                <span>{area.name} ({area.pincode})</span>
                                                <button
                                                    onClick={() => handleDeleteArea(area.id)}
                                                    className="text-gray-400 hover:text-red-500 ml-1"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No areas mapped yet</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
