import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100',
    error: 'bg-red-50 text-red-800 border-red-200 shadow-red-100',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-indigo-100'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
  };

  return (
    <div className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${styles[type]} animate-slide-down min-w-[320px] max-w-[90vw]`}>
      {icons[type]}
      <span className="font-medium text-sm flex-1">{message}</span>
      <button 
        onClick={onClose} 
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
};