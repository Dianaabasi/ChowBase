import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { GreenButton } from '../../components/ui/GreenButton';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/chowbase_logo.svg')} 
          style={styles.logo} 
          contentFit="contain" 
        />
        <GreenButton 
          title="Get started" 
          onPress={() => router.push('/onboarding')} 
          style={{ width: 200, marginTop: 20, paddingVertical: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 600,
    height: 240,
  },
});
