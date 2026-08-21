import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchZonesApi, previewRateApi } from '../api/zoneRateApi';
import { createOrderApi } from '../api/ordersApi';
import { X, Package, ArrowRight, CheckCircle2, Truck } from 'lucide-react';

export function OrderCreationModal({ isOpen, onClose, onOrderCreated }) {
    const { token, user } = useAuth();
    const [zones, setZones] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loadingZones, setLoadingZones] = useState(true);

    // Form State
    const [pickupAreaId, setPickupAreaId] = useState('');
    const [dropAreaId, setDropAreaId] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [lengthCm, setLengthCm] = useState(30);
    const [widthCm, setWidthCm] = useState(20);
    const [heightCm, setHeightCm] = useState(15);
    const [actualWeightKg, setActualWeightKg] = useState(2.5);
    const [orderType, setOrderType] = useState('B2C');
    const [paymentType, setPaymentType] = useState('PREPAID');

    // Preview State & Submission
    const [ratePreview, setRatePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadZonesAndAreas();
        }
    }, [isOpen]);

    useEffect(() => {
        if (pickupAreaId && dropAreaId) {
            updateRatePreview();
        }
    }, [pickupAreaId, dropAreaId, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType]);

    const loadZonesAndAreas = async () => {
        try {
            setLoadingZones(true);
            const data = await fetchZonesApi();
            setZones(data);
            const allAreas = data.flatMap((z) => z.areas || []);
            setAreas(allAreas);
            if (allAreas.length >= 2) {
                setPickupAreaId(allAreas[0].id);
                setDropAreaId(allAreas[1].id);
            } else if (allAreas.length === 1) {
                setPickupAreaId(allAreas[0].id);
                setDropAreaId(allAreas[0].id);
            }
        } catch (err) {
            setError('Failed to load delivery zones');
        } finally {
            setLoadingZones(false);
        }
    };

    const updateRatePreview = async () => {
        try {
            const res = await previewRateApi({
                pickup_area_id: Number(pickupAreaId),
                drop_area_id: Number(dropAreaId),
                dimensions_l: Number(lengthCm),
                dimensions_b: Number(widthCm),
                dimensions_h: Number(heightCm),
                actual_weight: Number(actualWeightKg),
                order_type: orderType,
                payment_type: paymentType,
            });
            setRatePreview(res);
        } catch (err) {
            // Ignore preview errors silently
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pickupAddress || !dropAddress) {
            setError('Please provide full pickup and drop addresses');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await createOrderApi(token, {
                pickup_area_id: Number(pickupAreaId),
                drop_area_id: Number(dropAreaId),
                pickup_address: pickupAddress,
                drop_address: dropAddress,
                dimensions_l: Number(lengthCm),
                dimensions_b: Number(widthCm),
                dimensions_h: Number(heightCm),
                actual_weight: Number(actualWeightKg),
                order_type: orderType,
                payment_type: paymentType,
            });
            onOrderCreated();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, overflowY: 'auto', backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Create New Delivery Order</h3>
                            <p className="text-xs text-gray-500">Live rate engine automatically calculates billing weight & fees</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs">{error}</div>}

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Location & Dimensions */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pickup Area</label>
                                <select
                                    value={pickupAreaId}
                                    onChange={(e) => setPickupAreaId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    {areas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.pincode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Drop Area</label>
                                <select
                                    value={dropAreaId}
                                    onChange={(e) => setDropAreaId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    {areas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.pincode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pickup Street Address</label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Full street name, building number, landmark"
                                value={pickupAddress}
                                onChange={(e) => setPickupAddress(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Drop Street Address</label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Full destination address, recipient contact"
                                value={dropAddress}
                                onChange={(e) => setDropAddress(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">L (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={lengthCm}
                                    onChange={(e) => setLengthCm(e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">W (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={widthCm}
                                    onChange={(e) => setWidthCm(e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">H (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={actualWeightKg}
                                    onChange={(e) => setActualWeightKg(e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded-lg text-sm font-semibold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Order Type</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('B2C')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${orderType === 'B2C' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        B2C Retail
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderType('B2B')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${orderType === 'B2B' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        B2B Bulk
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Payment Method</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentType('PREPAID')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${paymentType === 'PREPAID' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        Prepaid
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentType('COD')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${paymentType === 'COD' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        COD
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Rate Breakdown & Submit */}
                    <div className="lg:col-span-5 bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col justify-between">
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center justify-between">
                                <span>Rate Breakdown</span>
                                <span className="text-xs font-normal text-gray-500">Live Auto-Calc</span>
                            </h4>

                            {ratePreview ? (
                                <div className="space-y-2 text-xs">
                                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-1">
                                        <div className="flex justify-between font-semibold text-gray-700">
                                            <span>Route:</span>
                                            <span className={ratePreview.is_intra_zone ? 'text-green-700' : 'text-orange-700'}>
                                                {ratePreview.is_intra_zone ? 'Intra-Zone' : 'Inter-Zone'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Volumetric:</span>
                                            <span>{ratePreview.volumetric_weight} kg</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>Actual:</span>
                                            <span>{ratePreview.actual_weight} kg</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-indigo-700 pt-1 border-t border-gray-100">
                                            <span>Billing Weight:</span>
                                            <span>{ratePreview.billing_weight} kg</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-gray-600 px-1">
                                        <div className="flex justify-between">
                                            <span>Base Charge:</span>
                                            <span>₹{ratePreview.base_charge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>COD Surcharge:</span>
                                            <span>+ ₹{ratePreview.cod_surcharge}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-300 flex items-center justify-between px-1">
                                        <span className="font-bold text-gray-900 uppercase">Total Cost</span>
                                        <span className="text-xl font-black text-gray-900">₹{ratePreview.total_charge}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Calculating rate breakdown...</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                        >
                            <span>{submitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
