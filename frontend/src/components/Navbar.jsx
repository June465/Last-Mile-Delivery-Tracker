import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar({ onNavigate, activeTab }) {
    const { user, logout } = useAuth();

    if (!user) return null;

    const roleColors = {
        ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
        DELIVERY_AGENT: 'bg-blue-100 text-blue-800 border-blue-300',
        CUSTOMER: 'bg-green-100 text-green-800 border-green-300',
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <Truck className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-gray-900 tracking-tight">LastMile Tracker</span>
                        <span className="hidden sm:inline-block text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded ml-2">Logistics v1.0</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div className="text-sm">
                            <p className="font-medium text-gray-900 leading-none">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleColors[user.role] || 'bg-gray-100'}`}>
                            {user.role}
                        </span>
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
