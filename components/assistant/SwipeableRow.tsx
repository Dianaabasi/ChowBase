import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export function SwipeableRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  }
});
