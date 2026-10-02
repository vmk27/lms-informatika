import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  isDirty?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  title,
  description,
  onClose,
  isDirty = false,
  maxWidthClass = 'max-w-3xl',
  children,
  footer,
}) => {
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  if (!isOpen) return null;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unsaved Changes Warning Banner */}
        {showUnsavedPrompt && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Terdapat perubahan yang belum disimpan. Yakin ingin menutup formulir ini?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-1 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              >
                Lanjutkan Mengedit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
