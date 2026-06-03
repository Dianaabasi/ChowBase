import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, CircleIcon, Plus, Trash } from 'phosphor-react-native';
import { useThemeColors } from '../../../constants/theme';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { useGroceryStore, GroceryItem } from '../../../stores/groceryStore';
import { Swipeable } from 'react-native-gesture-handler';
import { useModalStore } from '../../../stores/modalStore';

export default function GroceryScreen() {
  const { items, addItem, toggleItem, removeItem, clearAll } = useGroceryStore();
  const [newItemName, setNewItemName] = useState('');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    addItem({
      name: newItemName.trim(),
      amount: 1,
      unit: 'pcs',
      market_section: 'General',
    });
    setNewItemName('');
  };

  const sections = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      const section = item.market_section || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

    return Object.keys(grouped).map(title => ({
      title,
      data: grouped[title]
    }));
  }, [items]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <BlurHeader 
        hideBack
        title="Grocery List" 
        titleColor={colors.brand.primary}
        extraPaddingTop={16}
        extraPaddingBottom={8}
        rightComponent={
          <TouchableOpacity onPress={() => {
            useModalStore.getState().showAlert({
              title: 'Clear Grocery List',
              message: 'Are you sure you want to clear your entire grocery list? This action cannot be undone.',
              confirmText: 'Clear All',
              cancelText: 'Cancel',
              showCancel: true,
              isDestructive: true,
              onConfirm: clearAll
            });
          }}>
            <Text style={{ color: colors.brand.primary, fontFamily: 'Sora-SemiBold' }}>Clear All</Text>
          </TouchableOpacity>
        } 
      />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 90 }]}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.bgPrimary }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <TouchableOpacity 
                style={[styles.deleteSwipeBtn, { backgroundColor: colors.error }]}
                onPress={() => removeItem(item.id)}
              >
                <Trash size={24} color="#FFF" />
              </TouchableOpacity>
            )}
            containerStyle={{ overflow: 'visible' }}
          >
            <View style={[styles.itemRow, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
              <TouchableOpacity style={styles.checkBtn} onPress={() => toggleItem(item.id)}>
                {item.is_checked ? (
                  <CheckCircle size={24} color={colors.success} weight="fill" />
                ) : (
                  <CircleIcon size={24} color={colors.textMuted} />
                )}
              </TouchableOpacity>
              
              <View style={styles.itemInfo}>
                <Text style={[
                  styles.itemName, 
                  { color: item.is_checked ? colors.textMuted : colors.textPrimary },
                  item.is_checked && styles.textStrikethrough
                ]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemAmount, { color: colors.textSecondary }]}>
                  {item.amount} {item.unit}
                </Text>
              </View>
            </View>
          </Swipeable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Your grocery list is empty.</Text>
          </View>
        }
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderSubtle, paddingBottom: insets.bottom || 24 }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Add an item..."
            placeholderTextColor={colors.textMuted}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: newItemName.trim() ? colors.brand.primary : colors.borderSubtle }]}
            onPress={handleAdd}
            disabled={!newItemName.trim()}
          >
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkBtn: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
  },
  itemAmount: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  deleteSwipeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    marginBottom: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
