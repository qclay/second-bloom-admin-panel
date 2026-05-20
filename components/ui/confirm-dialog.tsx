'use client';

import { Button } from './button';
import { Trash2, AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  closeOnConfirm?: boolean;
  isLoading?: boolean;
  /** Renders after the message (e.g. textarea for rejection reason) */
  extraContent?: React.ReactNode;
  /** When true, confirm button is disabled */
  confirmDisabled?: boolean;
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
  closeOnConfirm = true,
  isLoading = false,
  extraContent,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: icon || <Trash2 className="w-8 h-8 text-red-600" />,
      confirmBg: 'bg-red-500 hover:bg-red-600',
      iconBg: 'bg-red-100',
    },
    warning: {
      icon: icon || <AlertTriangle className="w-8 h-8 text-yellow-600" />,
      confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    info: {
      icon: icon || <Info className="w-8 h-8 text-blue-600" />,
      confirmBg: 'bg-blue-500 hover:bg-blue-600',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    onConfirm();
    if (closeOnConfirm) onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 modal-backdrop overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl modal-content border-2 border-gray-100 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${styles.iconBg} flex items-center justify-center animate-scale-in shrink-0`}>
              <span className="flex items-center justify-center">{styles.icon}</span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-gray-900 text-center mb-2 animate-fade-in">
            {title}
          </h3>

          <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6 font-semibold animate-fade-in">
            {message}
          </p>

          {extraContent && <div className="mb-4 sm:mb-6">{extraContent}</div>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 button-animate font-bold"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || confirmDisabled}
              className={`flex-1 ${styles.confirmBg} text-white font-bold button-animate`}
            >
              {isLoading ? '...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
