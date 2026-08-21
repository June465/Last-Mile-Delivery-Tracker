import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rescheduleOrderApi } from '../api/ordersApi';
import { X, CalendarClock, AlertCircle } from 'lucide-react';

export function RescheduleModal({ isOpen, onClose, order, onRescheduled }) {
    const { token } = useAuth();
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const maxAttempts = 3;
    const remaining = maxAttempts - (order?.reschedule_count || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!scheduledDate) return;
        setSubmitting(true);
        setError('');
        try {
            await rescheduleOrderApi(token, order.id, {
                scheduled_delivery_date: new Date(scheduledDate).toISOString(),
                notes: notes || null,
            });
            setScheduledDate('');
            setNotes('');
            onRescheduled();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !order) return null;

    // Min date: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, overflowY: 'auto', backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-600 text-white rounded-xl">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">Reschedule Delivery</h3>
                            <p className="font-mono text-xs text-orange-600 font-semibold">{order.tracking_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                            <strong>{remaining}</strong> reschedule attempt{remaining !== 1 ? 's' : ''} remaining out of <strong>{maxAttempts}</strong>.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Delivery Date</label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={minDate}
                            required
                            className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Please deliver after 5 PM"
                            rows={2}
                            className="w-full px-3 py-2.5 border rounded-xl text-sm bg-white resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || remaining <= 0}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <CalendarClock className="h-4 w-4" />
                        <span>{submitting ? 'Rescheduling...' : 'Confirm Reschedule'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
