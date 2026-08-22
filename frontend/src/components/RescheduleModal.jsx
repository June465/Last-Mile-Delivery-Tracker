import React, { useState } from 'react';
import './RescheduleModal.css';
import { useAuth } from '../context/AuthContext';
import { X, Clock, AlertCircle } from 'lucide-react';
import { rescheduleOrderApi } from '../api/ordersApi';

export function RescheduleModal({ order, isOpen, onClose }) {
    const { token } = useAuth();
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !order) return null;

    const remainingAttempts = 3 - (order.reschedule_count || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await rescheduleOrderApi(token, order.id, { new_time: scheduledDate, reason: notes });
            onClose();
        } catch (err) {
            setError(err.message || 'Reschedule failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="reschedule-modal-overlay">
            <div className="reschedule-modal-card animate-fade-in">
                <div className="reschedule-modal-header">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <h3 className="text-lg font-bold text-slate-900">Reschedule Delivery Attempt</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg font-semibold">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span>Max 3 Re-attempts allowed</span>
                        </div>
                        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                            {remainingAttempts} Attempts Remaining
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">Select New Delivery Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm reschedule-input font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">Reason / Reschedule Notes</label>
                        <textarea
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Customer unavailable during first attempt..."
                            className="w-full px-3 py-2 border rounded-lg text-sm reschedule-input"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || remainingAttempts <= 0}
                            className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Confirm Reschedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
