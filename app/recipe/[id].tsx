import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useKeepAwake } from 'expo-keep-awake';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkle, ChatCircle, Heart, ShareNetwork, SpeakerHigh, SpeakerX, CornersOut, ShoppingCart, CookingPot, CaretRight, SealCheck } from 'phosphor-react-native';

import { useThemeColors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Recipe } from '../../types';
import { BlurHeader } from '../../components/ui/BlurHeader';
import { Avatar } from '../../components/ui/Avatar';
import { CommentSheet } from '../../components/recipe/CommentSheet';
import { useChatStore } from '../../stores/chatStore';
import { useModalStore } from '../../stores/modalStore';
import { useAuthStore } from '../../stores/authStore';
import { useLike } from '../../hooks/useLike';
import { useGroceryStore } from '../../stores/groceryStore';
import { CookModeView } from '../../components/recipe/CookModeView';
import { Skeleton } from '../../components/ui/Skeleton';

const { width } = Dimensions.get('window');

function RecipeSkeleton() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader transparent hideBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} bounces={false}>
        <Skeleton width="100%" height={width} borderRadius={0} />
        <View style={styles.content}>
          <Skeleton width="70%" height={28} borderRadius={8} style={{ marginBottom: 16 }} />
          <View style={[styles.authorRow, { marginBottom: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={36} height={36} circle />
              <Skeleton width={120} height={16} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Skeleton width={24} height={24} circle />
              <Skeleton width={24} height={24} circle />
              <Skeleton width={24} height={24} circle />
            </View>
          </View>
          <View style={{ gap: 8, marginBottom: 32 }}>
            <Skeleton width="100%" height={14} borderRadius={4} />
            <Skeleton width="100%" height={14} borderRadius={4} />
            <Skeleton width="80%" height={14} borderRadius={4} />
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            <Skeleton width={100} height={32} borderRadius={16} />
            <Skeleton width={100} height={32} borderRadius={16} />
          </View>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={12} height={12} circle />
              <Skeleton width="40%" height={16} borderRadius={4} />
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
              <Skeleton width={60} height={16} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={12} height={12} circle />
              <Skeleton width="50%" height={16} borderRadius={4} />
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
              <Skeleton width={40} height={16} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton width={12} height={12} circle />
              <Skeleton width="30%" height={16} borderRadius={4} />
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
              <Skeleton width={80} height={16} borderRadius={4} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StepTimer({ timerSecs }: { timerSecs: number }) {
  const [timeLeft, setTimeLeft] = useState(timerSecs);
  const [isActive, setIsActive] = useState(false);
  const colors = useThemeColors();

  React.useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(timerSecs); };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Text style={[styles.stepTimer, { color: colors.brand.secondary }]}>
        ⏱ {formatTime(timeLeft)}
      </Text>
      <TouchableOpacity onPress={toggleTimer} style={[styles.timerBtn, { backgroundColor: isActive ? colors.error : colors.brand.primary }]}>
        <Text style={styles.timerBtnText}>{isActive ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>
      {timeLeft < timerSecs && (
        <TouchableOpacity onPress={resetTimer} style={[styles.timerBtn, { backgroundColor: colors.bgSecondary }]}>
          <Text style={[styles.timerBtnText, { color: colors.textPrimary }]}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function RecipeDetailScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const videoViewRef = useRef<VideoView>(null);
  
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isCookMode, setIsCookMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  const { isLiked, toggleLike } = useLike(id);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles!recipes_author_id_fkey(username, avatar_url, is_verified),
          recipe_ingredients:ingredients(*),
          recipe_steps(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Recipe;
    },
    enabled: !!id,
  });

  const player = useVideoPlayer(recipe?.video_url || '', player => {
    player.loop = true;
    player.muted = isMuted;
    player.play();
  });

  React.useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  if (isLoading) {
    return <RecipeSkeleton />;
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Recipe not found</Text>
      </View>
    );
  }

  const sortedSteps = [...(recipe.recipe_steps || [])].sort((a, b) => a.step_number - b.step_number);

  const handleShare = async () => {
    const link = `chowbase://recipe/${recipe.id}`;
    useModalStore.getState().showAlert({
      title: 'Share Recipe',
      message: `Share this link with your friends to show them this amazing recipe:\n\n${link}`,
      confirmText: 'Copy Link',
      showCancel: true,
      onConfirm: async () => {
        await Clipboard.setStringAsync(link);
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader transparent onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} bounces={false}>
        {/* Media Header */}
        <View style={styles.mediaContainer}>
          {recipe.video_url ? (
            <>
              <VideoView
                ref={videoViewRef}
                player={player}
                style={styles.media}
                contentFit="cover"
                nativeControls={false}
              />
              <View style={styles.videoControls}>
                <TouchableOpacity style={styles.videoBtn} onPress={() => setIsMuted(!isMuted)}>
                  {isMuted ? (
                    <SpeakerX size={20} color="#FFF" weight="fill" />
                  ) : (
                    <SpeakerHigh size={20} color="#FFF" weight="fill" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.videoBtn} onPress={() => videoViewRef.current?.enterFullscreen()}>
                  <CornersOut size={20} color="#FFF" weight="fill" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Image 
              source={recipe.image_url} 
              style={styles.media} 
              contentFit="cover" 
            />
          )}
        </View>

        {/* Content Body */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{recipe.title}</Text>
          
          <View style={styles.authorRow}>
            <TouchableOpacity 
              style={styles.authorInfo}
              onPress={() => router.push(`/profile/${recipe.profiles?.username}`)}
            >
              <Avatar url={recipe.profiles?.avatar_url} name={recipe.profiles?.username} size={36} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.authorName, { color: colors.textPrimary }]}>
                  {recipe.profiles?.username}
                </Text>
                {recipe.profiles?.is_verified && (
                  <SealCheck size={18} color="#3B82F6" weight="fill" />
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                <Heart size={24} color={isLiked ? '#E11D48' : colors.textSecondary} weight={isLiked ? 'fill' : 'regular'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
                <ChatCircle size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <ShareNetwork size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {recipe.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {recipe.description}
            </Text>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'ingredients' && { borderBottomColor: colors.brand.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('ingredients')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'ingredients' ? colors.brand.primary : colors.textSecondary }]}>
                Ingredients
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'instructions' && { borderBottomColor: colors.brand.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('instructions')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'instructions' ? colors.brand.primary : colors.textSecondary }]}>
                Instructions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'ingredients' ? (
              <View style={styles.ingredientsContainer}>
                {recipe.recipe_ingredients?.map((ing: any, idx: number) => (
                  <View key={ing.id || idx} style={styles.ingredientRow}>
                    <View style={[styles.ingredientDot, { backgroundColor: colors.brand.primary }]} />
                    <Text style={[styles.ingredientName, { color: colors.textPrimary }]}>{ing.name}</Text>
                    <View style={[styles.ingredientLine, { borderBottomColor: colors.borderSubtle }]} />
                    <Text style={[styles.ingredientAmount, { color: colors.textSecondary }]}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity 
                  style={[styles.groceryBtn, { backgroundColor: colors.brand.primary }]}
                  onPress={() => {
                    if (!recipe.recipe_ingredients || recipe.recipe_ingredients.length === 0) {
                      useModalStore.getState().showAlert({
                        title: 'No Ingredients',
                        message: 'There are no ingredients to add to your list.',
                        confirmText: 'Okay'
                      });
                      return;
                    }
                    recipe.recipe_ingredients.forEach((ing: any) => {
                      useGroceryStore.getState().addItem({
                        name: ing.name,
                        amount: parseInt(ing.quantity) || 1,
                        unit: ing.unit || 'pcs',
                        market_section: ing.market_section || 'General'
                      });
                    });
                    useModalStore.getState().showAlert({
                      title: 'Added to Groceries',
                      message: 'All ingredients have been added to your Grocery list!',
                      confirmText: 'Awesome'
                    });
                  }}
                >
                  <ShoppingCart size={20} color="#FFF" weight="fill" />
                  <Text style={styles.groceryBtnText}>Add to Grocery List</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                <TouchableOpacity 
                  style={[styles.startCookingBtn, { backgroundColor: colors.brand.primary }]}
                  onPress={() => setIsCookMode(true)}
                >
                  <CookingPot size={22} color="#FFF" weight="fill" />
                  <Text style={styles.startCookingBtnText}>Start Cooking Mode</Text>
                  <CaretRight size={20} color="#FFF" weight="bold" />
                </TouchableOpacity>

                {sortedSteps.map((step) => (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={[styles.stepNumberContainer, { backgroundColor: colors.brand.primary }]}>
                      <Text style={styles.stepNumber}>{step.step_number}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepInstruction, { color: colors.textPrimary }]}>
                        {step.instruction}
                      </Text>
                      {step.timer_secs && (
                        <StepTimer timerSecs={step.timer_secs} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Sapa/AI Button */}
      <View style={[styles.floatingFooter, { paddingBottom: insets.bottom || 24 }]}>
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => {
            const promptText = `I want to cook the recipe: "${recipe.title}". Can you give me tips or guide me?`;
            const conversationId = useChatStore.getState().createConversation(
              recipe.title,
              false,
              promptText
            );
            router.push({ 
              pathname: '/assistant/chat', 
              params: { conversationId } 
            });
          }}
          activeOpacity={0.9}
        >
          <Sparkle size={20} color="#FFF" weight="fill" />
          <Text style={styles.aiButtonText}>Ask ChowAI</Text>
        </TouchableOpacity>
      </View>

      <CommentSheet 
        recipeId={recipe.id}
        visible={showComments}
        onClose={() => setShowComments(false)}
      />

      <Modal visible={isCookMode} animationType="slide" transparent={false}>
        <CookModeView recipe={recipe} onClose={() => setIsCookMode(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mediaContainer: {
    width: width,
    height: width * 1.2,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  videoBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 26,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorName: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  description: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
  },
  tabContent: {
    paddingTop: 8,
  },
  ingredientsContainer: {
    paddingBottom: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  ingredientName: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 16,
  },
  ingredientLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 12,
    opacity: 0.5,
  },
  ingredientAmount: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
  },
  groceryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  groceryBtnText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 16,
  },
  instructionsContainer: {
    paddingTop: 8,
  },
  startCookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 32,
    gap: 12,
  },
  startCookingBtnText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 16,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  stepTimer: {
    fontFamily: 'DM-Sans-Bold',
    fontSize: 16,
    marginRight: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  timerBtnText: {
    color: '#FFF',
    fontFamily: 'Sora-SemiBold',
    fontSize: 12,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiButtonText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 15,
  },
});
