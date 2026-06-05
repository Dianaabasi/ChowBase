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
import { Skeleton } from '../../../components/ui/Skeleton';

function EditRecipeSkeleton() {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 }}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={120} height={20} borderRadius={4} />
        <Skeleton width={80} height={36} borderRadius={18} />
      </View>
      
      {/* Media Pickers */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
        <Skeleton width="48%" height={120} borderRadius={12} />
        <Skeleton width="48%" height={120} borderRadius={12} />
      </View>
      
      {/* Inputs */}
      <Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: 16 }} />
      
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
        <Skeleton width="48%" height={56} borderRadius={12} />
        <Skeleton width="48%" height={56} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
        <Skeleton width="48%" height={56} borderRadius={12} />
        <Skeleton width="48%" height={56} borderRadius={12} />
      </View>
    </View>
  );
}
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
        const { error: delError } = await supabase.from('ingredients').delete().eq('recipe_id', id);
        if (delError) console.error('Delete ingredients error:', delError);
        
        if (recipe_ingredients.length > 0) {
          const { error: insertError } = await supabase.from('ingredients').insert(
            recipe_ingredients.map((ing) => {
              const { id: _ingId, created_at: _createdAt, ...rest } = ing as any; // Remove old id and created_at
              return {
                ...rest,
                recipe_id: id
              };
            })
          );
          if (insertError) {
            console.error('Insert ingredients error:', insertError);
            throw insertError;
          }
        }
      }

      // Update steps by replacing them
      if (recipe_steps) {
        const { error: delStepError } = await supabase.from('recipe_steps').delete().eq('recipe_id', id);
        if (delStepError) console.error('Delete steps error:', delStepError);
        
        if (recipe_steps.length > 0) {
          const { error: insertStepError } = await supabase.from('recipe_steps').insert(
            recipe_steps.map((step) => {
              const { id: _stepId, created_at: _createdAt, ...rest } = step as any;
              return {
                ...rest,
                recipe_id: id
              };
            })
          );
          if (insertStepError) {
            console.error('Insert steps error:', insertStepError);
            throw insertStepError;
          }
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
    return <EditRecipeSkeleton />;
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
