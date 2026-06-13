import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, Platform, Animated, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, PaperPlaneRight, Flag } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { useComments } from '../../hooks/useComments';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useModalStore } from '../../stores/modalStore';
import { Comment } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { LinkedText } from '../ui/LinkedText';

function CommentSkeleton() {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' }}>
      <Skeleton width={36} height={36} circle style={{ marginRight: 12 }} />
      <View style={{ flex: 1, marginTop: 4 }}>
        <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} borderRadius={4} />
      </View>
    </View>
  );
}

interface CommentSheetProps {
  recipeId: string;
  visible: boolean;
  onClose: () => void;
}

export function CommentSheet({ recipeId, visible, onClose }: CommentSheetProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useComments(recipeId);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user?.id || isSubmitting) return;

    const trimmed = content.trim();
    setContent('');
    setIsSubmitting(true);

    // Optimistic update
    const optimisticComment: Comment = {
      id: `optimistic-${Date.now()}`,
      user_id: user.id,
      recipe_id: recipeId,
      content: trimmed,
      is_flagged: false,
      created_at: new Date().toISOString(),
      profiles: {
        username: user.username ?? null,
        avatar_url: null,
        is_verified: false,
      },
    };

    queryClient.setQueryData<Comment[]>(['comments', recipeId], (old) =>
      [optimisticComment, ...(old ?? [])]
    );

    showToast();

    try {
      const { error } = await supabase.from('comments').insert({
        recipe_id: recipeId,
        user_id: user.id,
        content: trimmed,
      });

      if (error) throw error;
    } catch (e: any) {
      // Rollback optimistic update on failure
      queryClient.setQueryData<Comment[]>(['comments', recipeId], (old) =>
        (old ?? []).filter((c) => c.id !== optimisticComment.id)
      );
      setContent(trimmed);
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message
      });
    } finally {
      setIsSubmitting(false);
      // Refetch to replace optimistic entry with real server data
      queryClient.invalidateQueries({ queryKey: ['comments', recipeId] });
    }
  };

  const handleFlag = async (commentId: string) => {
    useModalStore.getState().showAlert({
      title: 'Report Comment',
      message: 'Are you sure you want to flag this comment?',
      confirmText: 'Report',
      showCancel: true,
      isDestructive: true,
      onConfirm: async () => {
        await supabase.from('comments').update({ is_flagged: true }).eq('id', commentId);
      }
    });
  };

  const handleProfile = (username?: string | null) => {
    if (username) {
      onClose();
      router.push(`/profile/${username}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.sheetContent, { backgroundColor: colors.bgPrimary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ padding: 16 }}>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {!comments || comments.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No comments yet. Be the first to comment!
                </Text>
              ) : (
                comments.map(item => (
                  <View style={styles.commentRow} key={item.id}>
                    <TouchableOpacity onPress={() => handleProfile(item.profiles?.username)}>
                      <Avatar url={item.profiles?.avatar_url} name={item.profiles?.username} size={36} />
                    </TouchableOpacity>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <TouchableOpacity onPress={() => handleProfile(item.profiles?.username)}>
                          <Text style={[styles.username, { color: colors.textPrimary }]}>
                            {item.profiles?.username || 'Unknown'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.time, { color: colors.textMuted }]}>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </Text>
                      </View>
                      <LinkedText
                        text={item.content}
                        textStyle={[styles.content, { color: colors.textPrimary }]}
                        linkColor={colors.brand.primary}
                      />
                    </View>
                    <TouchableOpacity onPress={() => handleFlag(item.id)} style={styles.flagBtn}>
                      <Flag size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={[styles.inputContainer, { borderTopColor: colors.borderSubtle }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgSecondary }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={!content.trim() || isSubmitting}
              style={[
                styles.sendBtn, 
                { backgroundColor: content.trim() ? colors.brand.primary : colors.bgSecondary }
              ]}
            >
              <PaperPlaneRight size={20} color={content.trim() ? '#FFF' : colors.textMuted} weight="fill" />
            </TouchableOpacity>
          </View>

          {/* Inline toast */}
          {toastVisible && (
            <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.toastText, { color: colors.textPrimary }]}>✓ Comment posted</Text>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
  },
  time: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
  },
  content: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 20,
  },
  flagBtn: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
    maxHeight: 120,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  toastText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
});
