import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../stores/authStore';
import { useThemeColors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile(username);
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();

  const isOwnProfile = user?.username === username;

  const { data: recipeCount } = useQuery({
    queryKey: ['recipeCount', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count, error } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .eq('status', 'published');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  if (profileLoading) {
    return <View style={[styles.container, { backgroundColor: colors.bgPrimary }]} />;
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader title={profile.username || ''} rightComponent={
        isOwnProfile && (
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={{ color: colors.brand.primary, fontFamily: 'Sora-SemiBold' }}>Edit</Text>
          </TouchableOpacity>
        )
      } />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar url={profile.avatar_url} name={profile.username} size={96} />
          <Text style={[styles.fullName, { color: colors.textPrimary }]}>
            {profile.full_name || profile.username}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile.username}</Text>
            {profile.is_verified && <Badge variant="verified" />}
          </View>

          {profile.bio && (
            <Text style={[styles.bio, { color: colors.textPrimary }]}>{profile.bio}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                Joined
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {format(new Date(profile.created_at), 'MMM yyyy')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recipes ({recipeCount || 0})</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {isOwnProfile ? "You haven't published any recipes yet." : "This chef hasn't published any recipes yet."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fullName: {
    fontFamily: 'Sora-Bold',
    fontSize: 24,
    marginTop: 16,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  username: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
  },
  bio: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  gridContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'DM-Sans',
    textAlign: 'center',
    marginTop: 40,
  },
});
