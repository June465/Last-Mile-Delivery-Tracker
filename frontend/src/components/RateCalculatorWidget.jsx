import React, { useState, useEffect } from 'react';
import './RateCalculatorWidget.css';
import { useAuth } from '../context/AuthContext';
import { Calculator, ArrowRight } from 'lucide-react';
import { fetchZonesApi, previewRateApi } from '../api/zoneRateApi';

export function RateCalculatorWidget() {
    const { token } = useAuth();
    const [zones, setZones] = useState([]);
    const [pickupAreaId, setPickupAreaId] = useState('');
    const [dropAreaId, setDropAreaId] = useState('');
    const [length, setLength] = useState('15');
    const [breadth, setBreadth] = useState('15');
    const [height, setHeight] = useState('15');
    const [actualWeight, setActualWeight] = useState('2.5');
    const [orderType, setOrderType] = useState('B2C');
    const [paymentType, setPaymentType] = useState('PREPAID');

    const [ratePreview, setRatePreview] = useState(null);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchZonesApi()
            .then(data => setZones(data))
            .catch(err => console.error(err));
    }, []);

    const handleCalculate = async (e) => {
        e?.preventDefault();
        if (!pickupAreaId || !dropAreaId) return;
        setCalculating(true);
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
            console.error('Rate preview error:', err);
        } finally {
            setCalculating(false);
        }
    };

    const allAreas = zones.flatMap(z => z.areas || []);

    return (
        <div className="calculator-widget-card space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold calc-label tracking-tight flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-indigo-400" />
                    Instant Rate Calculator Engine
                </h2>
                <p className="text-sm font-semibold calc-subheading">Estimate total shipping cost using volumetric weight divisor formula</p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase calc-label mb-1">Pickup Area</label>
                        <select
                            required
                            value={pickupAreaId}
                            onChange={(e) => setPickupAreaId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input font-medium"
                        >
                            <option value="">Select Pickup Area</option>
                            {allAreas.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase calc-label mb-1">Drop Area</label>
                        <select
                            required
                            value={dropAreaId}
                            onChange={(e) => setDropAreaId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input font-medium"
                        >
                            <option value="">Select Drop Area</option>
                            {allAreas.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-bold calc-label mb-1">L (cm)</label>
                        <input
                            type="number"
                            required
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold calc-label mb-1">B (cm)</label>
                        <input
                            type="number"
                            required
                            value={breadth}
                            onChange={(e) => setBreadth(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold calc-label mb-1">H (cm)</label>
                        <input
                            type="number"
                            required
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold calc-label mb-1">Wt (kg)</label>
                        <input
                            type="number"
                            required
                            step="0.1"
                            value={actualWeight}
                            onChange={(e) => setActualWeight(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase calc-label mb-1">Tier</label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input font-medium"
                        >
                            <option value="B2C">B2C Retail</option>
                            <option value="B2B">B2B Commercial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase calc-label mb-1">Payment</label>
                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm calculator-input font-medium"
                        >
                            <option value="PREPAID">Prepaid</option>
                            <option value="COD">Cash On Delivery (COD)</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={calculating || !pickupAreaId || !dropAreaId}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {calculating ? 'Calculating...' : 'Calculate Shipping Estimate'}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </form>

            {ratePreview && (
                <div className="calc-breakdown-box space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <span className="font-bold calc-label text-sm">Calculation Details</span>
                        <span className="text-xs font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 px-2.5 py-0.5 rounded">
                            {ratePreview.is_intra_zone ? 'Intra-Zone Route' : 'Inter-Zone Route'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-semibold calc-subheading">
                        <div>Volumetric Wt: <strong className="calc-label">{ratePreview.volumetric_weight} kg</strong></div>
                        <div>Actual Wt: <strong className="calc-label">{ratePreview.actual_weight} kg</strong></div>
                        <div>Billing Wt: <strong className="text-indigo-400">{ratePreview.billing_weight} kg</strong></div>
                        <div>Applied Rate: <strong className="calc-label">₹{ratePreview.applied_rate_per_kg} / kg</strong></div>
                    </div>

                    <div className="flex items-center justify-between text-base font-extrabold calc-label pt-2 border-t border-slate-700/60">
                        <span>Total Estimated Cost:</span>
                        <span className="text-indigo-400 text-2xl">₹{ratePreview.total_charge}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
