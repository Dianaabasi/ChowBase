import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity, Switch, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../../hooks/useRecipes';
import { useThemeColors } from '../../../constants/theme';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { RecipeCard } from '../../../components/feed/RecipeCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { DotsThree, Plus, PencilSimple, Trash } from 'phosphor-react-native';
import { useAuthStore } from '../../../stores/authStore';
import { useModalStore } from '../../../stores/modalStore';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

export default function VaultScreen() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [sapaMode, setSapaMode] = useState(false);
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = useRecipes(activeCategory);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [actionRecipe, setActionRecipe] = useState<any>(null);

  const [categories, setCategories] = useState<string[]>(['All', 'Nigerian Soups', 'Rice Dishes', 'Snacks & Pastries', 'Vegan / Plant-Based', 'Meat Lovers', 'Healthy & Diet']);

  useEffect(() => {
    supabase.from('recipe_categories').select('name').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setCategories(['All', ...data.map(d => d.name)]);
      }
    });
  }, []);
  
  // Flatten and filter for Sapa Mode if active
  let recipes = data?.pages.flat() || [];
  if (sapaMode) {
    recipes = recipes.filter(r => r.sapa_mode);
  }

  const renderGridItem = ({ item }: any) => {
    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        onPress={() => router.push(`/recipe/${item.id}`)}
        activeOpacity={0.9}
      >
        <Image 
          source={item.image_url} 
          style={styles.gridImage} 
          contentFit="cover" 
        />
        <View style={[styles.gridContent, { backgroundColor: colors.bgSecondary }]}>
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.gridMetaRow}>
            <Text style={[styles.gridMeta, { color: colors.textSecondary }]}>
              {item.kcal} kcal • {item.prep_time_mins + item.cook_time_mins}m
            </Text>
            {user?.id === item.author_id && (
              <TouchableOpacity 
                style={styles.dotsBtn} 
                onPress={() => setActionRecipe(item)}
              >
                <DotsThree size={20} color={colors.textSecondary} weight="bold" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader 
        hideBack 
        title="Recipe Vault" 
        titleColor={colors.brand.primary} 
        extraPaddingTop={16}
        extraPaddingBottom={8}
      />

      <View style={[styles.controls, { paddingTop: insets.top + 90, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.sapaToggleRow}>
          <View>
            <Text style={[styles.sapaTitle, { color: colors.textPrimary }]}>Sapa Mode</Text>
            <Text style={[styles.sapaDesc, { color: colors.textSecondary }]}>Budget-friendly recipes only</Text>
          </View>
          <Switch 
            value={sapaMode} 
            onValueChange={setSapaMode} 
            trackColor={{ false: colors.borderSubtle, true: colors.brand.primary }}
          />
        </View>

        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item: cat }) => {
            const isSelected = cat === 'All' ? activeCategory === undefined : activeCategory === cat;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(cat === 'All' ? undefined : cat)}
                style={[
                  styles.catPill,
                  { 
                    backgroundColor: isSelected ? colors.brand.primary : colors.bgSecondary,
                    borderColor: isSelected ? colors.brand.primary : colors.borderSubtle,
                  }
                ]}
              >
                <Text style={[styles.catText, { color: isSelected ? '#FFF' : colors.textPrimary }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={recipes}
        keyExtractor={item => item.id}
        renderItem={renderGridItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.textSecondary }}>
                {sapaMode ? 'No budget-friendly recipes found for this category.' : 'No recipes found.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.brand.primary, bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/recipe/create')}
        activeOpacity={0.9}
      >
        <Plus size={24} color="#FFF" weight="bold" />
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal visible={!!actionRecipe} transparent animationType="fade" onRequestClose={() => setActionRecipe(null)}>
        <TouchableWithoutFeedback onPress={() => setActionRecipe(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.actionModal, { backgroundColor: colors.bgPrimary }]}>
                <View style={styles.actionModalHeader}>
                  <Text style={[styles.actionModalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {actionRecipe?.title}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.actionRow}
                  onPress={() => {
                    router.push(`/recipe/edit/${actionRecipe?.id}`);
                    setActionRecipe(null);
                  }}
                >
                  <PencilSimple size={22} color={colors.textPrimary} />
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>Edit Recipe</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    const idToDelete = actionRecipe?.id;
                    setActionRecipe(null);
                    useModalStore.getState().showAlert({
                      title: 'Delete Recipe',
                      message: 'Are you sure you want to delete this recipe? This cannot be undone.',
                      confirmText: 'Delete',
                      cancelText: 'Cancel',
                      showCancel: true,
                      isDestructive: true,
                      onConfirm: async () => {
                        await supabase.from('recipes').delete().eq('id', idToDelete);
                        refetch();
                      }
                    });
                  }}
                >
                  <Trash size={22} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Delete Recipe</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sapaToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sapaTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  sapaDesc: {
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: (width - 48) / 2, // 2 columns, 16px padding on sides + 16px gap
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: (width - 48) / 2,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  gridMeta: {
    fontFamily: 'DM-Sans',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  gridMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dotsBtn: {
    padding: 4,
    marginRight: -4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  actionModalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 16,
    marginBottom: 8,
  },
  actionModalTitle: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  actionText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 16,
  },
});
