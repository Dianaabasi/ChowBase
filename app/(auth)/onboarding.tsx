import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GreenButton } from '../../components/ui/GreenButton';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const onboardingScreens = [
  {
    id: 1,
    headline: "Discover Nigerian Recipes",
    body: "From Egusi Soup to Jollof Rice — thousands of authentic recipes, video tutorials, and step-by-step Cook Mode guides, all in one place.",
    button: "Get Started",
    image: require('../../assets/onboarding/onboarding_screen_1.svg'),
  },
  {
    id: 2,
    headline: "Your Personal Chef AI",
    body: "Ask anything about Nigerian cuisine — get instant recipe ideas, cooking tips, and ingredient advice. In English, or Pidgin. We understand both.",
    button: "Next",
    image: require('../../assets/onboarding/onboarding_screen_2.svg'),
  },
  {
    id: 3,
    headline: "Cook Well on Any Budget",
    body: "Sapa Mode finds affordable substitutes for pricey ingredients without killing the taste. Because good food shouldn't break the bank.",
    button: "Next",
    image: require('../../assets/onboarding/onboarding_screen_3.svg'),
  },
  {
    id: 4,
    headline: "Shop Like a Pro",
    body: "Your ingredients auto-organize by market section — Proteins, Vegetables, Spices. No more running back and forth. Works offline in the market too.",
    button: "Let's Cook 🍳",
    image: require('../../assets/onboarding/onboarding_screen_4.svg'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex < onboardingScreens.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = e.nativeEvent.layoutMeasurement.width;
    const index = e.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== currentIndex && roundIndex >= 0 && roundIndex < onboardingScreens.length) {
      setCurrentIndex(roundIndex);
    }
  };

  const renderItem = ({ item }: { item: typeof onboardingScreens[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} contentFit="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>{item.headline}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{item.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {currentIndex < onboardingScreens.length - 1 && (
        <TouchableOpacity 
          style={[styles.skipButton, { top: insets.top + 16 }]} 
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={onboardingScreens}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
      
      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.pagination}>
          {onboardingScreens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentIndex ? colors.brand.primary : colors.borderSubtle },
                index === currentIndex && { width: 24 }
              ]}
            />
          ))}
        </View>
        
        <GreenButton 
          title={onboardingScreens[currentIndex].button} 
          onPress={handleNext} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: {
    flex: 0.55,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    flex: 0.45,
    alignItems: 'center',
    paddingTop: 20,
  },
  headline: {
    fontFamily: 'Sora-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontFamily: 'DM-Sans',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 30,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
