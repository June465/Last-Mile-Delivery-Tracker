import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchRateCardApi, updateRateCardApi } from '../api/zoneRateApi';
import { DollarSign, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export function RateCardManagement() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [cardName, setCardName] = useState('');
    const [b2bIntra, setB2bIntra] = useState(50);
    const [b2bInter, setB2bInter] = useState(100);
    const [b2cIntra, setB2cIntra] = useState(40);
    const [b2cInter, setB2cInter] = useState(80);
    const [b2bCod, setB2bCod] = useState(30);
    const [b2cCod, setB2cCod] = useState(20);
    const [volFactor, setVolFactor] = useState(5000);

    useEffect(() => {
        loadRateCard();
    }, []);

    const loadRateCard = async () => {
        try {
            setLoading(true);
            const card = await fetchRateCardApi();
            setCardName(card.name);
            setB2bIntra(card.b2b_intra_rate);
            setB2bInter(card.b2b_inter_rate);
            setB2cIntra(card.b2c_intra_rate);
            setB2cInter(card.b2c_inter_rate);
            setB2bCod(card.b2b_cod_surcharge);
            setB2cCod(card.b2c_cod_surcharge);
            setVolFactor(card.volumetric_factor);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        setError('');
        try {
            await updateRateCardApi(token, {
                name: cardName,
                b2b_intra_rate: Number(b2bIntra),
                b2b_inter_rate: Number(b2bInter),
                b2c_intra_rate: Number(b2cIntra),
                b2c_inter_rate: Number(b2cInter),
                b2b_cod_surcharge: Number(b2bCod),
                b2c_cod_surcharge: Number(b2cCod),
                volumetric_factor: Number(volFactor),
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Rate Card...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl">Dynamic Rate Card Engine</h3>
                        <p className="text-xs text-gray-500">Configure base rates per kg, volumetric factor, and COD surcharges</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={loadRateCard}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    title="Reload Rate Card"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Rate Card configuration saved successfully!</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Rate Card Name</label>
                    <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* B2B Section */}
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4">
                        <h4 className="font-bold text-purple-900 text-sm uppercase tracking-wider">B2B Shipping Rates (₹ / kg)</h4>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Same Zone (Intra-Zone)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2bIntra}
                                onChange={(e) => setB2bIntra(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cross Zone (Inter-Zone)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2bInter}
                                onChange={(e) => setB2bInter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">B2B COD Surcharge (₹)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2bCod}
                                onChange={(e) => setB2bCod(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                    </div>

                    {/* B2C Section */}
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                        <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wider">B2C Shipping Rates (₹ / kg)</h4>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Same Zone (Intra-Zone)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2cIntra}
                                onChange={(e) => setB2cIntra(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cross Zone (Inter-Zone)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2cInter}
                                onChange={(e) => setB2cInter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">B2C COD Surcharge (₹)</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={b2cCod}
                                onChange={(e) => setB2cCod(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Volumetric Divisor Factor</label>
                    <input
                        type="number"
                        required
                        value={volFactor}
                        onChange={(e) => setVolFactor(e.target.value)}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Standard industry default is 5000. Formula: (L × W × H) / Factor.</p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Rate Card Settings'}</span>
                </button>
            </form>
        </div>
    );
}
