import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ allowedRoles, children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return children; // Handled by App routing to show Login
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-700 rounded-lg max-w-md mx-auto mt-12 border border-red-200">
                <h3 className="font-bold text-lg mb-2">Access Restricted</h3>
                <p className="text-sm">Your role ({user.role}) is not authorized to access this area.</p>
            </div>
        );
    }

    return children;
}
