import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ZoneManagement } from './components/ZoneManagement';
import { RateCardManagement } from './components/RateCardManagement';
import { RateCalculatorWidget } from './components/RateCalculatorWidget';
import { OrderCreationModal } from './components/OrderCreationModal';
import { OrderList } from './components/OrderList';
import { fetchOrdersApi } from './api/ordersApi';
import { Shield, UserCheck, User, MapPin, DollarSign, Calculator, LayoutDashboard, Package, Plus } from 'lucide-react';

import { ThemeProvider } from './context/ThemeContext';

function Dashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await fetchOrdersApi(token);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dashboard-heading">Delivery Dashboard</h1>
          <p className="text-sm dashboard-subheading">
            Authenticated as <strong className="dashboard-heading">{user.name}</strong> ({user.role})
          </p>
        </div>

        {/* Create New Order is ONLY available for CUSTOMER role */}
        {user.role === 'CUSTOMER' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Order</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Header Tabs */}
      <div className="flex border-b border-slate-700/60 mb-8 overflow-x-auto space-x-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'orders'
            ? 'dashboard-tab-active'
            : 'dashboard-tab-inactive'
            }`}
        >
          <Package className="h-4 w-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'dashboard'
            ? 'dashboard-tab-active'
            : 'dashboard-tab-inactive'
            }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        {user.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('zones')}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'zones'
                ? 'dashboard-tab-active'
                : 'dashboard-tab-inactive'
                }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Zone Management</span>
            </button>

            <button
              onClick={() => setActiveTab('ratecard')}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ratecard'
                ? 'dashboard-tab-active'
                : 'dashboard-tab-inactive'
                }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Rate Card Config</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'calculator'
            ? 'dashboard-tab-active'
            : 'dashboard-tab-inactive'
            }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Rate Calculator</span>
        </button>
      </div>

      {/* Tab Content rendering */}
      {activeTab === 'orders' && (
        <OrderList orders={orders} userRole={user.role} user={user} loading={loadingOrders} onRefresh={loadOrders} />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="dashboard-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 rounded-xl">
                {user.role === 'ADMIN' && <Shield className="h-8 w-8 text-purple-400" />}
                {user.role === 'DELIVERY_AGENT' && <UserCheck className="h-8 w-8 text-blue-400" />}
                {user.role === 'CUSTOMER' && <User className="h-8 w-8 text-emerald-400" />}
              </div>
              <div>
                <h2 className="text-xl font-bold dashboard-card-title">Welcome, {user.name}!</h2>
                <p className="text-sm dashboard-card-text">
                  Role: <span className="font-semibold dashboard-card-title">{user.role}</span> | Email: {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="dashboard-card p-6">
              <h3 className="font-semibold dashboard-card-title mb-2">Total Active Orders</h3>
              <p className="text-3xl font-black text-indigo-400">{orders.length}</p>
              <button
                onClick={() => setActiveTab('orders')}
                className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                View All Orders →
              </button>
            </div>

            <div className="dashboard-card p-6">
              <h3 className="font-semibold dashboard-card-title mb-2">Zone & Area Rules</h3>
              <p className="text-sm dashboard-card-text mb-4">Delivery pincode mapping across zones.</p>
              {user.role === 'ADMIN' ? (
                <button
                  onClick={() => setActiveTab('zones')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Manage Zones →
                </button>
              ) : (
                <span className="text-xs text-slate-500">Admin Only</span>
              )}
            </div>

            <div className="dashboard-card p-6">
              <h3 className="font-semibold dashboard-card-title mb-2">Shipping Cost Estimator</h3>
              <p className="text-sm dashboard-card-text mb-4">Dynamic rate breakdown calculator.</p>
              <button
                onClick={() => setActiveTab('calculator')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                Estimate Shipping Cost →
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'zones' && user.role === 'ADMIN' && <ZoneManagement />}
      {activeTab === 'ratecard' && user.role === 'ADMIN' && <RateCardManagement />}
      {activeTab === 'calculator' && <RateCalculatorWidget />}

      {user.role === 'CUSTOMER' && (
        <OrderCreationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
}

function MainContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-container">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    if (view === 'register') {
      return (
        <div className="min-h-screen flex flex-col app-container">
          <Navbar />
          <RegisterPage onSwitchToLogin={() => setView('login')} />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col app-container">
        <Navbar />
        <LoginPage onSwitchToRegister={() => setView('register')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-container">
      <Navbar />
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
