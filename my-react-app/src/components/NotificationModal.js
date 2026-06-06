import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle, InfoIcon } from 'lucide-react';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  onConfirm,
  showConfirmButton = false,
  confirmText = 'OK'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      button: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const styles = typeStyles[type] || typeStyles.info;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-xl w-full max-w-md mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === 'success' && <CheckCircle className={`w-6 h-6 ${styles.icon}`} />}
            {type === 'error' && <AlertCircle className={`w-6 h-6 ${styles.icon}`} />}
            {type === 'warning' && <AlertCircle className={`w-6 h-6 ${styles.icon}`} />}
            {type === 'info' && <InfoIcon className={`w-6 h-6 ${styles.icon}`} />}
            <h2 className={`text-lg font-semibold ${styles.title}`}>{title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
          >
            Close
          </button>
          {showConfirmButton && (
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg ${styles.button} text-white font-medium transition`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationModal;
