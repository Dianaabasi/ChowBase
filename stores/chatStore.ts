import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  sapaMode: boolean;
  messages: Message[];
  created_at: string;
}

interface ChatState {
  conversations: Conversation[];
  createConversation: (title: string, sapaMode: boolean, initialPrompt?: string) => string;
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => void;
  deleteConversation: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],

      createConversation: (title, sapaMode, initialPrompt) => {
        const id = uuidv4();
        const messages: Message[] = [
          {
            id: '0',
            content: `Hello! I'm ChowBase AI. ${sapaMode ? "I see we are cooking on a budget today!" : "What are we cooking today?"}`,
            role: 'assistant',
            created_at: new Date().toISOString()
          }
        ];

        if (initialPrompt) {
          messages.push({
            id: uuidv4(),
            content: initialPrompt,
            role: 'user',
            created_at: new Date().toISOString()
          });
        }

        const newConversation: Conversation = {
          id,
          title: title || initialPrompt || "New Conversation",
          sapaMode,
          messages,
          created_at: new Date().toISOString()
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations]
        }));

        return id;
      },

      addMessage: (conversationId, role, content) => {
        set((state) => ({
          conversations: state.conversations.map(conn => {
            if (conn.id === conversationId) {
              const updatedMessages = [
                ...conn.messages,
                {
                  id: uuidv4(),
                  content,
                  role,
                  created_at: new Date().toISOString()
                }
              ];
              let title = conn.title;
              if (title === "New Conversation" && role === 'user') {
                title = content.length > 30 ? content.slice(0, 30) + "..." : content;
              }
              return {
                ...conn,
                title,
                messages: updatedMessages
              };
            }
            return conn;
          })
        }));
      },

      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter(conn => conn.id !== conversationId)
        }));
      }
    }),
    {
      name: 'chowbase-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
