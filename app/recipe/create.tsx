import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { RecipeForm } from '../../components/recipe/RecipeForm';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useModalStore } from '../../stores/modalStore';
import { Recipe } from '../../types';

export default function CreateRecipeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Partial<Recipe>) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { recipe_ingredients, recipe_steps, ...recipeData } = data;
      
      const { data: newRecipe, error } = await supabase
        .from('recipes')
        .insert({
          ...recipeData,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (recipe_ingredients && recipe_ingredients.length > 0) {
        await supabase.from('ingredients').insert(
          recipe_ingredients.map((ing) => ({
            ...ing,
            recipe_id: newRecipe.id
          }))
        );
      }

      if (recipe_steps && recipe_steps.length > 0) {
        await supabase.from('recipe_steps').insert(
          recipe_steps.map((step) => ({
            ...step,
            recipe_id: newRecipe.id
          }))
        );
      }

      if (error) throw error;
      
      useModalStore.getState().showAlert({
        title: 'Success',
        message: 'Recipe created successfully!',
        onConfirm: () => {
          router.replace(`/recipe/${newRecipe.id}`);
        }
      });
    } catch (e: any) {
      console.error(e);
      useModalStore.getState().showAlert({
        title: 'Error',
        message: e.message || 'Failed to create recipe.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={{ flex: 1 }}>
        <RecipeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
