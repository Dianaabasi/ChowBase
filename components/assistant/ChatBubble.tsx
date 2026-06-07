import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useThemeColors } from '../../constants/theme';
import Markdown from 'react-native-markdown-display';
import { Sparkle, Copy } from 'phosphor-react-native';
import { Image } from 'expo-image';
import { useModalStore } from '../../stores/modalStore';

interface ChatBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    image?: string;
  };
  animate?: boolean;
}

export function ChatBubble({ message, animate = false }: ChatBubbleProps) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const [displayedText, setDisplayedText] = React.useState(animate && !isUser ? '' : message.content);
  const [showCopy, setShowCopy] = React.useState(false);

  React.useEffect(() => {
    if (!animate || isUser) {
      setDisplayedText(message.content);
      return;
    }

    if (displayedText.length < message.content.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(message.content.substring(0, displayedText.length + 3));
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, animate, message.content, isUser]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(message.content);
    setShowCopy(false);
    useModalStore.getState().showAlert({
      title: "Copied!",
      message: "The message has been copied to your clipboard.",
      autoDismiss: true
    });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={[styles.iconContainer, { backgroundColor: colors.brand.primary }]}>
          <Sparkle size={16} color="#FFF" weight="fill" />
        </View>
      )}
      <TouchableOpacity 
        onLongPress={() => setShowCopy(!showCopy)}
        onPress={() => { if (showCopy) setShowCopy(false) }}
        activeOpacity={0.8}
        style={[
          styles.bubble, 
          isUser 
            ? [styles.userBubble, { backgroundColor: colors.brand.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]
        ]}
      >
        {isUser ? (
          <View>
            {message.image && (
              <Image 
                source={{ uri: message.image }} 
                style={styles.messageImage} 
                contentFit="cover" 
              />
            )}
            {message.content ? <Text style={styles.userText}>{message.content}</Text> : null}
          </View>
        ) : (
          <Markdown 
            style={{
              body: { color: colors.textPrimary, fontFamily: 'DM-Sans', fontSize: 16, lineHeight: 24 },
              strong: { fontFamily: 'DM-Sans-Bold', color: colors.textPrimary },
              em: { fontFamily: 'DM-Sans', fontStyle: 'italic' },
              list_item: { marginBottom: 8 },
              bullet_list: { marginTop: 8 },
              ordered_list: { marginTop: 8 },
            }}
          >
            {displayedText}
          </Markdown>
        )}
      </TouchableOpacity>
      
      {showCopy && (
        <TouchableOpacity 
          style={[styles.copyPopup, isUser ? styles.copyPopupUser : styles.copyPopupAssistant, { backgroundColor: colors.bgPrimary, borderColor: colors.borderSubtle }]}
          onPress={copyToClipboard}
        >
          <Copy size={14} color={colors.textPrimary} />
          <Text style={[styles.copyText, { color: colors.textPrimary }]}>Copy</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    flexShrink: 1,
  },
  userText: {
    color: '#FFF',
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 24,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  copyPopup: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  copyPopupUser: {
    right: 16,
  },
  copyPopupAssistant: {
    left: 48,
  },
  copyText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 12,
  },
});
