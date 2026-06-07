import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  image?: string;
}

export interface Conversation {
  id: string;
  title: string;
  sapaMode: boolean;
  messages: Message[];
  created_at: string;
}

interface ChatState {
  userId: string | null;
  conversations: Conversation[];
  setUserId: (id: string | null) => Promise<void>;
  createConversation: (title: string, sapaMode: boolean, initialPrompt?: string, initialImage?: string) => string;
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => void;
  deleteConversation: (conversationId: string) => void;
}

// Each user gets their own AsyncStorage key
const storageKey = (userId: string) => `chowbase-chat-${userId}`;

const saveConversations = async (userId: string, conversations: Conversation[]) => {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(conversations));
  } catch (_) {}
};

const loadConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

export const useChatStore = create<ChatState>()((set, get) => ({
  userId: null,
  conversations: [],

  setUserId: async (id) => {
    const currentId = get().userId;
    const currentConversations = get().conversations;

    // If switching away from a user, save their conversations first
    // but ONLY if there's actually data to save (guard against double-call wiping)
    if (currentId && currentId !== id && currentConversations.length > 0) {
      await saveConversations(currentId, currentConversations);
    }

    if (id) {
      // Load conversations for the incoming user
      const conversations = await loadConversations(id);
      set({ userId: id, conversations });
    } else {
      // Logging out — just clear from memory, data is already persisted per-user
      set({ userId: null, conversations: [] });
    }
  },

  createConversation: (title, sapaMode, initialPrompt, initialImage) => {
    const id = uuidv4();
    const messages: Message[] = [
      {
        id: '0',
        content: `Hello! I'm ChowBase AI. ${sapaMode ? "I see we are cooking on a budget today!" : "What are we cooking today?"}`,
        role: 'assistant',
        created_at: new Date().toISOString(),
      },
    ];

    if (initialPrompt || initialImage) {
      messages.push({
        id: uuidv4(),
        content: initialPrompt || '',
        role: 'user',
        image: initialImage,
        created_at: new Date().toISOString(),
      });
    }

    const newConversation: Conversation = {
      id,
      title: title || initialPrompt || 'New Conversation',
      sapaMode,
      messages,
      created_at: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newConversation, ...state.conversations];
      if (state.userId) saveConversations(state.userId, updated);
      return { conversations: updated };
    });

    return id;
  },

  addMessage: (conversationId, role, content) => {
    set((state) => {
      const updated = state.conversations.map((conn) => {
        if (conn.id === conversationId) {
          const updatedMessages = [
            ...conn.messages,
            { id: uuidv4(), content, role, created_at: new Date().toISOString() },
          ];
          let title = conn.title;
          if (title === 'New Conversation' && role === 'user') {
            title = content.length > 30 ? content.slice(0, 30) + '...' : content;
          }
          return { ...conn, title, messages: updatedMessages };
        }
        return conn;
      });
      if (state.userId) saveConversations(state.userId, updated);
      return { conversations: updated };
    });
  },

  deleteConversation: (conversationId) => {
    set((state) => {
      const updated = state.conversations.filter((conn) => conn.id !== conversationId);
      if (state.userId) saveConversations(state.userId, updated);
      return { conversations: updated };
    });
  },
}));
