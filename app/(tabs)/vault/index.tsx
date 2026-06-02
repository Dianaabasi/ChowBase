import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../../hooks/useRecipes';
import { useThemeColors } from '../../../constants/theme';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { RecipeCard } from '../../../components/feed/RecipeCard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function VaultScreen() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [sapaMode, setSapaMode] = useState(false);
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = useRecipes(activeCategory);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const categories = ['All', 'Nigerian Soups', 'Rice Dishes', 'Snacks & Pastries', 'Vegan / Plant-Based', 'Meat Lovers', 'Healthy & Diet'];
  
  // Flatten and filter for Sapa Mode if active
  let recipes = data?.pages.flat() || [];
  if (sapaMode) {
    recipes = recipes.filter(r => r.sapa_mode);
  }

  const renderGridItem = ({ item }: any) => {
    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        onPress={() => router.push(`/vault/${item.id}`)}
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
          <Text style={[styles.gridMeta, { color: colors.textSecondary }]}>
            {item.kcal} kcal • {item.prep_time_mins + item.cook_time_mins}m
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <BlurHeader title="Recipe Vault" />

      <View style={[styles.controls, { paddingTop: insets.top + 60, borderBottomColor: colors.borderSubtle }]}>
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
});
