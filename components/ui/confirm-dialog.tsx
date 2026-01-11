'use client';

import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: icon || '🗑️',
      confirmBg: 'bg-red-500 hover:bg-red-600',
      iconBg: 'bg-red-100',
    },
    warning: {
      icon: icon || '⚠️',
      confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    info: {
      icon: icon || 'ℹ️',
      confirmBg: 'bg-blue-500 hover:bg-blue-600',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl modal-content border-2 border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center animate-scale-in`}>
              <span className="text-3xl">{styles.icon}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-black text-gray-900 text-center mb-2 animate-fade-in">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6 font-semibold animate-fade-in">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 button-animate font-bold"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${styles.confirmBg} text-white font-bold button-animate`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
