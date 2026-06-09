import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CONTACT_EMAILS } from '../../config/legal';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { colors } from '../../theme/colors';

const settingsBackground = require('../../../assets/main1.png');

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  email: string;
  showDivider?: boolean;
}

function ContactRow({ icon, title, description, email, showDivider }: RowProps) {
  const open = () => {
    Linking.openURL(`mailto:${email}`).catch(() => undefined);
  };

  return (
    <>
      <Pressable
        onPress={open}
        className="px-4 py-4 flex-row items-start active:bg-cream-50"
        accessibilityRole="button"
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3.5 mt-0.5"
          style={{ backgroundColor: colors.coral[50] }}
        >
          <Ionicons name={icon} size={20} color={colors.coral[500]} />
        </View>

        <View className="flex-1 pr-3">
          <Text className="text-ink-700 font-bold text-base">{title}</Text>
          <Text className="text-ink-400 text-sm mt-0.5 leading-5">{description}</Text>
          <View className="flex-row items-center mt-1.5">
            <Ionicons name="mail-outline" size={14} color={colors.coral[500]} />
            <Text className="text-coral-500 text-sm font-semibold ml-1.5">{email}</Text>
          </View>
        </View>

        <Ionicons name="open-outline" size={20} color={colors.ink[400]} />
      </Pressable>
      {showDivider ? <View className="h-px bg-cream-300 mx-4" /> : null}
    </>
  );
}

export function ContactScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const topPadding = useTopScreenPadding();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={settingsBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View className="px-5" style={{ paddingTop: topPadding }}>
          <Pressable
            onPress={() => nav.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300 mb-5"
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
          </Pressable>

          <Text className="text-ink-700 text-3xl font-bold">{t('settings.contact')}</Text>
          <Text className="text-ink-400 text-sm mt-2 leading-5 max-w-[320px]">
            {t('settings.contactPageSubtitle')}
          </Text>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            <ContactRow
              icon="information-circle-outline"
              title={t('settings.contactGeneral')}
              description={t('settings.contactGeneralDesc')}
              email={CONTACT_EMAILS.general}
              showDivider
            />
            <ContactRow
              icon="construct-outline"
              title={t('settings.contactSupport')}
              description={t('settings.contactSupportDesc')}
              email={CONTACT_EMAILS.support}
              showDivider={false}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  backgroundImage: { width: '100%', height: '100%' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  backButton: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
