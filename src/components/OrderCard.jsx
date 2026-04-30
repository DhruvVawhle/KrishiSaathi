import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Package, Calendar, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { STEP_CONFIG, getStepIndex, formatDate } from '../utils/orderHelpers';

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const currentIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 p-6 overflow-hidden group"
    >
      <div className="flex flex-col gap-6">
        {/* Top: Product & Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={order.productImage} 
                alt={order.productName} 
                className="w-16 h-16 rounded-2xl object-cover bg-gray-50 border border-gray-100 shadow-sm"
              />
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-gray-50">
                 <div className={`w-3 h-3 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-agri-green animate-pulse'}`} />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-tight group-hover:text-agri-green transition-colors">{order.productName}</h3>
              <p className="text-[11px] text-gray-400 font-bold tracking-widest mt-1 uppercase">ID: {order.id}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Middle: Progress Visualization (Amazon Style Line) */}
        <div className="space-y-3">
           <div className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <span>Ordered</span>
              <span>Delivered</span>
           </div>
           <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentIndex / (STEP_CONFIG.length - 1)) * 100}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className={`h-full ${isCancelled ? 'bg-red-400' : 'bg-agri-green shadow-[0_0_8px_rgba(46,125,50,0.4)]'}`}
              />
           </div>
        </div>

        {/* Bottom: Date & Action */}
        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <Calendar size={14} className="text-gray-400" />
                 <span className="text-[11px] font-bold text-gray-600">{formatDate(order.eta)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <Clock size={14} className="text-gray-400" />
                 <span className="text-[11px] font-bold text-agri-green">{order.status === 'delivered' ? 'Completed' : 'On Track'}</span>
              </div>
           </div>
           
           <button 
             onClick={() => navigate(`/track/${order.id}`)}
             className="px-4 py-2.5 bg-gray-900 hover:bg-agri-green text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-gray-200 hover:shadow-agri-green/20 flex items-center gap-2 group/btn"
           >
             Track <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;
