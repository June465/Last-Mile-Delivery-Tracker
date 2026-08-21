import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, Shield, UserCheck, User } from 'lucide-react';

export function LoginPage({ onSwitchToRegister }) {
    const { login, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            // Handled by context
        } finally {
            setSubmitting(false);
        }
    };

    const handleDemoLogin = async (demoEmail, demoPassword) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setSubmitting(true);
        try {
            await login(demoEmail, demoPassword);
        } catch (err) {
            // Handled
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex p-3 bg-indigo-600 rounded-xl text-white mb-3">
                    <Truck className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">LastMile Delivery Tracker</h2>
                <p className="mt-2 text-sm text-gray-600">Sign in to manage orders, track deliveries, or operate zones</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have a customer account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                className="font-semibold text-indigo-600 hover:text-indigo-500"
                            >
                                Register Here
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
                            Fast 1-Click Demo Login
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin@delivery.com', 'admin123')}
                                className="flex flex-col items-center p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-purple-800 transition-colors"
                            >
                                <Shield className="h-4 w-4 mb-1" />
                                <span className="text-xs font-medium">Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('agent1@delivery.com', 'agent123')}
                                className="flex flex-col items-center p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-800 transition-colors"
                            >
                                <UserCheck className="h-4 w-4 mb-1" />
                                <span className="text-xs font-medium">Agent</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('customer@delivery.com', 'customer123')}
                                className="flex flex-col items-center p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-800 transition-colors"
                            >
                                <User className="h-4 w-4 mb-1" />
                                <span className="text-xs font-medium">Customer</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
