import React, { useState, useEffect } from 'react';
import { fetchZonesApi, previewRateApi } from '../api/zoneRateApi';
import { Calculator, ArrowRight, Package, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function RateCalculatorWidget() {
    const [zones, setZones] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loadingZones, setLoadingZones] = useState(true);

    // Form State
    const [pickupAreaId, setPickupAreaId] = useState('');
    const [dropAreaId, setDropAreaId] = useState('');
    const [lengthCm, setLengthCm] = useState(30);
    const [widthCm, setWidthCm] = useState(20);
    const [heightCm, setHeightCm] = useState(15);
    const [actualWeightKg, setActualWeightKg] = useState(2.5);
    const [orderType, setOrderType] = useState('B2C');
    const [paymentType, setPaymentType] = useState('PREPAID');

    // Preview Result
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadZonesAndAreas();
    }, []);

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
            setError('Failed to load zones and areas');
        } finally {
            setLoadingZones(false);
        }
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        if (!pickupAreaId || !dropAreaId) return;
        setCalculating(true);
        setError('');
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
            setResult(res);
        } catch (err) {
            setError(err.message);
        } finally {
            setCalculating(false);
        }
    };

    if (loadingZones) {
        return <div className="p-8 text-center text-gray-500">Loading Rate Calculator...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Calculator className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-xl">Instant Rate Breakdown Estimator</h3>
                    <p className="text-xs text-gray-500">
                        Calculate exact billing weight, zone type, base charge, and COD surcharges before shipping
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Inputs */}
                <form onSubmit={handleCalculate} className="lg:col-span-7 space-y-4">
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

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={lengthCm}
                                onChange={(e) => setLengthCm(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={widthCm}
                                onChange={(e) => setWidthCm(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={heightCm}
                                onChange={(e) => setHeightCm(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Actual Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={actualWeightKg}
                            onChange={(e) => setActualWeightKg(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Order Type</label>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setOrderType('B2C')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${orderType === 'B2C' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    B2C Retail
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderType('B2B')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${orderType === 'B2B' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700'
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
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${paymentType === 'PREPAID' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    Prepaid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentType('COD')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${paymentType === 'COD' ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    Cash on Delivery
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={calculating}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                        <span>{calculating ? 'Calculating Breakdown...' : 'Calculate Shipping Estimate'}</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>

                {/* Calculation Result Display */}
                <div className="lg:col-span-5 bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col justify-between">
                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}

                    {result ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                <span className="text-xs font-bold text-gray-500 uppercase">Route Type</span>
                                <span
                                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${result.is_intra_zone ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                        }`}
                                >
                                    {result.is_intra_zone ? 'Intra-Zone (Same Zone)' : 'Inter-Zone (Cross Zone)'}
                                </span>
                            </div>

                            <div className="text-xs text-gray-600 space-y-1">
                                <p>
                                    <span className="font-semibold">Pickup Zone:</span> {result.pickup_zone_name}
                                </p>
                                <p>
                                    <span className="font-semibold">Drop Zone:</span> {result.drop_zone_name}
                                </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Actual Weight:</span>
                                    <span className="font-mono">{result.actual_weight} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Volumetric Weight:</span>
                                    <span className="font-mono">{result.volumetric_weight} kg</span>
                                </div>
                                <div className="flex justify-between font-bold text-indigo-700 pt-1 border-t border-gray-100">
                                    <span>Billing Weight:</span>
                                    <span className="font-mono">{result.billing_weight} kg</span>
                                </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-600">
                                    <span>Rate per kg ({orderType}):</span>
                                    <span>₹{result.applied_rate_per_kg} / kg</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Base Shipping Fee:</span>
                                    <span>₹{result.base_charge}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>COD Surcharge ({paymentType}):</span>
                                    <span>+ ₹{result.cod_surcharge}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-300 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Estimate</p>
                                    <p className="text-2xl font-black text-gray-900">₹{result.total_charge}</p>
                                </div>
                                <CheckCircle2 className="h-7 w-7 text-green-500" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center my-auto py-12 text-gray-400">
                            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Select areas and weight to preview total cost breakdown</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
