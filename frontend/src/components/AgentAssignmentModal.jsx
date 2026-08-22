import React, { useState } from 'react';
import './AgentAssignmentModal.css';
import { useAuth } from '../context/AuthContext';
import { X, UserCheck, Zap, ShieldAlert, CheckCircle } from 'lucide-react';
import { assignAgentApi } from '../api/ordersApi';

export function AgentAssignmentModal({ order, isOpen, onClose }) {
    const { token } = useAuth();
    const [agentId, setAgentId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen || !order) return null;

    const handleAssign = async (autoAssign = false) => {
        setSubmitting(true);
        setError('');
        setSuccessMsg('');
        try {
            const body = autoAssign ? { auto_assign: true } : { agent_id: parseInt(agentId) };
            const updatedOrder = await assignAgentApi(token, order.id, body);

            setSuccessMsg(`Successfully assigned agent: ${updatedOrder.agent ? updatedOrder.agent.name : 'Auto Assigned'}`);
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="assign-modal-overlay">
            <div className="assign-modal-card animate-fade-in">
                <div className="assign-modal-header">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-indigo-500" />
                        <h3 className="text-lg font-bold text-[var(--text-h)]">Assign Delivery Agent</h3>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-h)] p-1 rounded-lg cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-950/40 border border-red-500/40 text-red-300 text-sm p-3 rounded-lg font-medium flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm p-3 rounded-lg font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            {successMsg}
                        </div>
                    )}

                    <div className="assign-info-box">
                        <div>Tracking #: <span className="font-bold text-indigo-500">{order.tracking_number}</span></div>
                        <div className="mt-1">Pickup Address: {order.pickup_address}</div>
                    </div>

                    <div className="assign-auto-card space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
                                <Zap className="h-4 w-4 text-indigo-500" />
                                Smart Proximity Auto-Assignment
                            </div>
                            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-500/40 px-2 py-0.5 rounded">
                                Recommended
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                            Automatically assigns the nearest available agent matching the pickup zone.
                        </p>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleAssign(true)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? 'Assigning...' : 'Auto-Assign Nearest Agent'}
                        </button>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold uppercase text-[var(--text-h)]">Or Manual Select Agent ID</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Agent User ID (e.g., 2)"
                                value={agentId}
                                onChange={(e) => setAgentId(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm assign-modal-input"
                            />
                            <button
                                type="button"
                                disabled={submitting || !agentId}
                                onClick={() => handleAssign(false)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Assign ID
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--glass-bg)] rounded-lg cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
