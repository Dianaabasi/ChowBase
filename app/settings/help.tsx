import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CaretLeft, CaretDown, CaretUp, EnvelopeSimple, TwitterLogo } from 'phosphor-react-native';
import { useThemeColors } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';

const FAQS = [
  { question: "How do I add a new recipe?", answer: "Go to the Vault screen and tap the '+' tab or 'Create Recipe' button to start creating a new recipe." },
  { question: "How can I edit my profile?", answer: "Navigate to Settings > Account & Profile, or tap 'Edit' on your own profile page." },
  { question: "Can I use ChowAI to modify recipes?", answer: "Yes! While viewing any recipe, tap 'Ask ChowAI' to ask for substitutions, scaling, or tips." },
  { question: "How does the Grocery List work?", answer: "When viewing a recipe, switch to the Ingredients tab and tap 'Add to Grocery List' to save the items for later." },
];

export default function HelpFaqScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:ahbeednoble007@gmail.com');
  };

  const handleTwitterSupport = () => {
    Linking.openURL('https://x.com/diana_ekpes');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Help & FAQs</Text>
        <View style={{ width: 32 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Frequently Asked Questions</Text>
        
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <GlassCard key={index} style={styles.faqCard}>
              <TouchableOpacity 
                style={styles.faqHeader} 
                onPress={() => setOpenIndex(isOpen ? null : index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.question, { color: colors.textPrimary }]}>{faq.question}</Text>
                {isOpen ? <CaretUp size={20} color={colors.textSecondary} /> : <CaretDown size={20} color={colors.textSecondary} />}
              </TouchableOpacity>
              {isOpen && (
                <Text style={[styles.answer, { color: colors.textSecondary }]}>{faq.answer}</Text>
              )}
            </GlassCard>
          );
        })}

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>Still need help?</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>Reach out to our support team directly.</Text>
          
          <TouchableOpacity style={[styles.contactRow, { borderBottomColor: colors.borderSubtle }]} onPress={handleEmailSupport}>
            <View style={[styles.iconBox, { backgroundColor: colors.bgSecondary }]}>
              <EnvelopeSimple size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.textPrimary }]}>Email Support</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>ahbeednoble007@gmail.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactRow, { borderBottomColor: colors.borderSubtle }]} onPress={handleTwitterSupport}>
            <View style={[styles.iconBox, { backgroundColor: colors.bgSecondary }]}>
              <TwitterLogo size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.textPrimary }]}>X (Twitter)</Text>
              <Text style={[styles.contactValue, { color: colors.textSecondary }]}>@diana_ekpes</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, width: 32 },
  title: { fontFamily: 'Sora-Bold', fontSize: 18 },
  content: { padding: 16, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  faqCard: {
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 15,
    flex: 1,
    marginRight: 16,
  },
  answer: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerTitle: {
    fontFamily: 'Sora-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  footerSubtitle: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  contactValue: {
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
});
