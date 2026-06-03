import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeColors } from '../../constants/theme';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Animated, Easing, View } from 'react-native';
import { Vault, ShoppingCart, Sparkle, ForkKnife } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';

const AnimatedDiamondTabIcon = ({ focused, colors }: { focused: boolean, colors: any }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(focused ? 1 : 0.5)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: focused ? 1.2 : 0.8,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(pulseValue, {
          toValue: focused ? 0.8 : 0.4,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    );
    pulseAnim.start();

    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.linear
      })
    );
    spinAnim.start();

    return () => {
      pulseAnim.stop();
      spinAnim.stop();
    };
  }, [focused]);

  const spin1 = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spin2 = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const spin3 = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '375deg'] });

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginTop: -30 }}>
      {/* Sparkling Stars Glow */}
      <Animated.View style={{ position: 'absolute', top: -10, left: -10, opacity: pulseValue, transform: [{ rotate: spin1 }, { scale: pulseValue }] }}>
        <Sparkle size={14} weight="fill" color={colors.brand.primary} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: 5, right: -15, opacity: pulseValue, transform: [{ rotate: spin2 }, { scale: pulseValue }] }}>
        <Sparkle size={10} weight="fill" color={colors.brand.primary} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', bottom: -5, left: -15, opacity: pulseValue, transform: [{ rotate: spin3 }, { scale: pulseValue }] }}>
        <Sparkle size={12} weight="fill" color={colors.brand.primary} />
      </Animated.View>

      {/* Main Diamond */}
      <View style={{
        width: 56,
        height: 56,
        backgroundColor: focused ? colors.brand.primary : colors.bgPrimary,
        borderRadius: 16,
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: focused ? 0 : 2,
        borderColor: colors.brand.primary,
        shadowColor: colors.brand.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: focused ? 1 : 0.6,
        shadowRadius: focused ? 24 : 12,
        elevation: 15,
      }}>
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Sparkle size={28} weight={focused ? 'fill' : 'regular'} color={focused ? "#FFFFFF" : colors.brand.primary} />
        </View>
      </View>
    </View>
  );
};

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarBackground: () => (
          <BlurView
            tint={colors.bgPrimary === '#FFFFFF' ? 'light' : 'dark'}
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <ForkKnife size={28} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="assistant/index"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ focused }) => (
            <AnimatedDiamondTabIcon focused={focused} colors={colors} />
          ),
        }}
      />

      <Tabs.Screen
        name="vault/index"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color, focused }) => (
            <Vault size={28} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="grocery/index"
        options={{
          title: 'Grocery',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingCart size={28} weight={focused ? 'fill' : 'regular'} color={color} />
          ),
        }}
      />

      {/* Hidden detail screens that shouldn't have a tab button */}
      <Tabs.Screen
        name="assistant/chat"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="assistant/scanner"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
