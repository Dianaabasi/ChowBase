import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { supabase } from '../../lib/supabase';
import { EnvelopeSimple, LockKey, Eye, EyeSlash, GoogleLogo, User, At, CheckSquare, Square } from 'phosphor-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useModalStore } from '../../stores/modalStore';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: 'Please fill in all fields'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: 'Passwords do not match'
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        }
      }
    });

    setLoading(false);
    if (error) {
      useModalStore.getState().showAlert({
        title: 'Registration Failed',
        message: error.message
      });
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
        title: 'Google Signup Failed',
        message: error.message
      });
    } else if (data?.url) {
      console.log("SUPABASE GENERATED OAUTH URL:", data.url);
      
      // Show the URL to the user so they can whitelist it if it fails
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
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BlurHeader title="" transparent />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join the ChowBase community</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.inputContainer}>
            <User size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Full Name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={[styles.inputContainer, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
            <At size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
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
              {showPassword ? <EyeSlash size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { borderTopWidth: 1, borderTopColor: colors.borderSubtle }]}>
            <LockKey size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              {showConfirmPassword ? <EyeSlash size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.agreementContainer}>
          <TouchableOpacity onPress={() => setHasAgreed(!hasAgreed)} style={styles.checkbox}>
            {hasAgreed ? (
              <CheckSquare size={24} color={colors.brand.primary} weight="fill" />
            ) : (
              <Square size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text 
              style={[styles.agreementLink, { color: colors.brand.primary }]} 
              onPress={() => router.push('/(auth)/terms')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text 
              style={[styles.agreementLink, { color: colors.brand.primary }]} 
              onPress={() => router.push('/(auth)/privacy-policy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        <GreenButton 
          title={loading ? "Creating account..." : "Sign Up"} 
          onPress={handleRegister} 
          disabled={loading || !hasAgreed}
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
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={[styles.footerLink, { color: colors.brand.primary }]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 24,
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
    marginBottom: 24,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 12,
  },
  agreementText: {
    flex: 1,
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 20,
  },
  agreementLink: {
    fontFamily: 'DM-Sans-Medium',
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
