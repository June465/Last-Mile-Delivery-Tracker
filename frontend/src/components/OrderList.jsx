import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AgentAssignmentModal } from './AgentAssignmentModal';
import { Package, MapPin, UserCheck, Compass } from 'lucide-react';

export function OrderList({ orders, loading, onRefresh }) {
    const { user } = useAuth();
    const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'CREATED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">CREATED</span>;
            case 'AGENT_ASSIGNED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">AGENT ASSIGNED</span>;
            case 'PICKED_UP':
                return <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">PICKED UP</span>;
            case 'IN_TRANSIT':
                return <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">IN TRANSIT</span>;
            case 'OUT_FOR_DELIVERY':
                return <span className="px-2.5 py-1 text-xs font-bold bg-cyan-100 text-cyan-800 rounded-full">OUT FOR DELIVERY</span>;
            case 'DELIVERED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">DELIVERED</span>;
            case 'FAILED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">FAILED</span>;
            case 'RESCHEDULED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-800 rounded-full">RESCHEDULED</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded-full">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500 font-medium">Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No Orders Found</h3>
                <p className="text-sm text-gray-500">No active delivery orders placed yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Active Orders ({orders.length})</h3>
                <button
                    onClick={onRefresh}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    Refresh List
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="font-mono text-sm font-bold text-indigo-900">{order.tracking_number}</span>
                                    <p className="text-xs text-gray-400">
                                        Placed on {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                                    {order.order_type} ({order.payment_type})
                                </span>
                                {getStatusBadge(order.current_status)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <p className="font-bold text-gray-700 flex items-center space-x-1">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-600 inline" />
                                    <span>Pickup: {order.pickup_area?.name} ({order.pickup_area?.pincode})</span>
                                </p>
                                <p className="text-gray-500 pl-5">{order.pickup_address}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="font-bold text-gray-700 flex items-center space-x-1">
                                    <MapPin className="h-3.5 w-3.5 text-rose-600 inline" />
                                    <span>Drop: {order.drop_area?.name} ({order.drop_area?.pincode})</span>
                                </p>
                                <p className="text-gray-500 pl-5">{order.drop_address}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                            <div className="flex items-center space-x-4">
                                <span>Agent: {order.agent ? <strong className="text-gray-900">{order.agent.name}</strong> : <span className="text-amber-600 font-bold">Unassigned</span>}</span>
                                <span>Billing Weight: <strong className="text-gray-900">{order.billing_weight} kg</strong></span>
                            </div>

                            <div className="flex items-center space-x-3">
                                {order.current_status === 'CREATED' && (user.role === 'ADMIN' || user.role === 'DELIVERY_AGENT') && (
                                    <button
                                        onClick={() => setSelectedOrderForAssign(order)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center space-x-1"
                                    >
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span>Assign Agent</span>
                                    </button>
                                )}

                                <span className="text-base font-black text-gray-900">₹{order.total_charge}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AgentAssignmentModal
                isOpen={!!selectedOrderForAssign}
                onClose={() => setSelectedOrderForAssign(null)}
                order={selectedOrderForAssign}
                onAssigned={onRefresh}
            />
        </div>
    );
}
