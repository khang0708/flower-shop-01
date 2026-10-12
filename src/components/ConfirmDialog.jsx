import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  open,
  title,
  itemName,
  description = 'Hành động này không thể hoàn tác.',
  confirmLabel = 'Xóa',
  busyLabel = 'Đang xóa...',
  cancelLabel = 'Hủy',
  busy = false,
  onConfirm,
  onCancel
}) => {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      returnFocusRef.current?.focus?.();
    };
  }, [open]);

  // Đang xử lý thì cả hai nút bị khóa: giữ focus trong hộp để Tab/Esc không rơi ra trang phía sau
  useEffect(() => {
    if (open && busy) dialogRef.current?.focus();
  }, [open, busy]);

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!busy) onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll('button:not([disabled])') || []);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!dialogRef.current?.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl outline-none"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-serif text-lg font-bold text-[#1B3B2B]">
              {title}
            </h2>
            {itemName && (
              <p className="mt-1 break-words text-sm font-semibold text-gray-800">&ldquo;{itemName}&rdquo;</p>
            )}
            <p id="confirm-dialog-desc" className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-full border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-full bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
