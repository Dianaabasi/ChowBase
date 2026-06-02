import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkle, Camera, PaperPlaneRight, Lightbulb, Clock, CurrencyDollar, ArrowRight, Trash } from 'phosphor-react-native';
import { useThemeColors } from '../../../constants/theme';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useChatStore } from '../../../stores/chatStore';
import { Image } from 'expo-image';
import { Swipeable } from 'react-native-gesture-handler';
import { useModalStore } from '../../../stores/modalStore';

export default function AssistantHubScreen() {
  const [prompt, setPrompt] = useState('');
  const [sapaMode, setSapaMode] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  const createConversation = useChatStore((state) => state.createConversation);
  const conversations = useChatStore((state) => state.conversations);
  const deleteConversation = useChatStore((state) => state.deleteConversation);

  const handleDelete = (id: string) => {
    useModalStore.getState().showAlert({
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation?',
      confirmText: 'Yes, Delete',
      cancelText: 'No',
      showCancel: true,
      isDestructive: true,
      onConfirm: () => deleteConversation(id)
    });
  };

  const handleSend = (text?: string) => {
    const finalPrompt = text || prompt;
    if (!finalPrompt.trim()) return;
    
    const conversationId = createConversation(
      finalPrompt,
      sapaMode,
      finalPrompt
    );
    
    setPrompt('');
    
    router.push({
      pathname: '/assistant/chat',
      params: { conversationId }
    });
  };

  const quickPrompts = [
    { id: '0', title: 'Recipe Ideas', desc: 'What to cook today?', icon: Lightbulb },
    { id: '1', title: 'Meal Plan', desc: 'Plan my meals for the week', icon: Clock },
    { id: '2', title: 'Substitute', desc: 'Find ingredients swap', icon: Lightbulb },
    { id: '3', title: 'Budget', desc: 'Cook with ₦2000', icon: CurrencyDollar },
  ];

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <BlurHeader 
        hideBack 
        titleComponent={
          <Image 
            source={require('../../../assets/chowbase_ai_header_logo.svg')} 
            style={{ width: 420, height: 60 }} 
            contentFit="contain" 
          />
        } 
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: 120 }]}>
        <View style={styles.header}>
          <Sparkle size={48} color={colors.brand.primary} weight="fill" style={styles.headerIcon} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>How can I help you cook today?</Text>
        </View>

        {/* Ask me anything chat entry immediately below the title */}
        <View style={[styles.inlineInputContainer, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Ask anything..."
            placeholderTextColor={colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: prompt.trim() ? colors.brand.primary : colors.borderSubtle }]}
            onPress={() => handleSend()}
            disabled={!prompt.trim()}
          >
            <PaperPlaneRight size={20} color="#FFF" weight="fill" />
          </TouchableOpacity>
        </View>

        <View style={styles.sapaToggleRow}>
          <View>
            <Text style={[styles.sapaTitle, { color: colors.textPrimary }]}>Sapa Mode</Text>
            <Text style={[styles.sapaDesc, { color: colors.textSecondary }]}>Keep recommendations extremely budget-friendly</Text>
          </View>
          <Switch 
            value={sapaMode} 
            onValueChange={setSapaMode} 
            trackColor={{ false: colors.borderSubtle, true: colors.brand.primary }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Prompts</Text>
        <View style={styles.quickPromptsGrid}>
          {quickPrompts.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.quickPromptCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
              onPress={() => handleSend(item.desc)}
            >
              <item.icon size={24} color={colors.brand.primary} />
              <Text style={[styles.qpTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.qpDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={styles.scannerCard}>
          <View style={styles.scannerInfo}>
            <Text style={[styles.scannerTitle, { color: colors.textPrimary }]}>Pantry Vision</Text>
            <Text style={[styles.scannerDesc, { color: colors.textSecondary }]}>Scan food to get ingredients and recipe ideas</Text>
          </View>
          <TouchableOpacity 
            style={[styles.cameraBtn, { backgroundColor: colors.brand.primary }]}
            onPress={() => router.push('/assistant/scanner')}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Camera size={24} color="#FFF" />
            </Animated.View>
          </TouchableOpacity>
        </GlassCard>

        {/* History section below Pantry Vision */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>History</Text>
        {conversations.length === 0 ? (
          <View style={[styles.historyEmpty, { borderColor: colors.borderSubtle }]}>
            <Text style={[styles.historyEmptyText, { color: colors.textMuted }]}>Your previous chats will appear here.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {conversations.map((conn) => (
              <Swipeable
                key={conn.id}
                renderRightActions={() => (
                  <TouchableOpacity 
                    style={[styles.deleteSwipeBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleDelete(conn.id)}
                  >
                    <Trash size={24} color="#FFF" />
                  </TouchableOpacity>
                )}
                containerStyle={{ overflow: 'visible' }}
              >
                <TouchableOpacity 
                  style={[styles.historyCard, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push({
                    pathname: '/assistant/chat',
                    params: { conversationId: conn.id }
                  })}
                >
                  <View style={styles.historyInfo}>
                    <View style={styles.historyTitleRow}>
                      <Text style={[styles.historyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {conn.title}
                      </Text>
                      {conn.sapaMode && (
                        <View style={[styles.sapaBadge, { backgroundColor: colors.warning }]}>
                          <Text style={styles.sapaBadgeText}>Sapa</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {new Date(conn.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </Swipeable>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  headerIcon: { marginBottom: 16 },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  sapaToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 24,
  },
  sapaTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  sapaDesc: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
    maxWidth: '80%',
  },
  sectionTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickPromptCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  qpTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 4,
  },
  qpDesc: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  scannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 32,
  },
  scannerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  scannerTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  scannerDesc: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  cameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  historyEmptyText: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  historyList: {
    gap: 12,
    marginBottom: 32,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  historyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  historyTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
    flexShrink: 1,
  },
  historyDate: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
  },
  sapaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sapaBadgeText: {
    fontFamily: 'Sora-Bold',
    fontSize: 9,
    color: '#FFF',
    textTransform: 'uppercase',
  },
  deleteSwipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginLeft: 8,
  },
});
