import React, { useState } from 'react';
import './OrderList.css';
import { useAuth } from '../context/AuthContext';
import { Package, Search, UserCheck, Activity, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { LiveTrackingTimeline } from './LiveTrackingTimeline';
import { AgentAssignmentModal } from './AgentAssignmentModal';
import { RescheduleModal } from './RescheduleModal';
import { assignAgentApi } from '../api/ordersApi';

export function OrderList({ orders, userRole, user, loading, onRefresh }) {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrderTracking, setSelectedOrderTracking] = useState(null);
    const [selectedOrderAssign, setSelectedOrderAssign] = useState(null);
    const [selectedOrderReschedule, setSelectedOrderReschedule] = useState(null);
    const [acceptingId, setAcceptingId] = useState(null);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'CREATED': return 'status-badge-created';
            case 'AGENT_ASSIGNED': case 'ASSIGNED': case 'PICKED_UP': return 'status-badge-assigned';
            case 'IN_TRANSIT': case 'OUT_FOR_DELIVERY': return 'status-badge-transit';
            case 'DELIVERED': return 'status-badge-delivered';
            case 'FAILED': return 'status-badge-failed';
            default: return 'bg-slate-800 text-slate-200 border-slate-700';
        }
    };

    const handleAcceptOrder = async (orderId) => {
        setAcceptingId(orderId);
        try {
            await assignAgentApi(token, orderId, {});
            if (onRefresh) onRefresh();
        } catch (err) {
            alert(err.message || 'Failed to accept order');
        } finally {
            setAcceptingId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.drop_address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? order.current_status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="order-list-card">
            {/* Header & Controls */}
            <div className="p-5 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold order-cell-title flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-400" />
                        Shipments & Orders
                    </h3>
                    <p className="text-xs font-semibold order-cell-muted">View live status, assigned agents, and tracking timelines</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search tracking or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border rounded-lg text-sm order-filter-input w-64"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm order-filter-input font-medium"
                    >
                        <option value="">All Statuses</option>
                        <option value="CREATED">CREATED</option>
                        <option value="AGENT_ASSIGNED">AGENT_ASSIGNED</option>
                        <option value="PICKED_UP">PICKED_UP</option>
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="FAILED">FAILED</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="order-table-header border-b border-slate-700/60">
                            <th className="py-3 px-4">Tracking #</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Route</th>
                            <th className="py-3 px-4">Cost</th>
                            <th className="py-3 px-4">Agent</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-8 text-center order-cell-muted font-semibold">
                                    No shipments match the given search criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-[var(--glass-bg)] transition-colors border-b border-[var(--border)]">
                                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-500">
                                        {order.tracking_number}
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold">
                                        <span className="order-pill-type inline-block px-2 py-0.5 rounded text-xs">
                                            {order.order_type} ({order.payment_type})
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs font-medium space-y-0.5">
                                        <div><strong className="order-cell-title">From:</strong> <span className="order-cell-muted">{order.pickup_address}</span></div>
                                        <div><strong className="order-cell-title">To:</strong> <span className="order-cell-muted">{order.drop_address}</span></div>
                                    </td>
                                    <td className="py-3.5 px-4 order-cell-bold text-base">
                                        ₹{order.total_charge}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {order.agent ? (
                                            <div className="flex items-center gap-1.5 text-xs order-cell-title">
                                                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                                                {order.agent.name}
                                            </div>
                                        ) : (
                                            <span className="text-xs order-pill-unassigned font-bold px-2.5 py-1 rounded">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wide uppercase ${getStatusBadgeClass(order.current_status)}`}>
                                            {order.current_status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right space-x-2">
                                        <button
                                            onClick={() => setSelectedOrderTracking(order)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 rounded-lg border border-indigo-500/40 transition-colors cursor-pointer"
                                            title="Live Tracking Timeline"
                                        >
                                            <Activity className="h-3.5 w-3.5" /> Track
                                        </button>

                                        {/* Assign button - ONLY for ADMIN on UNASSIGNED orders */}
                                        {userRole === 'ADMIN' && !order.agent && (!order.agent_id || order.agent_id === null) && (
                                            <button
                                                onClick={() => setSelectedOrderAssign(order)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 rounded-lg border border-purple-500/40 transition-colors cursor-pointer"
                                                title="Assign Agent"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" /> Assign
                                            </button>
                                        )}

                                        {/* Agent Accept button - ONLY for DELIVERY_AGENT on unassigned orders in pickup zone */}
                                        {(userRole === 'DELIVERY_AGENT' || userRole === 'AGENT') && !order.agent && (!order.agent_id || order.agent_id === null) && order.current_status === 'CREATED' && (() => {
                                            const agentZoneId = user?.agent_location?.zone_id || user?.assigned_zone_id || user?.zone_id;
                                            const pickupZoneId = order.pickup_area?.zone_id || order.pickup_area?.zone?.id;
                                            const isZoneMatch = !agentZoneId || !pickupZoneId || (agentZoneId === pickupZoneId);

                                            if (isZoneMatch) {
                                                return (
                                                    <button
                                                        onClick={() => handleAcceptOrder(order.id)}
                                                        disabled={acceptingId === order.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-500/40 transition-colors cursor-pointer disabled:opacity-50"
                                                        title="Accept Order for Delivery"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                                        {acceptingId === order.id ? 'Accepting...' : 'Accept'}
                                                    </button>
                                                );
                                            } else {
                                                return (
                                                    <span className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60" title="Pickup zone differs from your assigned zone">
                                                        Outside Zone
                                                    </span>
                                                );
                                            }
                                        })()}

                                        {/* Reschedule button */}
                                        {order.current_status === 'FAILED' && (
                                            <button
                                                onClick={() => setSelectedOrderReschedule(order)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                                                title="Reschedule Delivery"
                                            >
                                                <Clock className="h-3.5 w-3.5" /> Reschedule
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tracking Modal Drawer */}
            {selectedOrderTracking && (
                <LiveTrackingTimeline
                    order={selectedOrderTracking}
                    onClose={() => {
                        setSelectedOrderTracking(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Assign Agent Modal */}
            {selectedOrderAssign && (
                <AgentAssignmentModal
                    order={selectedOrderAssign}
                    isOpen={true}
                    onClose={() => {
                        setSelectedOrderAssign(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Reschedule Delivery Modal */}
            {selectedOrderReschedule && (
                <RescheduleModal
                    order={selectedOrderReschedule}
                    isOpen={true}
                    onClose={() => {
                        setSelectedOrderReschedule(null);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}
