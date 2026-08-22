import React, { useState } from 'react';
import './LoginPage.css';
import { useAuth } from '../context/AuthContext';
import { Truck, Shield, UserCheck, User } from 'lucide-react';

export function LoginPage({ onSwitchToRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDemoLogin = async (demoEmail, demoPassword) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setError(null);
        setSubmitting(true);
        try {
            await login(demoEmail, demoPassword);
        } catch (err) {
            setError(err.message || 'Demo login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page-container flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex p-3 bg-indigo-600 rounded-xl text-white mb-3 shadow-md">
                    <Truck className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight login-heading">LastMile Delivery Tracker</h2>
                <p className="mt-2 text-sm font-semibold login-subheading">Sign in to manage orders, track deliveries, or operate zones</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="login-card py-8 px-4 sm:rounded-xl sm:px-10 border">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-bold mb-1 login-heading">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg shadow-sm text-sm login-input"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 login-heading">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg shadow-sm text-sm login-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm font-semibold login-subheading">
                            Don't have a customer account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                className="font-bold text-indigo-500 hover:text-indigo-400"
                            >
                                Register Here
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 border-t border-gray-200/20 pt-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-center mb-3 login-subheading">
                            Fast 1-Click Demo Login
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin@delivery.com', 'admin123')}
                                className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer demo-login-btn-admin font-bold"
                            >
                                <Shield className="h-4 w-4 mb-1" />
                                <span className="text-xs">Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('agent1@delivery.com', 'agent123')}
                                className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer demo-login-btn-agent font-bold"
                            >
                                <UserCheck className="h-4 w-4 mb-1" />
                                <span className="text-xs">Agent</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('customer@delivery.com', 'customer123')}
                                className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer demo-login-btn-customer font-bold"
                            >
                                <User className="h-4 w-4 mb-1" />
                                <span className="text-xs">Customer</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
