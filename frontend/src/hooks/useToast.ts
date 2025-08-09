import { useState, useCallback } from 'react';

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

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showOCRSuccess = useCallback((text: string, onViewText: () => void) => {
    return addToast({
      type: 'success',
      title: 'Текст распознан!',
      message: `Найдено ${text.length} символов`,
      actions: [
        {
          label: 'Посмотреть текст',
          onClick: onViewText,
          variant: 'primary'
        }
      ],
      duration: 0 // Не закрывать автоматически
    });
  }, [addToast]);

  const showTranscriptSuccess = useCallback((transcript: string, onViewTranscript: () => void) => {
    return addToast({
      type: 'success',
      title: 'Речь распознана!',
      message: `Найдено ${transcript.split(' ').length} слов`,
      actions: [
        {
          label: 'Посмотреть транскрипт',
          onClick: onViewTranscript,
          variant: 'primary'
        }
      ],
      duration: 0 // Не закрывать автоматически
    });
  }, [addToast]);

  const showError = useCallback((title: string, message: string) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 5000
    });
  }, [addToast]);

  const showInfo = useCallback((title: string, message: string) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: 3000
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showOCRSuccess,
    showTranscriptSuccess,
    showError,
    showInfo
  };
};
