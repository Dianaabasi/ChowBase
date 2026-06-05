import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, ChatCircle, Timer, Fire } from 'phosphor-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { CommentSheet } from '../recipe/CommentSheet';
import { useThemeColors } from '../../constants/theme';
import { useLike } from '../../hooks/useLike';
import { Recipe } from '../../types';

interface CarouselCardProps {
  recipe: Recipe;
}

const { width } = Dimensions.get('window');

export function CarouselCard({ recipe }: CarouselCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isLiked, likesCount, toggleLike } = useLike(recipe.id, Number(recipe.likes?.[0]?.count ?? 0));
  const commentCount = Number(recipe.comments?.[0]?.count ?? 0);
  const [showComments, setShowComments] = useState(false);

  const steps = recipe.recipe_steps?.sort((a, b) => a.step_number - b.step_number) || [];

  const handleCookMode = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleProfile = () => {
    if (recipe.profiles?.username) {
      router.push(`/profile/${recipe.profiles.username}`);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = e.nativeEvent.layoutMeasurement.width;
    const index = Math.round(e.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentIndex && index >= 0 && index < steps.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.carouselContainer}>
          <FlatList
            data={steps}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={false}
            renderItem={({ item, index }) => (
              <View style={[styles.slide, { width: width - 32 }]}>
                <Image 
                  source={recipe.image_url} 
                  style={styles.image} 
                  contentFit="cover"
                />
                <View style={styles.stepOverlay}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {item.step_number}</Text>
                  </View>
                  <Text style={styles.stepInstruction} numberOfLines={3}>
                    {item.instruction}
                  </Text>
                </View>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? colors.brand.secondary : 'rgba(255,255,255,0.5)' },
                ]}
              />
            ))}
          </View>
        </View>

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
  carouselContainer: {
    width: '100%',
    height: width * 0.8,
  },
  slide: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stepOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32, // make room for dots
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stepBadge: {
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stepBadgeText: {
    color: '#FFF',
    fontFamily: 'Sora-SemiBold',
    fontSize: 12,
  },
  stepInstruction: {
    color: '#FFF',
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
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
    marginBottom: 16,
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
