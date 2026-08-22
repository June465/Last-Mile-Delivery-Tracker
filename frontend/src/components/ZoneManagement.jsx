import React, { useState, useEffect } from 'react';
import './ZoneManagement.css';
import { useAuth } from '../context/AuthContext';
import { Map, Plus, MapPin, Layers } from 'lucide-react';
import { fetchZonesApi, createZoneApi, addAreaApi } from '../api/zoneRateApi';

export function ZoneManagement() {
    const { token } = useAuth();
    const [zones, setZones] = useState([]);
    const [zoneName, setZoneName] = useState('');
    const [zoneCode, setZoneCode] = useState('');
    const [selectedZoneId, setSelectedZoneId] = useState('');
    const [areaName, setAreaName] = useState('');
    const [pincode, setPincode] = useState('');
    const [error, setError] = useState('');

    const loadZones = async () => {
        try {
            const data = await fetchZonesApi();
            setZones(data);
            if (data.length > 0 && !selectedZoneId) {
                setSelectedZoneId(data[0].id.toString());
            }
        } catch (err) {
            console.error('Failed to load zones:', err);
        }
    };

    useEffect(() => {
        loadZones();
    }, []);

    const handleCreateZone = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createZoneApi(token, zoneName, zoneCode);
            setZoneName('');
            setZoneCode('');
            loadZones();
        } catch (err) {
            setError(err.message || 'Failed to create zone');
        }
    };

    const handleCreateArea = async (e) => {
        e.preventDefault();
        if (!selectedZoneId) return;
        setError('');
        try {
            await addAreaApi(token, parseInt(selectedZoneId), areaName, pincode);
            setAreaName('');
            setPincode('');
            loadZones();
        } catch (err) {
            setError(err.message || 'Failed to create area');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold zone-label tracking-tight flex items-center gap-2">
                    <Map className="h-6 w-6 text-indigo-400" />
                    Delivery Zone & Area Topology
                </h2>
                <p className="text-sm font-semibold zone-subheading">Configure logistics coverage hubs and postal pincode boundaries</p>
            </div>

            {error && (
                <div className="bg-red-950/40 border border-red-500/40 text-red-300 text-sm p-3 rounded-lg font-bold">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="zone-management-card space-y-4">
                    <h3 className="text-lg font-bold zone-label flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-400" />
                        Create Logistics Hub (Zone)
                    </h3>
                    <form onSubmit={handleCreateZone} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold uppercase zone-label mb-1">Zone Name</label>
                            <input
                                type="text"
                                required
                                placeholder="North Metro Hub"
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm zone-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase zone-label mb-1">Zone Code</label>
                            <input
                                type="text"
                                required
                                placeholder="Z-NORTH"
                                value={zoneCode}
                                onChange={(e) => setZoneCode(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm zone-input"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Zone Hub
                        </button>
                    </form>
                </div>

                <div className="zone-management-card space-y-4">
                    <h3 className="text-lg font-bold zone-label flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-indigo-400" />
                        Add Pincode Area to Hub
                    </h3>
                    <form onSubmit={handleCreateArea} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold uppercase zone-label mb-1">Select Target Zone</label>
                            <select
                                required
                                value={selectedZoneId}
                                onChange={(e) => setSelectedZoneId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm zone-input font-medium"
                            >
                                <option value="">Select Zone</option>
                                {zones.map(z => (
                                    <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase zone-label mb-1">Area Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Indiranagar Sector 4"
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm zone-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase zone-label mb-1">Pincode</label>
                            <input
                                type="text"
                                required
                                placeholder="560038"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm zone-input"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!selectedZoneId}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Pincode Area
                        </button>
                    </form>
                </div>
            </div>

            <div className="zone-management-card space-y-4">
                <h3 className="text-lg font-bold zone-label">Active Zone Network</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map(z => (
                        <div key={z.id} className="zone-network-card space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold zone-label">{z.name}</span>
                                <span className="zone-code-badge">
                                    {z.code}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {z.areas && z.areas.length > 0 ? (
                                    z.areas.map(a => (
                                        <span key={a.id} className="area-pill text-xs px-2.5 py-1 rounded-md font-semibold">
                                            {a.name} ({a.pincode})
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs zone-subheading italic">No areas mapped yet</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
