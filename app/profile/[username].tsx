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
import { useFollow } from '../../hooks/useFollow';
import { useUserRecipes } from '../../hooks/useUserRecipes';
import { RecipeCard } from '../../components/feed/RecipeCard';
import { VideoCard } from '../../components/feed/VideoCard';
import { CarouselCard } from '../../components/feed/CarouselCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

function ProfileSkeleton() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader title="" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Skeleton width={96} height={96} circle style={{ marginBottom: 16 }} />
          <Skeleton width={150} height={24} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 24 }} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={14} borderRadius={4} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={14} borderRadius={4} />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={60} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width={40} height={14} borderRadius={4} />
            </View>
          </View>
        </View>
        
        <View style={styles.gridContainer}>
          <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Skeleton width={(width - 48) / 2} height={(width - 48) / 2 + 60} borderRadius={16} style={{ marginBottom: 16 }} />
            <Skeleton width={(width - 48) / 2} height={(width - 48) / 2 + 60} borderRadius={16} style={{ marginBottom: 16 }} />
            <Skeleton width={(width - 48) / 2} height={(width - 48) / 2 + 60} borderRadius={16} style={{ marginBottom: 16 }} />
            <Skeleton width={(width - 48) / 2} height={(width - 48) / 2 + 60} borderRadius={16} style={{ marginBottom: 16 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile(username);
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();

  const isOwnProfile = user?.username === username;

  const { data: recipes = [], isLoading: recipesLoading } = useUserRecipes(profile?.id);
  const { isFollowing, toggleFollow, followersCount, followingCount, isToggling } = useFollow(profile?.id);

  if (profileLoading) {
    return <ProfileSkeleton />;
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
        isOwnProfile ? (
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <Text style={{ color: colors.brand.primary, fontFamily: 'Sora-SemiBold' }}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={toggleFollow} 
            disabled={isToggling}
            style={{ 
              backgroundColor: isFollowing ? colors.bgSecondary : colors.brand.primary,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20
            }}
          >
            <Text style={{ 
              color: isFollowing ? colors.textPrimary : '#FFF', 
              fontFamily: 'Sora-SemiBold',
              fontSize: 14
            }}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
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
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followingCount}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recipes ({recipes.length})</Text>
          
          {recipesLoading ? (
            <View style={{ gap: 16 }}>
              <Skeleton width="100%" height={250} borderRadius={16} />
              <Skeleton width="100%" height={250} borderRadius={16} />
            </View>
          ) : recipes.length > 0 ? (
            recipes.map((recipe) => {
              if (recipe.card_type === 'video' && recipe.video_url) {
                return <VideoCard key={recipe.id} recipe={recipe} isVisible={true} />;
              } else if (recipe.card_type === 'carousel' && recipe.recipe_steps?.length && recipe.recipe_steps.length > 0) {
                return <CarouselCard key={recipe.id} recipe={recipe} />;
              } else {
                return <RecipeCard key={recipe.id} recipe={recipe} />;
              }
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {isOwnProfile ? "You haven't published any recipes yet." : "This chef hasn't published any recipes yet."}
            </Text>
          )}
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
