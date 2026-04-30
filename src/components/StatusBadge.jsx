import React from 'react';
import { STATUS_COLORS } from '../utils/orderHelpers';

const StatusBadge = ({ status }) => {
  const config = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  
  const label = status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
