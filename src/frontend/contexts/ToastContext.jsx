import React, { createContext, useContext, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const colorMap = {
      success: 'green',
      error: 'red',
      warning: 'orange',
      info: 'blue',
    };

    return notifications.show({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message,
      color: colorMap[type] || 'blue',
      autoClose: duration,
      icon: iconMap[type] || 'ℹ️',
    });
  }, []);

  // Consistency with previous API
  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    show: showToast,
    loading: (message) => notifications.show({
      title: 'Loading',
      message,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    }),
    // Add update support for loading toasts
    update: (id, options) => {
      const { render, type, isLoading, autoClose, ...rest } = options;
      const colorMap = { success: 'green', error: 'red', warning: 'orange', info: 'blue' };
      return notifications.update({
        id,
        message: render || rest.message,
        color: colorMap[type] || 'blue',
        loading: isLoading ?? false,
        autoClose: autoClose ?? 3000,
        withCloseButton: true,
        ...rest
      });
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
