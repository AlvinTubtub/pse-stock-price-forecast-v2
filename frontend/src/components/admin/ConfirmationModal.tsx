"use client";

import React, { useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
              danger
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                : "bg-brand-500/15 border border-brand-500/30 text-brand-400"
            }`}
          >
            {danger ? "⚠️" : "❓"}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-dark-border/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-xs text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
              danger
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-brand-600 hover:bg-brand-500"
            }`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
