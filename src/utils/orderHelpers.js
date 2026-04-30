import { 
  ShoppingCart, 
  ClipboardCheck, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Store,
  MapPin,
  Box
} from 'lucide-react';

export const STEP_CONFIG = [
  { 
    key: "placed",           
    label: "Order Placed",      
    icon: ShoppingCart,
    description: "Your order has been successfully placed and is being processed."
  },
  { 
    key: "processing",        
    label: "Processing",        
    icon: ClipboardCheck,
    description: "The seller has accepted your order and is preparing the items."
  },
  { 
    key: "packed",          
    label: "Packed",          
    icon: Box,
    description: "Your items have been packed and are ready for shipment."
  },
  { 
    key: "shipped",          
    label: "Shipped",          
    icon: Package,
    description: "Your package has been handed over to our courier partner."
  },
  { 
    key: "out_for_delivery", 
    label: "Out for Delivery", 
    icon: Truck,
    description: "Our delivery executive is on the way to your doorstep."
  },
  { 
    key: "delivered",        
    label: "Delivered",        
    icon: CheckCircle,
    description: "Package delivered! We hope you enjoy your farm-fresh produce."
  },
];

export const getStepIndex = (status) => {
  const s = status?.toLowerCase();
  
  if (s === 'placed' || s === 'pending') return 0;
  if (s === 'processing' || s === 'confirmed' || s === 'received') return 1;
  if (s === 'packed' || s === 'preparing') return 2;
  if (s === 'shipped' || s === 'dispatched') return 3;
  if (s === 'out_for_delivery') return 4;
  if (s === 'delivered' || s === 'completed') return 5;
  
  const index = STEP_CONFIG.findIndex(step => step.key === s);
  if (index !== -1) return index;
  
  if (s === 'cancelled') return -1; 
  if (s === 'returned') return -1;
  return 0;
};

export const STATUS_COLORS = {
  placed:           { bg: 'bg-blue-100',   text: 'text-blue-700',   accent: 'bg-blue-600' },
  confirmed:        { bg: 'bg-indigo-100', text: 'text-indigo-700', accent: 'bg-indigo-600' },
  shipped:          { bg: 'bg-amber-100',  text: 'text-amber-700',  accent: 'bg-amber-600' },
  out_for_delivery: { bg: 'bg-teal-100',   text: 'text-teal-700',   accent: 'bg-teal-600' },
  delivered:        { bg: 'bg-green-100',  text: 'text-green-700',  accent: 'bg-green-600' },
  cancelled:        { bg: 'bg-red-100',    text: 'text-red-700',    accent: 'bg-red-600' },
  returned:         { bg: 'bg-gray-100',   text: 'text-gray-600',   accent: 'bg-gray-600' },
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
