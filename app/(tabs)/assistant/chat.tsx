import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperPlaneRight, Sparkle, CaretLeft } from 'phosphor-react-native';
import { useThemeColors } from '../../../constants/theme';
import { ChatBubble } from '../../../components/assistant/ChatBubble';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useChatStore } from '../../../stores/chatStore';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const conversations = useChatStore((state) => state.conversations);
  const addMessage = useChatStore((state) => state.addMessage);

  const conversation = conversations.find(c => c.id === conversationId);
  const messages = conversation ? conversation.messages : [];
  const isSapaMode = conversation ? conversation.sapaMode : false;
  
  // Track how many messages existed when we opened the chat so we don't animate historical messages
  const initialMessageCount = useRef(messages.length).current;

  useEffect(() => {
    if (conversation && conversation.messages.length === 2 && conversation.messages[1].role === 'user') {
      fetchAIResponse(conversation.messages);
    }
  }, [conversationId]);

  const fetchAIResponse = async (chatHistory: typeof messages) => {
    if (!conversationId) return;
    setIsTyping(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: chatHistory,
          sapa_mode: isSapaMode,
        }
      });

      if (error) throw error;

      if (data && data.response) {
        addMessage(conversationId, 'assistant', data.response);
      }
    } catch (e: any) {
      console.error(e);
      addMessage(conversationId, 'assistant', "Sorry, I'm having trouble connecting to the kitchen right now. Please try again.");
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversationId) return;
    
    addMessage(conversationId, 'user', text.trim());
    setInputText('');
    
    const updatedMessages = [
      ...messages,
      {
        id: Date.now().toString(),
        content: text.trim(),
        role: 'user' as const,
        created_at: new Date().toISOString()
      }
    ];

    fetchAIResponse(updatedMessages);
  };

  const handleBack = () => {
    router.replace('/assistant');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Sparkle size={20} color={colors.brand.primary} weight="fill" />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              ChowAI
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>culinary assistant</Text>
        </View>
        {isSapaMode ? (
          <View style={[styles.sapaBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.sapaBadgeText}>Sapa</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.keyboardView}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          automaticallyAdjustKeyboardInsets={true}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              animate={index >= initialMessageCount && index === messages.length - 1 && msg.role === 'assistant'} 
            />
          ))}
          {isTyping && (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={[styles.typingText, { color: colors.textMuted }]}>Chef is typing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputWrapper, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderSubtle }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Message Chef AI..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage(inputText)}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.brand.primary : colors.borderSubtle }]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <PaperPlaneRight size={20} color="#FFF" weight="fill" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
  },
  subtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 11,
    marginTop: -2,
  },
  sapaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sapaBadgeText: {
    fontFamily: 'Sora-Bold',
    fontSize: 10,
    color: '#FFF',
    textTransform: 'uppercase',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  typingText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 13,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 36,
    maxHeight: 120,
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
