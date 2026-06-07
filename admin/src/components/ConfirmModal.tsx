'use client';

import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10 border-red-500/20',
      btnBg: 'bg-red-600 hover:bg-red-550 shadow-red-600/20',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      btnBg: 'bg-amber-600 hover:bg-amber-550 shadow-amber-600/20',
    },
    success: {
      icon: HelpCircle,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      btnBg: 'bg-emerald-600 hover:bg-emerald-550 shadow-emerald-600/20',
    },
    info: {
      icon: HelpCircle,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      btnBg: 'bg-blue-600 hover:bg-blue-550 shadow-blue-600/20',
    }
  };

  const currentType = typeConfig[type];
  const Icon = currentType.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative transform overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 px-6 py-6 text-left shadow-2xl transition-all sm:w-full sm:max-w-md z-10 animate-scaleIn">
        <div className="flex gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${currentType.iconBg}`}>
            <Icon className={`h-6 w-6 ${currentType.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white leading-6">
              {title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-850 bg-zinc-950/40 px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all cursor-pointer ${currentType.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
