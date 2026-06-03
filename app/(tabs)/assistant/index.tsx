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
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

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
      <View style={[styles.pinnedHeader, { paddingTop: insets.top + 16 }]}>
        <Image 
          source={require('../../../assets/chowbase_ai_header_logo.svg')} 
          style={styles.headerLogo} 
          contentFit="contain" 
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>How can I help you cook today?</Text>

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
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        <View style={styles.sapaToggleRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
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
            style={[styles.cameraBtn, { backgroundColor: colors.brand.primary, overflow: 'visible' }]}
            onPress={() => router.push('/assistant/scanner')}
            activeOpacity={0.8}
          >
            <Animated.View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: spin }] }}>
              <Sparkle size={14} color="#22C55E" weight="fill" style={{ position: 'absolute', top: -14, left: -14, opacity: 0.8 }} />
              <Sparkle size={18} color="#22C55E" weight="fill" style={{ position: 'absolute', bottom: -16, right: -16, opacity: 0.9 }} />
              <Sparkle size={10} color="#22C55E" weight="fill" style={{ position: 'absolute', top: -8, right: -18, opacity: 0.7 }} />
              <Sparkle size={12} color="#22C55E" weight="fill" style={{ position: 'absolute', bottom: -10, left: -18, opacity: 0.6 }} />
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Camera size={28} color="#FFF" weight="fill" />
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
  pinnedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  headerLogo: {
    width: '100%',
    height: 150,
    marginBottom: 0,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Sora-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: -12,
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
