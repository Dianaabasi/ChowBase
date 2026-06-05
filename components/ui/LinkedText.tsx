import React from 'react';
import { Text, Linking, StyleProp, TextStyle } from 'react-native';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface LinkedTextProps {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  linkColor?: string;
}

/**
 * Renders text with any URLs highlighted as tappable hyperlinks.
 */
export function LinkedText({ text, textStyle, linkColor = '#3B82F6' }: LinkedTextProps) {
  const parts = text.split(URL_REGEX);

  return (
    <Text style={textStyle}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          return (
            <Text
              key={i}
              style={{ color: linkColor, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL(part).catch(() => {})}
            >
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}
