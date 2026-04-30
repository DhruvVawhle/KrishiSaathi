import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderStatus } from '../hooks/useOrderStatus';
import OrderTracker from '../components/OrderTracker';
import { CircleAlert, ArrowLeft, CircleX } from 'lucide-react';

const TrackOrder = () => {
  const { orderId } = useParams();
  const { order, isLoading } = useOrderStatus(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-agri-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium animate-pulse">Fetching tracking status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <CircleX size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900">Order Not Found</h2>
            <p className="text-gray-500 text-sm">We couldn't find an order with that tracking ID.</p>
          </div>
          <Link to="/order-history" className="block w-full py-3 bg-agri-green text-white rounded-xl font-bold hover:bg-agri-green-dark transition-colors">
            Go to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] px-4 py-8 sm:px-6 lg:px-8">
      <OrderTracker order={order} />
    </div>
  );
};

export default TrackOrder;
