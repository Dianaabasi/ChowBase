import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useThemeColors } from '../../constants/theme';
import { useModalStore } from '../../stores/modalStore';

export function ConfirmModal() {
  const colors = useThemeColors();
  const { isVisible, config, hideAlert } = useModalStore();

  if (!config) return null;

  const { title, message, confirmText = "OK", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false, autoDismiss, showCancel } = config;

  const handleCancel = () => {
    if (onCancel) onCancel();
    hideAlert();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    hideAlert();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleCancel}>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modal, { backgroundColor: colors.bgPrimary }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
              
              {!autoDismiss && (
                <View style={styles.actions}>
                  {(showCancel || onCancel) && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                      <Text style={[styles.cancelText, { color: colors.textPrimary }]}>{cancelText}</Text>
                    </TouchableOpacity>
                  )}
                  {onConfirm ? (
                    <TouchableOpacity 
                      style={[styles.confirmBtn, { backgroundColor: isDestructive ? colors.error : colors.brand.primary }]} 
                      onPress={handleConfirm}
                    >
                      <Text style={styles.confirmText}>{confirmText}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.confirmBtn, { backgroundColor: colors.brand.primary }]} 
                      onPress={hideAlert}
                    >
                      <Text style={styles.confirmText}>{confirmText}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modal: { 
    width: '80%', 
    padding: 24, 
    borderRadius: 24,
  },
  title: { 
    fontFamily: 'Sora-Bold', 
    fontSize: 18, 
    marginBottom: 8 
  },
  message: { 
    fontFamily: 'DM-Sans', 
    fontSize: 15, 
    marginBottom: 24, 
    lineHeight: 22 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12 
  },
  cancelBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 8 
  },
  cancelText: { 
    fontFamily: 'Sora-SemiBold', 
    fontSize: 14 
  },
  confirmBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 12 
  },
  confirmText: { 
    fontFamily: 'Sora-SemiBold', 
    fontSize: 14, 
    color: '#FFF' 
  },
});
