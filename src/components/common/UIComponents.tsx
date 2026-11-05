import React, { ReactNode } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, description, children, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full ${maxWidth} bg-[#101520] border border-slate-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0c1018]">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-md shrink-0 ${
            isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed">{message}</div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors text-white ${
            isDestructive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export const SeverityBadge: React.FC<{ severity: 'error' | 'warning' | 'info' }> = ({
  severity,
}) => {
  if (severity === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Error</span>
      </span>
    );
  }
  if (severity === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Warning</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400">
      <Info className="w-3.5 h-3.5" />
      <span>Notice</span>
    </span>
  );
};

export const ToastContainer: React.FC<{
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-md shadow-lg border text-xs font-medium backdrop-blur-md transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : toast.type === 'info'
              ? 'bg-slate-900/90 border-slate-700 text-slate-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
