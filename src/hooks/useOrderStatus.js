import { useState, useEffect, useCallback } from 'react';
import { mockOrders } from '../data/mockOrders';
import { STEP_CONFIG } from '../utils/orderHelpers';

const STORAGE_KEY = 'krishisaathi_orders';
const API_BASE = ""; // Proxied

export const useOrderStatus = (orderId) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);

  // Sync with localStorage for mocks/simulations
  useEffect(() => {
    const savedOrders = localStorage.getItem(STORAGE_KEY);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOrders));
      setOrders(mockOrders);
    }
  }, []);

  const fetchRealOrder = useCallback(async (id) => {
    try {
      // Try API (Real Life Application)
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        const realOrder = data.order || data;
        
        // Map status history to timeline
        const timeline = (realOrder.statusHistory || []).map(h => ({
          status: h.status,
          title: h.status.charAt(0).toUpperCase() + h.status.slice(1).replace(/_/g, ' '),
          description: h.message || `Order ${h.status.replace(/_/g, ' ')}`,
          timestamp: h.timestamp
        }));

        // Normalize real order to match our tracking UI
        const normalized = {
          ...realOrder,
          id: realOrder.orderId || realOrder._id,
          productName: realOrder.items?.[0]?.name || "Agricultural Supply",
          productImage: realOrder.items?.[0]?.image || "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200",
          status: realOrder.status?.toLowerCase() || 'placed',
          eta: realOrder.expectedDelivery || new Date(new Date(realOrder.createdAt).getTime() + 86400000 * 3).toISOString(),
          timeline: timeline.length > 0 ? timeline : [
            { 
              status: 'placed', 
              title: 'Order Placed', 
              description: 'Successfully placed through KrishiSaathi.', 
              timestamp: realOrder.createdAt || new Date().toISOString() 
            }
          ]
        };
        setOrder(normalized);
      } else {
        // Fallback to local/mock if API fails
        const localMatch = orders.find(o => o.id === id || o._id === id || o.orderId === id);
        if (localMatch) {
          setOrder(localMatch);
        } else {
          setOrder(null);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch real order:", err);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [orders]);

  useEffect(() => {
    if (orderId) {
      fetchRealOrder(orderId);
    } else {
      setIsLoading(false);
    }
  }, [orderId, fetchRealOrder]);

  return { order, isLoading, allOrders: orders };
};
