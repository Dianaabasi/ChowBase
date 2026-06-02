import React, { useState } from 'react';
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

export default function FeedScreen() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } = useRecipes(activeCategory);

  const categories = ['All', 'Nigerian Soups', 'Rice Dishes', 'Snacks & Pastries', 'Vegan / Plant-Based', 'Meat Lovers', 'Healthy & Diet'];
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recipes = data?.pages.flat() || [];

  const renderItem = ({ item, index }: any) => {
    if (item.video_url) {
      return <VideoCard recipe={item} isVisible={true} />;
    } else if (index % 4 === 0 && item.recipe_steps?.length > 0) {
      return <CarouselCard recipe={item} />;
    } else {
      return <RecipeCard recipe={item} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={[styles.header, { paddingTop: insets.top || 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Image 
          source={require('../../../assets/chowbase_header_logo.svg')} 
          style={styles.logo} 
          contentFit="contain" 
        />
        <View style={styles.headerRight}>
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
    height: 96,
    width: 320,
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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
});
