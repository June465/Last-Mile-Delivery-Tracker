import React, { useState } from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Truck, LogOut, User, Bell, Sun, Moon } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { NotificationCenter } from './NotificationCenter';

export function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const getRoleBadgeClass = (role) => {
        if (role === 'ADMIN') return 'role-badge-admin';
        if (role === 'DELIVERY_AGENT') return 'role-badge-agent';
        return 'role-badge-customer';
    };

    return (
        <nav className="navbar-container">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xl navbar-brand-title tracking-tight">LastMile Tracker</span>
                            <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full border border-indigo-200">
                                Enterprise v2.0
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-colors cursor-pointer border navbar-icon-btn flex items-center justify-center gap-2 text-xs font-semibold"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="h-4 w-4 text-amber-400" />
                                    <span className="hidden md:inline navbar-brand-title">Light</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="h-4 w-4 text-indigo-600" />
                                    <span className="hidden md:inline navbar-brand-title">Dark</span>
                                </>
                            )}
                        </button>

                        {user && (
                            <>
                                {/* Notification Bell Button */}
                                <button
                                    onClick={() => setIsNotificationsOpen(true)}
                                    className="relative p-2 rounded-lg transition-colors cursor-pointer navbar-icon-btn flex items-center justify-center"
                                    title="Notifications"
                                >
                                    <Bell className="h-5 w-5 text-indigo-400" />
                                    <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-500 rounded-full animate-ping" />
                                    <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-500 rounded-full" />
                                </button>

                                {/* User Profile Trigger */}
                                <button
                                    onClick={() => setIsProfileOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg navbar-user-badge hover:opacity-90 transition-colors cursor-pointer"
                                >
                                    <User className="h-4 w-4 text-indigo-400" />
                                    <span className="text-sm font-bold">{user.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-extrabold uppercase ${getRoleBadgeClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </button>

                                {/* Logout Button */}
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </nav>
    );
}
