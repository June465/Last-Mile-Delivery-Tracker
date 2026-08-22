import React, { useState, useEffect } from 'react';
import './RateCardManagement.css';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Save, ShieldCheck } from 'lucide-react';
import { fetchRateCardApi, updateRateCardApi } from '../api/zoneRateApi';

export function RateCardManagement() {
    const { token } = useAuth();
    const [rateCard, setRateCard] = useState(null);
    const [b2bIntra, setB2bIntra] = useState('');
    const [b2bInter, setB2bInter] = useState('');
    const [b2cIntra, setB2cIntra] = useState('');
    const [b2cInter, setB2cInter] = useState('');
    const [b2bCod, setB2bCod] = useState('');
    const [b2cCod, setB2cCod] = useState('');
    const [volumetricFactor, setVolumetricFactor] = useState('5000');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadRateCard();
    }, []);

    const loadRateCard = async () => {
        try {
            const data = await fetchRateCardApi();
            if (data) {
                setRateCard(data);
                setB2bIntra(data.b2b_intra_rate.toString());
                setB2bInter(data.b2b_inter_rate.toString());
                setB2cIntra(data.b2c_intra_rate.toString());
                setB2cInter(data.b2c_inter_rate.toString());
                setB2bCod(data.b2b_cod_surcharge.toString());
                setB2cCod(data.b2c_cod_surcharge.toString());
                setVolumetricFactor(data.volumetric_factor ? data.volumetric_factor.toString() : '5000');
            }
        } catch (err) {
            console.error('Failed to load rate card:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        setError('');
        try {
            await updateRateCardApi(token, {
                name: 'Enterprise Dynamic Rate Matrix',
                b2b_intra_rate: parseFloat(b2bIntra),
                b2b_inter_rate: parseFloat(b2bInter),
                b2c_intra_rate: parseFloat(b2cIntra),
                b2c_inter_rate: parseFloat(b2cInter),
                b2b_cod_surcharge: parseFloat(b2bCod),
                b2c_cod_surcharge: parseFloat(b2cCod),
                volumetric_factor: parseFloat(volumetricFactor)
            });
            setMessage('Rate Card Matrix updated successfully!');
            loadRateCard();
        } catch (err) {
            setError(err.message || 'Failed to update rate card');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rate-card-container space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold rate-label tracking-tight flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                    Commercial Rate Card Matrix
                </h2>
                <p className="text-sm font-semibold rate-subheading">Configure per-kg intra/inter zone pricing, COD surcharges, and volumetric divisor</p>
            </div>

            {message && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm p-3 rounded-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {message}
                </div>
            )}
            {error && (
                <div className="bg-red-950/40 border border-red-500/40 text-red-300 text-sm p-3 rounded-lg font-bold">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rate-card-box">
                        <div className="rate-card-box-header">
                            <span>B2B Commercial Rate Matrix</span>
                            <span className="text-xs bg-purple-950/60 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-extrabold">B2B Tier</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">Intra-Zone Rate (₹ / kg)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2bIntra}
                                    onChange={(e) => setB2bIntra(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">Inter-Zone Rate (₹ / kg)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2bInter}
                                    onChange={(e) => setB2bInter(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">COD Fixed Surcharge (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2bCod}
                                    onChange={(e) => setB2bCod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rate-card-box">
                        <div className="rate-card-box-header">
                            <span>B2C Retail Rate Matrix</span>
                            <span className="text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-extrabold">B2C Tier</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">Intra-Zone Rate (₹ / kg)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2cIntra}
                                    onChange={(e) => setB2cIntra(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">Inter-Zone Rate (₹ / kg)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2cInter}
                                    onChange={(e) => setB2cInter(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold rate-label mb-1">COD Fixed Surcharge (₹)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={b2cCod}
                                    onChange={(e) => setB2cCod(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm rate-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rate-info-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-bold rate-label">Volumetric Weight Divisor Factor</h4>
                        <p className="text-xs rate-subheading font-medium">Standard formula: (Length × Breadth × Height) / Divisor</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            required
                            step="1"
                            value={volumetricFactor}
                            onChange={(e) => setVolumetricFactor(e.target.value)}
                            className="w-32 px-3 py-2 border rounded-lg text-sm rate-input font-bold"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md"
                    >
                        <Save className="h-4 w-4" />
                        {submitting ? 'Saving Matrix...' : 'Save Rate Card Matrix'}
                    </button>
                </div>
            </form>
        </div>
    );
}
