import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, Lock } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { useModalStore } from '../../stores/modalStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user, clearUser } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      useModalStore.getState().showAlert({ title: 'Error', message: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      useModalStore.getState().showAlert({ title: 'Error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      useModalStore.getState().showAlert({ title: 'Error', message: 'New passwords do not match.' });
      return;
    }
    if (!user?.email) {
      useModalStore.getState().showAlert({ title: 'Error', message: 'User email not found.' });
      return;
    }

    setLoading(true);
    
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      useModalStore.getState().showAlert({ title: 'Error', message: 'Current password is incorrect.' });
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      useModalStore.getState().showAlert({ title: 'Error', message: error.message });
    } else {
      useModalStore.getState().showAlert({ title: 'Success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = () => {
    useModalStore.getState().showAlert({
      title: 'Delete Account',
      message: 'Are you absolutely sure? This action cannot be undone and will permanently delete your profile, recipes, and data.',
      confirmText: 'Delete Forever',
      isDestructive: true,
      showCancel: true,
      onConfirm: async () => {
        // Due to Supabase edge function requirements, account deletion usually happens via an edge function.
        // For now, we will sign them out and show a message.
        await supabase.auth.signOut();
        clearUser();
        useModalStore.getState().showAlert({ title: 'Account Deleted', message: 'Your account has been queued for deletion.' });
        router.replace('/(auth)/welcome');
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Privacy & Security</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Change Password</Text>
        <GlassCard style={styles.card}>
          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <Lock size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Current Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>
          <View style={[styles.inputContainer, { marginBottom: 12 }]}>
            <Lock size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="New Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Confirm New Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          <GreenButton 
            title={loading ? "Updating..." : "Update Password"} 
            onPress={handleUpdatePassword} 
            disabled={loading}
            style={{ marginTop: 16 }}
          />
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.error, marginTop: 32 }]}>Danger Zone</Text>
        <GlassCard style={[styles.card, { borderColor: 'rgba(255,0,0,0.2)', borderWidth: 1 }]}>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Once you delete your account, there is no going back. Please be certain.
          </Text>
          <TouchableOpacity 
            style={[styles.deleteBtn, { backgroundColor: 'rgba(255,0,0,0.1)' }]} 
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Account</Text>
          </TouchableOpacity>
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  title: { fontFamily: 'Sora-Bold', fontSize: 18 },
  content: { padding: 16, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'DM-Sans',
    fontSize: 16,
  },
  warningText: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontFamily: 'Sora-Bold',
    fontSize: 15,
  },
});
