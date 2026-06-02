import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  market_section: string;
  is_checked: boolean;
}

interface GroceryState {
  items: GroceryItem[];
  addItem: (item: Omit<GroceryItem, 'id' | 'is_checked'>) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set) => ({
      items: [],
      
      addItem: (item) => set((state) => ({
        items: [
          ...state.items,
          { ...item, id: uuidv4(), is_checked: false }
        ]
      })),
      
      toggleItem: (id) => set((state) => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, is_checked: !item.is_checked } : item
        )
      })),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      
      clearCompleted: () => set((state) => ({
        items: state.items.filter(item => !item.is_checked)
      })),
    }),
    {
      name: 'chowbase-grocery-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
