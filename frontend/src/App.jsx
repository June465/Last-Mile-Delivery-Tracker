import React, { useState, useEffect } from 'react';
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
import { Shield, UserCheck, User, Truck, MapPin, DollarSign, Calculator, LayoutDashboard, Package, Plus } from 'lucide-react';

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
          <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
          <p className="text-sm text-gray-500">
            Authenticated as <strong className="text-gray-800">{user.name}</strong> ({user.role})
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Navigation Sub-Header Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto space-x-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Package className="h-4 w-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        {user.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('zones')}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'zones'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Zone Management</span>
            </button>

            <button
              onClick={() => setActiveTab('ratecard')}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ratecard'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Rate Card Config</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'calculator'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Rate Calculator</span>
        </button>
      </div>

      {/* Tab Content rendering */}
      {activeTab === 'orders' && (
        <OrderList orders={orders} loading={loadingOrders} onRefresh={loadOrders} />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                {user.role === 'ADMIN' && <Shield className="h-8 w-8 text-purple-600" />}
                {user.role === 'DELIVERY_AGENT' && <UserCheck className="h-8 w-8 text-blue-600" />}
                {user.role === 'CUSTOMER' && <User className="h-8 w-8 text-green-600" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Welcome, {user.name}!</h2>
                <p className="text-sm text-gray-500">
                  Role: <span className="font-semibold text-gray-800">{user.role}</span> | Email: {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-2">Total Active Orders</h3>
              <p className="text-3xl font-black text-indigo-600">{orders.length}</p>
              <button
                onClick={() => setActiveTab('orders')}
                className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                View All Orders →
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-2">Zone & Area Rules</h3>
              <p className="text-sm text-gray-600 mb-4">Delivery pincode mapping across zones.</p>
              {user.role === 'ADMIN' ? (
                <button
                  onClick={() => setActiveTab('zones')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Manage Zones →
                </button>
              ) : (
                <span className="text-xs text-gray-400">Admin Only</span>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-2">Shipping Cost Estimator</h3>
              <p className="text-sm text-gray-600 mb-4">Dynamic rate breakdown calculator.</p>
              <button
                onClick={() => setActiveTab('calculator')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
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

      <OrderCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={loadOrders}
      />
    </div>
  );
}

function MainContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    if (view === 'register') {
      return <RegisterPage onSwitchToLogin={() => setView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setView('register')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
