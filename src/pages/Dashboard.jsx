import React from 'react';
import { useOrderStatus } from '../hooks/useOrderStatus';
import OrderCard from '../components/OrderCard';
import { Package, LayoutDashboard, Plus, Bell, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { allOrders, isLoading } = useOrderStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agri-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-gray-900 tracking-tight font-hind"
            >
              Marketplace Dashboard
            </motion.h1>
            <p className="text-sm text-gray-400 font-bold tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-agri-green rounded-full" />
              Live Inventory & Order Management
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 hover:text-agri-green transition-all">
                <Bell size={20} />
             </button>
             <button className="bg-agri-green text-white px-6 py-3 rounded-2xl shadow-xl shadow-agri-green/20 hover:bg-agri-green-dark transition-all flex items-center gap-2 font-black uppercase text-xs tracking-widest">
                <Plus size={18} /> New Product
             </button>
          </div>
        </div>

        {/* Stats Grid - High Fidelity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Orders', value: allOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: allOrders.filter(o => o.status === 'delivered').length, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Harvest', value: '12.5 kg', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg Rating', value: '4.9', icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 flex items-center gap-5 group hover:border-agri-green/20 transition-all"
            >
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-50 shadow-sm">
           <div className="flex-1 flex items-center gap-3 px-3">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Search orders, products or IDs..." className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-600 placeholder:text-gray-300" />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all">
              <Filter size={16} /> Filters
           </button>
        </div>

        {/* Orders Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 font-hind">Recent Sales</h2>
            <button className="text-xs font-black text-agri-green uppercase tracking-widest hover:underline">View All History</button>
          </div>

          {allOrders.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Package size={40} />
              </div>
              <p className="text-gray-900 font-bold text-lg">No harvest orders yet</p>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">When you sell produce on the marketplace, your orders will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
              {allOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <OrderCard order={order} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
