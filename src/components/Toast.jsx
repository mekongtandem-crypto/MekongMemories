/**
 * Toast.jsx v2.10 - Notifications toast temporaires
 * ✅ Affichage toast en bas de l'écran
 * ✅ Auto-disparition après délai
 * ✅ Variants: success, error, info
 */
import React, { useEffect } from 'react';
import { Check, X, Info } from 'lucide-react';

export default function Toast({ message, variant = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-green-600 dark:bg-green-700',
      icon: Check,
      iconBg: 'bg-green-700 dark:bg-green-800'
    },
    error: {
      bg: 'bg-red-600 dark:bg-red-700',
      icon: X,
      iconBg: 'bg-red-700 dark:bg-red-800'
    },
    info: {
      bg: 'bg-blue-600 dark:bg-blue-700',
      icon: Info,
      iconBg: 'bg-blue-700 dark:bg-blue-800'
    }
  };

  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className={`${config.bg} text-white rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3 max-w-md`}>
        <div className={`${config.iconBg} rounded-full p-1 flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
