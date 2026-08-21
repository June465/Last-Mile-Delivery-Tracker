import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignAgentApi } from '../api/ordersApi';
import { X, UserCheck, Compass, Sparkles, AlertCircle } from 'lucide-react';

export function AgentAssignmentModal({ isOpen, onClose, order, onAssigned }) {
    const { token } = useAuth();
    const [agents, setAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAgents();
        }
    }, [isOpen]);

    const fetchAgents = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/users/agents', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
                if (data.length > 0) setSelectedAgentId(data[0].id);
            }
        } catch (err) {
            // Ignore
        }
    };

    const handleAutoAssign = async () => {
        setSubmitting(true);
        setError('');
        try {
            await assignAgentApi(token, order.id, { auto_assign: true });
            onAssigned();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualAssign = async (e) => {
        e.preventDefault();
        if (!selectedAgentId) return;
        setSubmitting(true);
        setError('');
        try {
            await assignAgentApi(token, order.id, { agent_id: Number(selectedAgentId), auto_assign: false });
            onAssigned();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, overflowY: 'auto', backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Assign Delivery Agent</h3>
                            <p className="font-mono text-xs text-indigo-600 font-semibold">{order.tracking_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>}

                <div className="p-6 space-y-6">
                    {/* Option A: Auto-Assign Nearest Agent */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            <h4 className="font-bold text-indigo-900 text-sm">Smart Auto-Assignment</h4>
                        </div>
                        <p className="text-xs text-gray-600">
                            Matches nearest available delivery agent in <strong>{order.pickup_area?.name}</strong> zone based on real-time location.
                        </p>
                        <button
                            onClick={handleAutoAssign}
                            disabled={submitting}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            <Compass className="h-4 w-4 animate-spin-slow" />
                            <span>{submitting ? 'Matching Agent...' : 'Auto-Assign Nearest Agent'}</span>
                        </button>
                    </div>

                    <div className="relative flex items-center justify-center">
                        <div className="border-t border-gray-200 w-full"></div>
                        <span className="bg-white px-3 text-xs text-gray-400 uppercase font-semibold relative">Or Manual Selection</span>
                    </div>

                    {/* Option B: Manual Agent Selection */}
                    <form onSubmit={handleManualAssign} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Delivery Agent</label>
                            <select
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                            >
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || agents.length === 0}
                            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                            Assign Selected Agent
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
