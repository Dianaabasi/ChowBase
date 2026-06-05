import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { setAudioModeAsync } from 'expo-audio';
import { useRouter } from 'expo-router';
import { Heart, ChatCircle, SpeakerHigh, SpeakerX } from 'phosphor-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { CommentSheet } from '../recipe/CommentSheet';
import { useThemeColors } from '../../constants/theme';
import { useLike } from '../../hooks/useLike';
import { Recipe } from '../../types';

interface VideoCardProps {
  recipe: Recipe;
  isVisible?: boolean; // For auto-play logic
}

const { width } = Dimensions.get('window');

export function VideoCard({ recipe, isVisible = true }: VideoCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [isMuted, setIsMuted] = useState(true);
  const { isLiked, likesCount, toggleLike } = useLike(recipe.id, Number(recipe.likes?.[0]?.count ?? 0));
  const commentCount = Number(recipe.comments?.[0]?.count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const player = useVideoPlayer(recipe.video_url || '', player => {
    player.loop = true;
    player.muted = isMuted;
    if (isVisible) {
      player.play();
      setIsPlaying(true);
    }
  });

  useEffect(() => {
    // Configure audio to play in silent mode
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  useEffect(() => {
    if (player) {
      if (isVisible) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }
  }, [isVisible, player]);

  const handleCookMode = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleProfile = () => {
    if (recipe.profiles?.username) {
      router.push(`/profile/${recipe.profiles.username}`);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleCookMode} style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />
          
          <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
            {isMuted ? (
              <SpeakerX size={20} color="#FFF" weight="fill" />
            ) : (
              <SpeakerHigh size={20} color="#FFF" weight="fill" />
            )}
          </TouchableOpacity>
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
  videoContainer: {
    width: '100%',
    height: width * 1.2, // Taller for video format (TikTok style ratio)
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
