import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { supabase } from '../../lib/supabase';
import { EnvelopeSimple, LockKey, Eye, EyeSlash, GoogleLogo } from 'phosphor-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useModalStore } from '../../stores/modalStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();

  const handleLogin = async () => {
    if (!email || !password) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: 'Please enter both email and password'
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      useModalStore.getState().showAlert({
        title: 'Login Failed',
        message: error.message
      });
    } else {
      router.replace('/(tabs)/feed');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Force the custom scheme to bypass Expo Go dynamic IP whitelist issues
    const redirectUrl = makeRedirectUri();
    console.log("CRITICAL SUPABASE REDIRECT URL TO WHITELIST:", redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // MUST be true for React Native
      },
    });
    setLoading(false);
    
    if (error) {
      useModalStore.getState().showAlert({
        title: 'Google Login Failed',
        message: error.message
      });
    } else if (data?.url) {
      // Open the browser and wait for it to return the deep link
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (res.type === 'success' && res.url) {
        // Extract the tokens from the deep link URL hash
        const urlObj = new URL(res.url.replace('#', '?'));
        const access_token = urlObj.searchParams.get('access_token');
        const refresh_token = urlObj.searchParams.get('refresh_token');
        
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader title="" transparent />
      
      <KeyboardAwareScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={120}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Log in to continue</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.inputContainer}>
            <EnvelopeSimple size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <View style={[styles.inputContainer, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
            <LockKey size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <EyeSlash size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GreenButton 
          title={loading ? "Logging in..." : "Log In"} 
          onPress={handleLogin} 
          disabled={loading}
          style={styles.button}
        />

        <View style={styles.orContainer}>
          <View style={[styles.orLine, { backgroundColor: colors.borderSubtle }]} />
          <Text style={[styles.orText, { color: colors.textSecondary }]}>- or -</Text>
          <View style={[styles.orLine, { backgroundColor: colors.borderSubtle }]} />
        </View>

        <TouchableOpacity 
          style={[styles.googleButton, { borderColor: colors.borderSubtle, backgroundColor: colors.bgSecondary }]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <GoogleLogo size={24} color={colors.textPrimary} weight="bold" />
          <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.footerLink, { color: colors.brand.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'DM-Sans',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    marginBottom: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  googleButtonText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
  },
});
