import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { UserCircle } from 'phosphor-react-native';
import { useModalStore } from '../../stores/modalStore';

export default function ChooseUsernameScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();
  const { user, setUser } = useAuthStore();

  const handleContinue = async () => {
    if (!username.trim() || username.length < 3) {
      useModalStore.getState().showAlert({
        title: 'Invalid',
        message: 'Username must be at least 3 characters long'
      });
      return;
    }
    
    if (!user?.id) return;

    setLoading(true);

    try {
      // Check if username is taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser && existingUser.id !== user.id) {
        useModalStore.getState().showAlert({
          title: 'Taken',
          message: 'This username is already taken. Please choose another.'
        });
        setLoading(false);
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update auth meta
      await supabase.auth.updateUser({
        data: { username: username.toLowerCase() }
      });

      setUser({ ...user, username: username.toLowerCase() });
      
      router.replace('/preferences');

    } catch (e: any) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message || 'Failed to update username'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BlurHeader title="Create Profile" />
      
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Choose your username</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>This is how you will appear to other chefs on ChowBase.</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.inputContainer}>
            <UserCircle size={20} color={colors.textSecondary} style={styles.icon} />
            <Text style={[styles.prefix, { color: colors.textSecondary }]}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
        </GlassCard>

        <GreenButton 
          title={loading ? "Saving..." : "Continue"} 
          onPress={handleContinue} 
          disabled={loading || username.length < 3}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 80,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  icon: {
    marginRight: 8,
  },
  prefix: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 16,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontFamily: 'DM-Sans',
    fontSize: 16,
    height: '100%',
  },
  button: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});
