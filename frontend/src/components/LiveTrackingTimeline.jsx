import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateOrderStatusApi } from '../api/ordersApi';
import { RescheduleModal } from './RescheduleModal';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertTriangle, ShieldCheck, ChevronRight, CalendarClock, RefreshCcw } from 'lucide-react';

export function LiveTrackingTimeline({ order, onStatusUpdated }) {
    const { token, user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [customNotes, setCustomNotes] = useState('');
    const [showReschedule, setShowReschedule] = useState(false);

    const canAdvanceStatus =
        user.role === 'ADMIN' || (user.role === 'DELIVERY_AGENT' && order.agent_id === user.id);

    const canReschedule =
        order.current_status === 'FAILED' && (user.role === 'ADMIN' || user.role === 'CUSTOMER');

    const handleStatusTransition = async (nextStatus, defaultNote) => {
        setSubmitting(true);
        setError('');
        try {
            const noteToSend = customNotes.trim() || defaultNote;
            await updateOrderStatusApi(token, order.id, {
                new_status: nextStatus,
                notes: noteToSend,
            });
            setCustomNotes('');
            if (onStatusUpdated) onStatusUpdated();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getStepIcon = (status) => {
        switch (status) {
            case 'CREATED':
                return <Clock className="h-4 w-4 text-blue-600" />;
            case 'AGENT_ASSIGNED':
                return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
            case 'PICKED_UP':
                return <PackageCheck className="h-4 w-4 text-amber-600" />;
            case 'IN_TRANSIT':
            case 'OUT_FOR_DELIVERY':
                return <Truck className="h-4 w-4 text-purple-600" />;
            case 'DELIVERED':
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            case 'FAILED':
                return <AlertTriangle className="h-4 w-4 text-rose-600" />;
            case 'RESCHEDULED':
                return <RefreshCcw className="h-4 w-4 text-orange-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <span>Live Tracking & Immutable Audit History</span>
                </h4>
                <span className="text-xs font-semibold text-gray-400">
                    Tracking #{order.tracking_number}
                </span>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium">{error}</div>}

            {/* Visual Timeline Stepper */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {(order.tracking_history || []).map((history, idx) => (
                    <div key={history.id || idx} className="relative flex items-start space-x-3 group">
                        <div className="absolute -left-6 mt-0.5 p-1 bg-white border-2 border-indigo-600 rounded-full shadow-sm">
                            {getStepIcon(history.new_status)}
                        </div>

                        <div className="flex-1 bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                                    {history.new_status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(history.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600">{history.notes}</p>
                            <div className="mt-2 flex items-center space-x-2 text-[10px]">
                                <span className="px-2 py-0.5 font-bold bg-gray-100 text-gray-700 rounded-md">
                                    Role: {history.actor_role}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reschedule Button for FAILED orders */}
            {canReschedule && (
                <div className="pt-3 border-t border-gray-200">
                    <div className="p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100 space-y-3">
                        <p className="text-xs text-gray-700">
                            Delivery attempt failed. You have <strong>{3 - (order.reschedule_count || 0)}</strong> reschedule attempt{3 - (order.reschedule_count || 0) !== 1 ? 's' : ''} remaining.
                        </p>
                        <button
                            onClick={() => setShowReschedule(true)}
                            disabled={(order.reschedule_count || 0) >= 3}
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            <CalendarClock className="h-4 w-4" />
                            <span>Reschedule Delivery</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Agent & Admin Control Panel for Status Advancement */}
            {canAdvanceStatus && order.current_status !== 'DELIVERED' && order.current_status !== 'FAILED' && (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-700">Update Delivery Status</label>
                    <input
                        type="text"
                        placeholder="Add optional operational notes (e.g. Package collected from merchant)"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                    />

                    <div className="flex flex-wrap gap-2">
                        {order.current_status === 'AGENT_ASSIGNED' && (
                            <button
                                onClick={() => handleStatusTransition('PICKED_UP', 'Package picked up from origin address.')}
                                disabled={submitting}
                                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                            >
                                <span>Confirm Pickup</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {order.current_status === 'PICKED_UP' && (
                            <button
                                onClick={() => handleStatusTransition('IN_TRANSIT', 'Package in transit to delivery hub.')}
                                disabled={submitting}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                            >
                                <span>Start Transit</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {order.current_status === 'IN_TRANSIT' && (
                            <button
                                onClick={() => handleStatusTransition('OUT_FOR_DELIVERY', 'Agent out for last-mile delivery to destination.')}
                                disabled={submitting}
                                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                            >
                                <span>Out for Delivery</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        )}

                        {order.current_status === 'OUT_FOR_DELIVERY' && (
                            <>
                                <button
                                    onClick={() => handleStatusTransition('DELIVERED', 'Package successfully delivered to customer recipient.')}
                                    disabled={submitting}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Mark Delivered</span>
                                </button>
                                <button
                                    onClick={() => handleStatusTransition('FAILED', 'Delivery attempt failed (Customer unavailable/Door locked).')}
                                    disabled={submitting}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Mark Failed</span>
                                </button>
                            </>
                        )}

                        {order.current_status === 'RESCHEDULED' && (
                            <button
                                onClick={() => handleStatusTransition('OUT_FOR_DELIVERY', 'Re-attempting delivery for rescheduled order.')}
                                disabled={submitting}
                                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                            >
                                <span>Re-attempt Delivery</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <RescheduleModal
                isOpen={showReschedule}
                onClose={() => setShowReschedule(false)}
                order={order}
                onRescheduled={onStatusUpdated}
            />
        </div>
    );
}
