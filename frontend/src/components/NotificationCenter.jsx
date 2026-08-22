import React, { useEffect, useState } from 'react';
import './NotificationCenter.css';
import { useAuth } from '../context/AuthContext';
import { Bell, X, Mail, MessageSquare, RefreshCw } from 'lucide-react';

export function NotificationCenter({ isOpen, onClose }) {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="notification-center-overlay" onClick={onClose} />
            <div className="notification-center-drawer animate-fade-in">
                <div className="notification-header">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-indigo-400" />
                        <h3 className="font-bold text-lg notification-title">Notifications</h3>
                        <span className="bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-2 py-0.5 rounded-full">
                            {notifications.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchNotifications}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-700/50 cursor-pointer"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-700/50 cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No notifications sent yet.</div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="notification-item">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        {n.channel === 'EMAIL' ? (
                                            <span className="notification-badge-email flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md">
                                                <Mail className="h-3 w-3" /> EMAIL
                                            </span>
                                        ) : (
                                            <span className="notification-badge-sms flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md">
                                                <MessageSquare className="h-3 w-3" /> SMS
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-[var(--text-h)]">{n.recipient}</span>
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] font-medium">
                                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {n.subject && (
                                    <div className="text-xs font-bold text-[var(--text-h)] mb-0.5">{n.subject}</div>
                                )}
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">{n.payload}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
