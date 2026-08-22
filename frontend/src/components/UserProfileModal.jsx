import React, { useState } from 'react';
import './UserProfileModal.css';
import { useAuth } from '../context/AuthContext';
import { X, User, Mail, Phone, Lock, CheckCircle } from 'lucide-react';

export function UserProfileModal({ isOpen, onClose }) {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');
        setError('');

        try {
            const payload = {};
            if (name !== user.name) payload.name = name;
            if (phone !== user.phone) payload.phone = phone;
            if (password) payload.password = password;

            await updateUser(payload);
            setMessage('Profile updated successfully!');
            setPassword('');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal-card animate-fade-in">
                <div className="profile-modal-header">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-bold profile-label">User Profile</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {message && (
                        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm p-3 rounded-lg font-medium">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-950/40 border border-red-500/40 text-red-300 text-sm p-3 rounded-lg font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1">Role</label>
                        <span className="profile-role-badge">
                            {user.role}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold profile-label mb-1">Email Address</label>
                        <div className="profile-email-box">
                            <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                            <span>{user.email}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold profile-label mb-1">Full Name</label>
                        <div className="relative">
                            <User className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-3" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm profile-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold profile-label mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-3" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm profile-input"
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold profile-label mb-1">New Password (optional)</label>
                        <div className="relative">
                            <Lock className="h-4 w-4 text-[var(--text-muted)] absolute left-3 top-3" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm profile-input"
                                placeholder="Leave blank to keep unchanged"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors cursor-pointer border border-[var(--border)]"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
