import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import * as hybridService from '../services/hybridService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. If no user, reset state and return
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // 2. Restore from namespaced localStorage first (for speed)
    try {
      const localData = localStorage.getItem(`notifications_${user.uid}`);
      if (localData) {
        setNotifications(JSON.parse(localData));
      }
    } catch (e) {
      console.warn("Failed to load local notifications", e);
    }

    // 3. Setup Realtime Listener from Firestore
    setLoading(true);
    const unsubscribe = hybridService.getNotifications(user.uid, (data) => {
      const sortedData = (data || []).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setNotifications(sortedData);
      setLoading(false);

      // 4. Update namespaced localStorage
      localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(sortedData));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const markAsRead = async (id) => {
    if (!user?.uid) return;
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await hybridService.saveNotifications(user.uid, updated);
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await hybridService.saveNotifications(user.uid, updated);
  };

  const deleteNotification = async (id) => {
    if (!user?.uid) return;
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    await hybridService.saveNotifications(user.uid, updated);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      setNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
