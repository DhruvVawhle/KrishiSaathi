import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { STEP_CONFIG, getStepIndex, formatDateTime } from '../utils/orderHelpers';

const OrderStepper = ({ status, timeline = [] }) => {
  const currentIndex = getStepIndex(status);
  const isCancelled = status === 'cancelled';
  const isReturned = status === 'returned';
  
  const getTimestamp = (key) => {
    const event = timeline.find(e => e.status === key);
    return event ? formatDateTime(event.timestamp) : null;
  };

  return (
    <div className="w-full py-4">
      {/* Desktop Stepper (Horizontal) */}
      <div className="hidden md:block relative px-10">
        {/* Progress Line Container */}
        <div className="absolute top-5 left-10 right-10 h-1.5 bg-gray-100 rounded-full -z-10 overflow-hidden">
          {/* Active Progress Line with Animation */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ 
              width: isCancelled || isReturned 
                ? '0%' 
                : `${(currentIndex / (STEP_CONFIG.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="h-full bg-agri-green shadow-[0_0_10px_rgba(46,125,50,0.4)]"
          />
        </div>

        <div className="flex justify-between">
          {STEP_CONFIG.map((step, index) => {
            const isCompleted = !isCancelled && !isReturned && index < currentIndex;
            const isActive = !isCancelled && !isReturned && index === currentIndex;
            const isPending = !isCompleted && !isActive;
            const isDelivered = status === 'delivered';
            const timestamp = getTimestamp(step.key);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center relative" style={{ width: '100px' }}>
                {/* Circle Component */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isActive ? 1.2 : 1,
                    backgroundColor: (isCompleted || isActive) ? '#2E7D32' : '#FFFFFF',
                    borderColor: (isCompleted || isActive) ? '#2E7D32' : '#E5E7EB',
                    color: (isCompleted || isActive) ? '#FFFFFF' : '#9CA3AF'
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 z-10 shadow-sm transition-all duration-500
                    ${isActive ? 'ring-4 ring-green-100 shadow-agri-green/20' : ''}
                  `}
                >
                  {(isCompleted || (isActive && isDelivered)) ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check size={20} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                  )}
                </motion.div>
                
                {/* Label */}
                <div className="mt-4 text-center">
                  <p className={`text-[13px] font-black tracking-tight transition-colors duration-300
                    ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </p>
                  {timestamp && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-gray-400 mt-1 font-medium"
                    >
                      {timestamp.split(',')[0]}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper (Vertical) - Compact & Dynamic */}
      <div className="md:hidden flex flex-col space-y-6 relative ml-2">
        {/* Vertical Line Container */}
        <div className="absolute left-[19px] top-4 bottom-4 w-1.5 bg-gray-100 rounded-full -z-10 overflow-hidden">
          {/* Active Vertical Line */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ 
              height: isCancelled || isReturned 
                ? '0%' 
                : `${(currentIndex / (STEP_CONFIG.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="w-full bg-agri-green shadow-[0_0_8px_rgba(46,125,50,0.3)]"
          />
        </div>
        
        {STEP_CONFIG.map((step, index) => {
          const isCompleted = !isCancelled && !isReturned && index < currentIndex;
          const isActive = !isCancelled && !isReturned && index === currentIndex;
          const isPending = !isCompleted && !isActive;
          const isDelivered = status === 'delivered';
          const timestamp = getTimestamp(step.key);
          const Icon = step.icon;

          return (
            <motion.div 
              key={step.key} 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 shrink-0 transition-all duration-500
                  ${(isCompleted || isActive) ? 'bg-agri-green border-agri-green text-white shadow-md' : 'bg-white border-gray-200 text-gray-300'}
                  ${isActive ? 'ring-4 ring-green-100' : ''}
                `}
              >
                {(isCompleted || (isActive && isDelivered)) ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              
              <div className="ml-4">
                <p className={`text-sm font-black tracking-tight ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {timestamp && (
                  <p className="text-[11px] text-gray-500 font-medium">
                    {timestamp}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStepper;
