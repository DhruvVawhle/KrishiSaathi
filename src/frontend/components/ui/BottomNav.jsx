import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home, 
  Store, 
  ShoppingBag, 
  User, 
  PlusCircle,
  LayoutDashboard
} from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const isFarmer = localStorage.getItem('userRole') === 'farmer';

  const navItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/' },
    { icon: <Store size={20} />, label: 'Market', path: '/marketplace' },
    { 
      icon: isFarmer ? <LayoutDashboard size={20} /> : <ShoppingBag size={20} />, 
      label: isFarmer ? 'Panel' : 'Orders', 
      path: isFarmer ? '/farmer-dashboard' : '/order-history' 
    },
    { icon: <User size={20} />, label: 'Profile', path: '/buyer-profile' },
  ];

  // Only show on mobile
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#FDFAF4] border-t border-[#EDD9B0] px-4 py-2 sm:hidden z-50 flex justify-around items-center h-16 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 min-w-[64px] relative"
          >
            <motion.div
              animate={{ 
                scale: isActive ? 1.1 : 1,
                color: isActive ? '#2D4F1E' : '#7A7A7A'
              }}
              className="flex flex-col items-center"
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#2D4F1E]/10' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#2D4F1E]' : 'text-[#7A7A7A]'}`}>
                {item.label}
              </span>
            </motion.div>
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-2 w-8 h-1 bg-[#2D4F1E] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
