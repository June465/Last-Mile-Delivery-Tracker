import React, { useState } from 'react';
import './LiveTrackingTimeline.css';
import { useAuth } from '../context/AuthContext';
import { Activity, X, Check, Truck, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { updateOrderStatusApi } from '../api/ordersApi';

export function LiveTrackingTimeline({ order, userRole, onClose }) {
    const { user, token } = useAuth();
    const role = userRole || user?.role;
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const lifecycleSteps = [
        { key: 'CREATED', label: 'Order Created' },
        { key: 'ASSIGNED', label: 'Agent Assigned' },
        { key: 'PICKED_UP', label: 'Package Picked Up' },
        { key: 'IN_TRANSIT', label: 'In Transit' },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { key: 'DELIVERED', label: 'Delivered' }
    ];

    const currentStepIndex = lifecycleSteps.findIndex(s => s.key === order.current_status);

    const getNextStatusOptions = (status) => {
        switch (status) {
            case 'CREATED':
            case 'ASSIGNED':
                return [{ status: 'PICKED_UP', label: 'Advance to PICKED_UP', bg: 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40' }];
            case 'PICKED_UP':
                return [{ status: 'IN_TRANSIT', label: 'Advance to IN_TRANSIT', bg: 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border-blue-500/40' }];
            case 'IN_TRANSIT':
                return [{ status: 'OUT_FOR_DELIVERY', label: 'Advance to OUT_FOR_DELIVERY', bg: 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border-purple-500/40' }];
            case 'OUT_FOR_DELIVERY':
                return [{ status: 'DELIVERED', label: 'Mark as DELIVERED', bg: 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40' }];
            case 'FAILED':
                return [
                    { status: 'OUT_FOR_DELIVERY', label: 'Retry OUT_FOR_DELIVERY', bg: 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border-purple-500/40' },
                    { status: 'PICKED_UP', label: 'Re-pickup Package', bg: 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40' }
                ];
            case 'DELIVERED':
            default:
                return [];
        }
    };

    const nextOptions = getNextStatusOptions(order.current_status);

    const handleStatusTransition = async (nextStatus) => {
        setUpdating(true);
        setError('');
        try {
            await updateOrderStatusApi(token, order.id, { status: nextStatus, notes });
            setNotes('');
            onClose();
        } catch (err) {
            setError(err.message || 'Status transition failed');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <>
            <div className="timeline-drawer-overlay" onClick={onClose} />
            <div className="timeline-drawer animate-fade-in">
                <div className="timeline-header">
                    <div>
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-400" />
                            <h3 className="font-bold text-slate-100 text-lg">Live Shipment Tracking</h3>
                        </div>
                        <p className="text-xs font-mono font-bold text-indigo-400 mt-0.5">{order.tracking_number}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-950/40 border border-red-500/40 text-red-300 text-xs p-3 rounded-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            {error}
                        </div>
                    )}

                    <div className="timeline-address-box space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="timeline-address-title">Pickup:</span> {order.pickup_address}
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Truck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="timeline-address-title">Drop:</span> {order.drop_address}
                            </div>
                        </div>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border)]">
                        {lifecycleSteps.map((step, idx) => {
                            const isDone = idx < currentStepIndex || order.current_status === 'DELIVERED';
                            const isCurrent = idx === currentStepIndex && order.current_status !== 'DELIVERED';

                            let stepClass = 'timeline-step-pending';
                            if (isDone) stepClass = 'timeline-step-done';
                            if (isCurrent) stepClass = 'timeline-step-active';

                            return (
                                <div key={step.key} className="relative flex items-center gap-4">
                                    <div className={`timeline-step-icon ${stepClass}`}>
                                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isCurrent ? 'text-indigo-400' : isDone ? 'text-slate-100' : 'text-slate-400'}`}>
                                            {step.label}
                                        </h4>
                                        {isCurrent && (
                                            <span className="text-xs text-indigo-400 font-extrabold uppercase animate-pulse">Current Status</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Update Status controls are ONLY visible to ADMIN or DELIVERY_AGENT */}
                    {role !== 'CUSTOMER' && (
                        <div className="pt-4 border-t border-slate-700/60 space-y-3">
                            <h4 className="text-xs font-bold uppercase text-slate-300">Update Status</h4>

                            {order.current_status === 'DELIVERED' ? (
                                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2 justify-center">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    Shipment Completed & Delivered
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {nextOptions.map((opt) => (
                                        <button
                                            key={opt.status}
                                            disabled={updating}
                                            onClick={() => handleStatusTransition(opt.status)}
                                            className={`w-full px-3 py-2.5 ${opt.bg} text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-2`}
                                        >
                                            <ArrowRight className="h-4 w-4" /> {opt.label}
                                        </button>
                                    ))}

                                    {order.current_status !== 'FAILED' && (
                                        <button
                                            disabled={updating}
                                            onClick={() => handleStatusTransition('FAILED')}
                                            className="w-full py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-lg border border-red-500/40 transition-colors cursor-pointer mt-1"
                                        >
                                            Mark Delivery FAILED
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
