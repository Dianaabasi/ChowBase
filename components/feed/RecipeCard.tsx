import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, ChatCircle, Timer, Fire, Leaf } from 'phosphor-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { CommentSheet } from '../recipe/CommentSheet';
import { useThemeColors } from '../../constants/theme';
import { useLike } from '../../hooks/useLike';
import { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const { width } = Dimensions.get('window');

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { isLiked, likesCount, toggleLike } = useLike(recipe.id, Number(recipe.likes?.[0]?.count ?? 0));
  const commentCount = Number(recipe.comments?.[0]?.count ?? 0);
  const [showComments, setShowComments] = useState(false);

  const handleCookMode = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleProfile = () => {
    if (recipe.profiles?.username) {
      router.push(`/profile/${recipe.profiles.username}`);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleCookMode}>
          <Image 
            source={recipe.image_url} 
            style={styles.image} 
            contentFit="cover"
            transition={300}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleProfile} style={styles.authorInfo}>
              <Avatar url={recipe.profiles?.avatar_url} name={recipe.profiles?.username} size={32} />
              <View style={styles.authorText}>
                <Text style={[styles.authorName, { color: colors.textPrimary }]}>
                  {recipe.profiles?.username || 'Unknown Chef'}
                </Text>
                {recipe.profiles?.is_verified && <Badge variant="verified" style={styles.badge} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.counterBtn}
              onPress={toggleLike}
            >
              <Heart 
                size={22} 
                color={isLiked ? '#E11D48' : colors.textSecondary} 
                weight={isLiked ? 'fill' : 'regular'}
              />
              <Text style={[styles.counterText, { color: isLiked ? '#E11D48' : colors.textSecondary }]}>
                {likesCount > 0 ? likesCount : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.meta}>
            {recipe.prep_time_mins + recipe.cook_time_mins > 0 && (
              <View style={styles.metaItem}>
                <Timer size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {recipe.prep_time_mins + recipe.cook_time_mins} min
                </Text>
              </View>
            )}
            {recipe.kcal > 0 && (
              <View style={styles.metaItem}>
                <Fire size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {recipe.kcal} kcal
                </Text>
              </View>
            )}
            {recipe.healthy_score > 0 && (
              <View style={styles.metaItem}>
                <Leaf size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {recipe.healthy_score}/100
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cookButton} onPress={handleCookMode}>
              <Text style={styles.cookButtonText}>Cook This 🍳</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.counterBtn} onPress={() => setShowComments(true)}>
              <ChatCircle size={22} color={colors.textSecondary} />
              <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                {commentCount > 0 ? commentCount : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      <CommentSheet 
        recipeId={recipe.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: width * 0.6,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
  badge: {
    marginLeft: 6,
  },
  likeButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cookButton: {
    backgroundColor: '#15803D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    marginRight: 16,
    alignItems: 'center',
  },
  cookButtonText: {
    color: '#FFF',
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
  },
  counterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  counterText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 13,
  },
});
