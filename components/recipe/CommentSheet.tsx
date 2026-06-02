import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, PaperPlaneRight, Flag } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { useComments } from '../../hooks/useComments';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useModalStore } from '../../stores/modalStore';

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
  const { data: comments, isLoading } = useComments(recipeId);

  const handleSubmit = async () => {
    if (!content.trim() || !user?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        recipe_id: recipeId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;
      setContent('');
    } catch (e: any) {
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message
      });
    } finally {
      setIsSubmitting(false);
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
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={[styles.sheetContent, { backgroundColor: colors.bgPrimary, paddingBottom: insets.bottom || 16 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: colors.textSecondary }}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
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
                    <Text style={[styles.content, { color: colors.textPrimary }]}>
                      {item.content}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleFlag(item.id)} style={styles.flagBtn}>
                    <Flag size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No comments yet. Be the first to comment!
                </Text>
              }
            />
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
    height: '80%',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
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
});
