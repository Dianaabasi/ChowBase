import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../constants/theme';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { GreenButton } from '../../components/ui/GreenButton';
import { supabase } from '../../lib/supabase';
import { uploadRecipeMedia } from '../../lib/cloudinary';
import { UserCircle, EnvelopeSimple, Phone, IdentificationCard, Camera, Lock } from 'phosphor-react-native';
import { useModalStore } from '../../stores/modalStore';

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const uploadResult = await uploadRecipeMedia(result.assets[0].uri, 'image');
        setAvatarUrl(uploadResult.secure_url);
      } catch (e: any) {
        useModalStore.getState().showAlert({
          title: 'Upload failed',
          message: e.message
        });
      } finally {
        setLoading(false);
      }
    }
  }

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        bio: bio,
        phone: phone,
        avatar_url: avatarUrl
      }).eq('id', user.id);

      if (error) throw error;
      
      useModalStore.getState().showAlert({
        title: 'Success',
        message: 'Profile updated successfully!',
        onConfirm: () => router.back()
      });
    } catch (e: any) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message
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
      <BlurHeader title="Edit Profile" />

      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets={true}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
                <Camera size={32} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.brand.primary }]}>
              <Camera size={14} color="#FFF" weight="fill" />
            </View>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <View style={styles.inputContainer}>
              <UserCircle size={20} color={colors.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.textMuted }]}
                value={profile?.username || ''}
                editable={false}
              />
              <Lock size={16} color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={styles.inputContainer}>
              <EnvelopeSimple size={20} color={colors.textMuted} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.textMuted }]}
                value={profile?.email || ''}
                editable={false}
              />
              <Lock size={16} color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={styles.inputContainer}>
              <IdentificationCard size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+234..."
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.lastGroup]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
            <View style={[styles.inputContainer, styles.bioContainer]}>
              <TextInput
                style={[styles.input, styles.bioInput, { color: colors.textPrimary }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about your culinary journey..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={160}
              />
            </View>
          </View>
        </GlassCard>

        <GreenButton 
          title={loading ? "Saving..." : "Save Changes"} 
          onPress={handleSave} 
          disabled={loading}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  card: {
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  lastGroup: {
    marginBottom: 0,
  },
  label: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
  bioContainer: {
    height: 100,
    alignItems: 'flex-start',
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  button: {
    marginTop: 16,
  },
});
