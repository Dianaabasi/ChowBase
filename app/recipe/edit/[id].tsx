import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../constants/theme';
import { BlurHeader } from '../../../components/ui/BlurHeader';
import { RecipeForm } from '../../../components/recipe/RecipeForm';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useModalStore } from '../../../stores/modalStore';
import { Recipe } from '../../../types';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*, recipe_ingredients:ingredients(*), recipe_steps(*)')
          .eq('id', id)
          .single();
        if (error) throw error;
        setRecipe(data as Recipe);
      } catch (e: any) {
        console.error(e);
        useModalStore.getState().showAlert({
          title: 'Error',
          message: 'Failed to load recipe details.',
          onConfirm: () => router.back()
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchRecipe();
  }, [id]);

  const handleSubmit = async (data: Partial<Recipe>) => {
    if (!user || !id) return;
    setIsSubmitting(true);
    
    try {
      const { recipe_ingredients, recipe_steps, ...recipeData } = data;
      
      const { error } = await supabase
        .from('recipes')
        .update({
          ...recipeData,
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update ingredients by replacing them
      if (recipe_ingredients) {
        await supabase.from('ingredients').delete().eq('recipe_id', id);
        if (recipe_ingredients.length > 0) {
          await supabase.from('ingredients').insert(
            recipe_ingredients.map((ing) => ({
              ...ing,
              recipe_id: id
            }))
          );
        }
      }

      // Update steps by replacing them
      if (recipe_steps) {
        await supabase.from('recipe_steps').delete().eq('recipe_id', id);
        if (recipe_steps.length > 0) {
          await supabase.from('recipe_steps').insert(
            recipe_steps.map((step) => ({
              ...step,
              recipe_id: id
            }))
          );
        }
      }

      if (error) throw error;
      
      useModalStore.getState().showAlert({
        title: 'Success',
        message: 'Recipe updated successfully!',
        onConfirm: () => {
          queryClient.invalidateQueries({ queryKey: ['recipe', id] });
          queryClient.invalidateQueries({ queryKey: ['recipes'] }); // Invalidate feeds/vaults too
          router.replace(`/recipe/${id}`);
        }
      });
    } catch (e: any) {
      console.error(e);
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message || 'Failed to update recipe.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textPrimary }}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={{ flex: 1 }}>
        <RecipeForm initialData={recipe} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
