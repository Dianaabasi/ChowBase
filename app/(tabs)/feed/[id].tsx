import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkle, ChatCircle, Heart, ShareNetwork, SpeakerHigh, SpeakerX } from 'phosphor-react-native';

import { useThemeColors } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { Recipe } from '../../../types';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { CommentSheet } from '../../../components/recipe/CommentSheet';
import { useChatStore } from '../../../stores/chatStore';

const { width } = Dimensions.get('window');

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
  const videoRef = useRef<Video>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles(username, avatar_url, is_verified),
          recipe_ingredients(*),
          recipe_steps(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Recipe;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Recipe not found</Text>
      </View>
    );
  }

  const sortedSteps = [...(recipe.recipe_steps || [])].sort((a, b) => a.step_number - b.step_number);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader transparent onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} bounces={false}>
        {/* Media Header */}
        <View style={styles.mediaContainer}>
          {recipe.video_url ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: recipe.video_url }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted={isMuted}
                useNativeControls={false}
              />
              <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted(!isMuted)}>
                {isMuted ? (
                  <SpeakerX size={20} color="#FFF" weight="fill" />
                ) : (
                  <SpeakerHigh size={20} color="#FFF" weight="fill" />
                )}
              </TouchableOpacity>
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
              <Text style={[styles.authorName, { color: colors.textPrimary }]}>
                {recipe.profiles?.username}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Heart size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
                <ChatCircle size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
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
              <View>
                {recipe.recipe_ingredients?.map((ing) => (
                  <View key={ing.id} style={[styles.ingredientRow, { borderBottomColor: colors.borderSubtle }]}>
                    <Text style={[styles.ingredientName, { color: colors.textPrimary }]}>{ing.ingredient_name}</Text>
                    <Text style={[styles.ingredientAmount, { color: colors.textSecondary }]}>
                      {ing.amount} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
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
          <Text style={styles.aiButtonText}>Ask Chef AI</Text>
        </TouchableOpacity>
      </View>

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
  muteButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
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
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ingredientName: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 16,
  },
  ingredientAmount: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
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
