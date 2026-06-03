import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../../../hooks/useRecipes';
import { useThemeColors } from '../../../constants/theme';
import { RecipeCard } from '../../../components/feed/RecipeCard';
import { CarouselCard } from '../../../components/feed/CarouselCard';
import { VideoCard } from '../../../components/feed/VideoCard';
import { Image } from 'expo-image';
import { TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Bell, Gear, MagnifyingGlass } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { CategoryPill } from '../../../components/ui/CategoryPill';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');
  
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = useRecipes(activeCategory, feedFilter, user?.id);

  const [categories, setCategories] = useState<string[]>(['All', 'Nigerian Soups', 'Rice Dishes', 'Snacks & Pastries', 'Vegan / Plant-Based', 'Meat Lovers', 'Healthy & Diet']);

  useEffect(() => {
    supabase.from('recipe_categories').select('name').order('name').then(({ data }) => {
      if (data && data.length > 0) {
        setCategories(['All', ...data.map(d => d.name)]);
      }
    });
  }, []);

  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recipes = data?.pages.flat() || [];

  const renderItem = ({ item }: any) => {
    if (item.card_type === 'video' && item.video_url) {
      return <VideoCard recipe={item} isVisible={true} />;
    } else if (item.card_type === 'carousel' && item.recipe_steps?.length > 0) {
      return <CarouselCard recipe={item} />;
    } else {
      return <RecipeCard recipe={item} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { paddingTop: insets.top || 16, flexDirection: 'row', alignItems: 'center' }]}>
        <Image 
          source={require('../../../assets/chowbase_header_logo.svg')} 
          style={styles.logo} 
          contentFit="contain" 
        />
        <View style={[styles.headerRight, { position: 'absolute', right: 16, top: insets.top || 16, height: 100 }]}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
            <Bell size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconButton}>
            <Gear size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          <MagnifyingGlass size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search recipes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, feedFilter === 'all' && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary }]} 
          onPress={() => setFeedFilter('all')}
        >
          <Text style={[styles.filterText, feedFilter === 'all' ? { color: '#FFF' } : { color: colors.textSecondary }]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, feedFilter === 'following' && { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary }]} 
          onPress={() => setFeedFilter('following')}
        >
          <Text style={[styles.filterText, feedFilter === 'following' ? { color: '#FFF' } : { color: colors.textSecondary }]}>Following</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              title={cat}
              isSelected={cat === 'All' ? activeCategory === undefined : activeCategory === cat}
              onPress={() => setActiveCategory(cat === 'All' ? undefined : cat)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
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
              <Text style={{ color: colors.textSecondary }}>No recipes found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  logo: {
    height: 100,
    width: 380,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
});
