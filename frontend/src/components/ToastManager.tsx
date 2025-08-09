import React, { useState, useCallback } from 'react';
import Toast from './Toast';

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  duration?: number;
}

interface ToastManagerProps {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
}

const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemoveToast}
        />
      ))}
    </div>
  );
};

export default ToastManager;
