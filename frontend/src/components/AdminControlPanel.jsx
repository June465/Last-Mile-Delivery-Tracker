import React, { useEffect, useState } from 'react';
import './AdminControlPanel.css';
import { useAuth } from '../context/AuthContext';
import { DollarSign, CheckCircle2, Users, PackageCheck, Activity } from 'lucide-react';

export function AdminControlPanel() {
    const { token } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const res = await fetch(`${baseUrl}/admin/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error('Analytics fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [token]);

    if (loading) {
        return <div className="p-6 text-sm font-semibold text-slate-500">Loading analytics dashboard...</div>;
    }

    if (!analytics) return null;

    return (
        <div className="space-y-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Executive Analytics</h2>
                    <p className="text-sm font-semibold text-slate-500">Real-time revenue, order success rate, and active agent metrics</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-bold">
                    <Activity className="h-4 w-4 animate-pulse" /> Live Monitoring
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-panel-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="admin-kpi-label">Total Revenue</p>
                            <h3 className="admin-kpi-value mt-1">₹{analytics.total_revenue?.toLocaleString() || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl admin-kpi-icon-indigo">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="admin-panel-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="admin-kpi-label">Success Rate</p>
                            <h3 className="admin-kpi-value mt-1">{analytics.success_rate || 0}%</h3>
                        </div>
                        <div className="p-3 rounded-xl admin-kpi-icon-green">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="admin-panel-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="admin-kpi-label">Total Deliveries</p>
                            <h3 className="admin-kpi-value mt-1">{analytics.total_orders || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl admin-kpi-icon-purple">
                            <PackageCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="admin-panel-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="admin-kpi-label">Active Agents</p>
                            <h3 className="admin-kpi-value mt-1">{analytics.active_agents || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl admin-kpi-icon-amber">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
