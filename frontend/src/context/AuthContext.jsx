import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function initAuth() {
            if (token) {
                try {
                    const userData = await getMeApi(token);
                    setUser(userData);
                } catch (err) {
                    logout();
                }
            }
            setLoading(false);
        }
        initAuth();
    }, [token]);

    const login = async (email, password) => {
        setError('');
        try {
            const data = await loginApi(email, password);
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
            setUser(data.user);
            return data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (name, email, phone, password) => {
        setError('');
        try {
            await registerApi(name, email, phone, password);
            return await login(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
