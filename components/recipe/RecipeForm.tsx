import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useThemeColors } from '../../constants/theme';
import { Recipe, Ingredient, RecipeStep } from '../../types';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { ImageSquare, VideoCamera, Trash, Plus, CheckCircle, CaretLeft, CaretDown } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  onSubmit: (data: Partial<Recipe>) => Promise<void>;
  isSubmitting?: boolean;
}

export function RecipeForm({ initialData, onSubmit, isSubmitting }: RecipeFormProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [prepTime, setPrepTime] = useState(initialData?.prep_time_mins?.toString() || '');
  const [cookTime, setCookTime] = useState(initialData?.cook_time_mins?.toString() || '');
  const [kcal, setKcal] = useState(initialData?.kcal?.toString() || '');
  const [healthScore, setHealthScore] = useState(initialData?.healthy_score?.toString() || '');
  
  const [category, setCategory] = useState(initialData?.category || '');
  const [categories, setCategories] = useState<string[]>([
    'Nigerian Soups', 'Rice Dishes', 'Snacks & Pastries', 
    'Vegan / Plant-Based', 'Meat Lovers', 'Healthy & Diet'
  ]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('recipe_categories').select('name').order('name');
      if (data) {
        setCategories(data.map(d => d.name));
      }
    };
    fetchCategories();
  }, []);
  
  const [imageUri, setImageUri] = useState(initialData?.image_url || '');
  const [videoUri, setVideoUri] = useState(initialData?.video_url || '');
  
  const player = useVideoPlayer(videoUri || '', player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  
  const [ingredients, setIngredients] = useState<Partial<Ingredient>[]>(initialData?.recipe_ingredients || []);
  const [steps, setSteps] = useState<Partial<RecipeStep>[]>(initialData?.recipe_steps || []);

  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setVideoUri(''); // clear video
    }
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setImageUri(''); // clear image
    }
  };

  const uploadMedia = async () => {
    let finalImageUrl = initialData?.image_url || '';
    let finalVideoUrl = initialData?.video_url || '';

    // Upload Image to Supabase
    if (imageUri && imageUri !== initialData?.image_url) {
      const ext = imageUri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      
      const { data, error } = await supabase.storage.from('recipes').upload(fileName, decode(base64), { contentType: `image/${ext}` });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('recipes').getPublicUrl(fileName);
      finalImageUrl = publicUrl;
    }

    // Upload Video to Cloudinary
    if (videoUri && videoUri !== initialData?.video_url) {
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
      
      if (cloudName) {
        const formData = new FormData();
        formData.append('file', {
          uri: videoUri,
          type: 'video/mp4',
          name: 'upload.mp4',
        } as any);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.secure_url) {
          finalVideoUrl = data.secure_url;
        } else {
          throw new Error('Cloudinary upload failed: ' + JSON.stringify(data));
        }
      }
    }

    return { finalImageUrl, finalVideoUrl };
  };

  const handlePublish = async () => {
    try {
      setIsUploading(true);
      const { finalImageUrl, finalVideoUrl } = await uploadMedia();
      
      // Assign step numbers based on array order
      const orderedSteps = steps.map((s, index) => ({
        ...s,
        step_number: index + 1,
      }));

        let finalCategory = category || 'Uncategorized';
        if (isCustomMode && customCategory.trim()) {
          finalCategory = customCategory.trim();
          // Insert silently, ignore if exists
          await supabase.from('recipe_categories').insert({ name: finalCategory, is_default: false });
        }

        await onSubmit({
          title,
          description,
          prep_time_mins: parseInt(prepTime) || 0,
          cook_time_mins: parseInt(cookTime) || 0,
          kcal: parseInt(kcal) || 0,
          healthy_score: parseInt(healthScore) || 0,
          image_url: finalImageUrl,
          video_url: finalVideoUrl,
          recipe_ingredients: ingredients as Ingredient[],
          recipe_steps: orderedSteps as RecipeStep[],
          category: finalCategory,
          card_type: finalVideoUrl ? 'video' : 'standard',
          status: 'published',
        });
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top || 16, borderBottomColor: colors.borderSubtle, backgroundColor: colors.bgPrimary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <CaretLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {initialData ? 'Edit Recipe' : 'Create Recipe'}
        </Text>

        <TouchableOpacity 
          style={[styles.publishBtn, { backgroundColor: colors.brand.primary, opacity: (isSubmitting || isUploading || !title || (!imageUri && !videoUri)) ? 0.6 : 1 }]}
          onPress={handlePublish}
          disabled={isSubmitting || isUploading || !title || (!imageUri && !videoUri)}
        >
          {isSubmitting || isUploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <CheckCircle size={16} color="#FFF" weight="bold" />
              <Text style={styles.publishBtnText}>Publish</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.scrollContainer}>
        <KeyboardAwareScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          enableOnAndroid={true}
          extraHeight={120}
          extraScrollHeight={20}
        >
        
        {/* Recipe Media Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recipe Media</Text>
        <View style={styles.mediaRow}>
          {!videoUri && (
            <TouchableOpacity style={[styles.mediaBox, { borderColor: colors.borderSubtle }]} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.mediaPreview} contentFit="cover" />
              ) : (
                <>
                  <ImageSquare size={24} color={colors.textSecondary} />
                  <Text style={[styles.mediaText, { color: colors.textSecondary }]}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {!imageUri && (
            <TouchableOpacity style={[styles.mediaBox, { borderColor: colors.borderSubtle }]} onPress={pickVideo}>
              {videoUri ? (
                <VideoView player={player} style={styles.mediaPreview} contentFit="cover" nativeControls={false} />
              ) : (
                <>
                  <VideoCamera size={24} color={colors.textSecondary} />
                  <Text style={[styles.mediaText, { color: colors.textSecondary }]}>Add Video</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

      {/* Basic Info */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Info</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Recipe Title"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
      />

      {/* Category Selection */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>Category</Text>
      
      <TouchableOpacity 
        style={[styles.dropdownButton, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}
        onPress={() => setShowDropdown(!showDropdown)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownButtonText, { color: (isCustomMode && customCategory) || (!isCustomMode && category) ? colors.textPrimary : colors.textMuted }]}>
          {isCustomMode ? (customCategory || 'Custom Category') : (category || 'Select a Category')}
        </Text>
        <CaretDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {showDropdown && (
        <View style={[styles.dropdownList, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.dropdownItem, { borderBottomColor: colors.borderSubtle }]}
              onPress={() => {
                setCategory(cat);
                setIsCustomMode(false);
                setShowDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: !isCustomMode && category === cat ? colors.brand.primary : colors.textPrimary }]}>
                {cat}
              </Text>
              {!isCustomMode && category === cat && (
                <CheckCircle size={20} color={colors.brand.primary} weight="fill" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
            onPress={() => {
              setIsCustomMode(true);
              setShowDropdown(false);
            }}
          >
            <Text style={[styles.dropdownItemText, { color: isCustomMode ? colors.brand.primary : colors.textPrimary }]}>
              + Create Custom Category
            </Text>
            {isCustomMode && (
              <CheckCircle size={20} color={colors.brand.primary} weight="fill" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {isCustomMode && (
        <TextInput
          style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, marginTop: 12 }]}
          value={customCategory}
          onChangeText={setCustomCategory}
          placeholder="Enter custom category name..."
          placeholderTextColor={colors.textMuted}
        />
      )}

      {/* Nutrition & Time */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nutrition & Time</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex1, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
          value={kcal}
          onChangeText={setKcal}
          keyboardType="numeric"
          placeholder="Kcal"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={[styles.input, styles.flex1, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
          value={healthScore}
          onChangeText={setHealthScore}
          keyboardType="numeric"
          placeholder="Health Score (0-100)"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex1, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
          value={prepTime}
          onChangeText={setPrepTime}
          keyboardType="numeric"
          placeholder="Prep Mins"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={[styles.input, styles.flex1, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
          value={cookTime}
          onChangeText={setCookTime}
          keyboardType="numeric"
          placeholder="Cook Mins"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Ingredients */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Ingredients</Text>
        <TouchableOpacity onPress={() => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }])}>
          <Plus size={24} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>
      {ingredients.map((ing, idx) => (
        <View key={idx} style={[styles.dynamicRowCol, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.stepHeader}>
            <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>Ingredient {idx + 1}</Text>
            <TouchableOpacity onPress={() => setIngredients(ingredients.filter((_, i) => i !== idx))}>
              <Trash size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
            value={ing.name}
            onChangeText={(v) => { const newIngs = [...ingredients]; newIngs[idx].name = v; setIngredients(newIngs); }}
            placeholder="Name (e.g. Rice)"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
              value={ing.quantity?.toString() || ''}
              onChangeText={(v) => { const newIngs = [...ingredients]; newIngs[idx].quantity = v; setIngredients(newIngs); }}
              placeholder="Qty (e.g. 2)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.flex1, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
              value={ing.unit || ''}
              onChangeText={(v) => { const newIngs = [...ingredients]; newIngs[idx].unit = v; setIngredients(newIngs); }}
              placeholder="Unit (e.g. cups)"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
            value={ing.market_section || ''}
            onChangeText={(v) => { const newIngs = [...ingredients]; newIngs[idx].market_section = v; setIngredients(newIngs); }}
            placeholder="Market Section (e.g. Produce, Meat) Optional"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ))}

      {/* Cook Mode Steps */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Cook Mode Steps</Text>
        <TouchableOpacity onPress={() => setSteps([...steps, { instruction: '', timer_secs: null }])}>
          <Plus size={24} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>
      {steps.map((step, idx) => (
        <View key={idx} style={[styles.dynamicRowCol, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.stepHeader}>
            <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>Step {idx + 1}</Text>
            <TouchableOpacity onPress={() => setSteps(steps.filter((_, i) => i !== idx))}>
              <Trash size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
            value={step.instruction}
            onChangeText={(v) => { const newSteps = [...steps]; newSteps[idx].instruction = v; setSteps(newSteps); }}
            placeholder="Instruction..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
            value={step.timer_secs?.toString() || ''}
            onChangeText={(v) => { const newSteps = [...steps]; newSteps[idx].timer_secs = parseInt(v) || null; setSteps(newSteps); }}
            placeholder="Timer (Seconds) Optional"
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ))}

        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  publishBtnText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaBox: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mediaText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
  input: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  dynamicRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontFamily: 'DM-Sans-Medium',
    fontSize: 14,
  },
  dynamicRowCol: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontFamily: 'Sora-Bold',
    fontSize: 14,
  },
  trashBtn: {
    padding: 4,
  }
});
