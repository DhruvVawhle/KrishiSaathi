import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Package, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import OrderStepper from './OrderStepper';
import { formatDateTime, formatDate, getTimeOnly } from '../utils/orderHelpers';

const OrderTracker = ({ order }) => {
  const navigate = useNavigate();
  if (!order) return null;

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  
  // Find courier details if any
  const courierInfo = order.statusHistory?.find(h => h.message?.toLowerCase().includes('tracking')) || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* 1. Header */}
      <div className="flex items-center gap-4 py-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-white bg-gray-50 border border-gray-100 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Order Tracking</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border">ID: {order.orderId || order.id}</span>
            <span className="text-[11px] text-gray-400 font-medium">• {order.productName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Stepper and Delivery Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Status & Stepper Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            {/* Status Hero */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-10 border-b border-gray-50">
              <div className="space-y-2">
                <StatusBadge status={order.status} />
                <h2 className="text-3xl font-black text-gray-900 leading-tight">
                  {isDelivered ? "Order Delivered" : 
                   order.status === 'out_for_delivery' ? "Out for Delivery" :
                   order.status === 'shipped' ? "In Transit" : 
                   order.status === 'cancelled' ? "Order Cancelled" : "Order is being prepared"}
                </h2>
                <div className="flex items-center gap-2 text-agri-green font-bold text-sm">
                  <Clock size={16} />
                  <span>
                    {isDelivered 
                      ? `Delivered on ${formatDate(order.timeline[order.timeline.length-1]?.timestamp)}` 
                      : isCancelled 
                        ? "Cancelled" 
                        : `Estimated by ${formatDate(order.eta)}`}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <img src={order.productImage} className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white" alt="" />
              </div>
            </div>

            <OrderStepper status={order.status} timeline={order.timeline} />
          </div>

          {/* Delivery Details Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Shipping Address
              </h3>
              <div className="text-sm text-gray-800 leading-relaxed font-medium">
                <p className="font-bold text-gray-900">{order.customer?.name || order.buyerName || 'Valued Customer'}</p>
                <p className="whitespace-pre-wrap">{order.customer?.address || order.deliveryAddress?.fullAddress || 'Address details in order history'}</p>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-8">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Package size={14} /> Order Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Payment Method</p>
                  <p className="text-sm font-bold text-gray-800">
                    {(order.paymentMethod || 'COD').toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase">Total Amount</p>
                  <p className="text-sm font-bold text-agri-green">₹{(order.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden relative">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Live Updates</h3>
                <span className="text-[10px] bg-green-50 text-agri-green px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
             </div>

             <div className="space-y-0 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-50" />
                
                <div className="space-y-8">
                  {[...order.timeline].reverse().map((event, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 relative"
                    >
                      <div className={`w-4 h-4 rounded-full mt-1 shrink-0 z-10 shadow-sm border-2 border-white
                        ${idx === 0 ? 'bg-agri-green scale-125' : 'bg-gray-200'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-tight ${idx === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                            {event.title}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                            {getTimeOnly(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-agri-green to-agri-green-dark rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
            <ShieldCheck size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <h4 className="font-black text-lg mb-2">KrishiSaathi Secure</h4>
              <p className="text-xs opacity-90 leading-relaxed mb-4">
                Your payment and product quality are protected by our platform guarantee.
              </p>
              <button className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
