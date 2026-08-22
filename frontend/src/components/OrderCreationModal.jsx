import React, { useState, useEffect } from 'react';
import './OrderCreationModal.css';
import { useAuth } from '../context/AuthContext';
import { X, Package, Calculator, ArrowRight, ShieldAlert } from 'lucide-react';
import { createOrderApi } from '../api/ordersApi';
import { fetchZonesApi, previewRateApi } from '../api/zoneRateApi';

export function OrderCreationModal({ isOpen, onClose, onSuccess }) {
    const { token } = useAuth();
    const [zones, setZones] = useState([]);
    const [pickupAreaId, setPickupAreaId] = useState('');
    const [dropAreaId, setDropAreaId] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [length, setLength] = useState('10');
    const [breadth, setBreadth] = useState('10');
    const [height, setHeight] = useState('10');
    const [actualWeight, setActualWeight] = useState('1.0');
    const [orderType, setOrderType] = useState('B2C');
    const [paymentType, setPaymentType] = useState('PREPAID');

    const [ratePreview, setRatePreview] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && token) {
            fetchZonesApi()
                .then(data => setZones(data))
                .catch(err => console.error('Failed to fetch zones:', err));
        }
    }, [isOpen, token]);

    useEffect(() => {
        if (pickupAreaId && dropAreaId && length && breadth && height && actualWeight) {
            handlePreview();
        }
    }, [pickupAreaId, dropAreaId, length, breadth, height, actualWeight, orderType, paymentType]);

    const handlePreview = async () => {
        setCalculating(true);
        setError('');
        try {
            const data = await previewRateApi({
                pickup_area_id: parseInt(pickupAreaId),
                drop_area_id: parseInt(dropAreaId),
                dimensions_l: parseFloat(length),
                dimensions_b: parseFloat(breadth),
                dimensions_h: parseFloat(height),
                actual_weight: parseFloat(actualWeight),
                order_type: orderType,
                payment_type: paymentType
            });
            setRatePreview(data);
        } catch (err) {
            setRatePreview(null);
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await createOrderApi(token, {
                pickup_area_id: parseInt(pickupAreaId),
                drop_area_id: parseInt(dropAreaId),
                pickup_address: pickupAddress,
                drop_address: dropAddress,
                dimensions_l: parseFloat(length),
                dimensions_b: parseFloat(breadth),
                dimensions_h: parseFloat(height),
                actual_weight: parseFloat(actualWeight),
                order_type: orderType,
                payment_type: paymentType
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const allAreas = zones.flatMap(z => z.areas || []);

    return (
        <div className="order-modal-overlay">
            <div className="order-modal-card animate-fade-in">
                <div className="order-modal-header">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-slate-900">Create New Shipment</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-600" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pickup Area</label>
                            <select
                                required
                                value={pickupAreaId}
                                onChange={(e) => setPickupAreaId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input font-medium"
                            >
                                <option value="">Select Pickup Area</option>
                                {allAreas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Drop Area</label>
                            <select
                                required
                                value={dropAreaId}
                                onChange={(e) => setDropAreaId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input font-medium"
                            >
                                <option value="">Select Drop Area</option>
                                {allAreas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Pickup Street Address</label>
                            <input
                                type="text"
                                required
                                value={pickupAddress}
                                onChange={(e) => setPickupAddress(e.target.value)}
                                placeholder="123 Warehouse St, Floor 2"
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Drop Street Address</label>
                            <input
                                type="text"
                                required
                                value={dropAddress}
                                onChange={(e) => setDropAddress(e.target.value)}
                                placeholder="456 Customer Ave, Apt 4B"
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Length (cm)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Breadth (cm)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={breadth}
                                onChange={(e) => setBreadth(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                            <input
                                type="number"
                                required
                                step="0.1"
                                min="0.1"
                                value={actualWeight}
                                onChange={(e) => setActualWeight(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm order-modal-input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Order Category</label>
                            <div className="flex gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800">
                                    <input
                                        type="radio"
                                        name="orderType"
                                        value="B2C"
                                        checked={orderType === 'B2C'}
                                        onChange={() => setOrderType('B2C')}
                                    /> B2C Retail
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800">
                                    <input
                                        type="radio"
                                        name="orderType"
                                        value="B2B"
                                        checked={orderType === 'B2B'}
                                        onChange={() => setOrderType('B2B')}
                                    /> B2B Commercial
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Payment Method</label>
                            <div className="flex gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="PREPAID"
                                        checked={paymentType === 'PREPAID'}
                                        onChange={() => setPaymentType('PREPAID')}
                                    /> Prepaid
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-800">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value="COD"
                                        checked={paymentType === 'COD'}
                                        onChange={() => setPaymentType('COD')}
                                    /> Cash On Delivery (COD)
                                </label>
                            </div>
                        </div>
                    </div>

                    {ratePreview && (
                        <div className="rate-breakdown-panel space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                    <Calculator className="h-4 w-4 text-indigo-600" />
                                    Dynamic Rate Breakdown
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                    {ratePreview.is_intra_zone ? 'Intra-Zone Delivery' : 'Inter-Zone Delivery'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700 pt-1">
                                <div>Actual Wt: <strong>{ratePreview.actual_weight} kg</strong></div>
                                <div>Volumetric Wt: <strong>{ratePreview.volumetric_weight} kg</strong></div>
                                <div>Billing Wt: <strong className="text-indigo-600">{ratePreview.billing_weight} kg</strong></div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
                                <span>Base Charge (₹{ratePreview.applied_rate_per_kg}/kg): ₹{ratePreview.base_charge}</span>
                                {ratePreview.cod_surcharge > 0 && (
                                    <span className="text-amber-700 font-bold">+ COD Surcharge: ₹{ratePreview.cod_surcharge}</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                                <span>Total Estimated Charge:</span>
                                <span className="text-indigo-600 text-xl">₹{ratePreview.total_charge}</span>
                            </div>
                        </div>
                    )}

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
                            disabled={submitting || !ratePreview}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? 'Creating Shipment...' : 'Confirm & Create Order'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
