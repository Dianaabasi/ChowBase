import { create } from 'zustand';

export interface ModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  autoDismiss?: boolean;
  showCancel?: boolean;
}

interface ModalState {
  isVisible: boolean;
  config: ModalConfig | null;
  showAlert: (config: ModalConfig) => void;
  hideAlert: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isVisible: false,
  config: null,
  showAlert: (config) => {
    set({ isVisible: true, config });
    if (config.autoDismiss) {
      setTimeout(() => {
        if (get().isVisible) {
          set({ isVisible: false });
        }
      }, 2000);
    }
  },
  hideAlert: () => set({ isVisible: false }),
}));
