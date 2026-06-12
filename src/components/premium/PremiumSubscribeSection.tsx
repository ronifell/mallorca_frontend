import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { LEGAL_LINKS } from '../../config/legal';
import { LegalCheckbox } from '../auth/LegalCheckbox';
import { colors } from '../../theme/colors';

interface Props {
  onSubscribe: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const GOOGLE_PLAY_SUBS_URL = 'https://play.google.com/store/account/subscriptions';

export function PremiumSubscribeSection({ onSubscribe, loading, disabled }: Props) {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const legalAccepted = termsAccepted && privacyAccepted;
  const isBlocked = loading || disabled || !legalAccepted;

  const onRestore = () => {
    Alert.alert(t('premium.restore'), t('premium.restoreComingSoon'));
  };

  const onManage = () => {
    Linking.openURL(GOOGLE_PLAY_SUBS_URL).catch(() => undefined);
  };

  return (
    <View className="mt-2">
      {/* Legal consent checkboxes — required by Google Play before purchase */}
      <View className="mb-4 px-1">
        <LegalCheckbox
          checked={termsAccepted}
          onToggle={() => setTermsAccepted((v) => !v)}
          intro={t('premium.acceptTermsIntro')}
          linkLabel={t('auth.termsOfService')}
          linkUrl={LEGAL_LINKS.terms}
          testID="premium-terms-checkbox"
        />
        <LegalCheckbox
          checked={privacyAccepted}
          onToggle={() => setPrivacyAccepted((v) => !v)}
          intro={t('premium.acceptPrivacyIntro')}
          linkLabel={t('auth.privacyPolicy')}
          linkUrl={LEGAL_LINKS.privacy}
          testID="premium-privacy-checkbox"
        />
      </View>

      <Pressable
        onPress={isBlocked ? undefined : onSubscribe}
        accessibilityRole="button"
        accessibilityLabel={t('premium.continue')}
        className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-full py-3.5 px-6 w-full ${
          disabled ? 'opacity-50' : !legalAccepted ? 'opacity-40' : ''
        } ${loading ? 'opacity-70' : ''}`}
        style={buttonShadow}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Ionicons name="ribbon" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-base">{t('premium.continue')}</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={colors.white}
              style={{ position: 'absolute', right: 20 }}
            />
          </>
        )}
      </Pressable>

      <View className="bg-cream-100 rounded-2xl px-4 py-3 mt-3 border border-cream-300">
        <View className="flex-row items-start mb-2">
          <Ionicons
            name="refresh-outline"
            size={16}
            color={colors.coral[500]}
            style={{ marginTop: 2, marginRight: 8 }}
          />
          <Text className="flex-1 text-ink-700 text-xs leading-5 font-semibold">
            {t('premium.autoRenewNotice')}
          </Text>
        </View>
        <View className="flex-row items-start">
          <Ionicons
            name="logo-google-playstore"
            size={16}
            color={colors.ink[700]}
            style={{ marginTop: 2, marginRight: 8 }}
          />
          <Text className="flex-1 text-ink-400 text-xs leading-5">
            {t('premium.managedByGooglePlay')}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-center mt-3">
        <Ionicons name="lock-closed-outline" size={13} color={colors.ink[400]} />
        <Text className="text-ink-400 text-xs ml-1.5">{t('premium.securePayment')}</Text>
      </View>

      <View className="flex-row items-center justify-center mt-2 gap-4">
        <Pressable onPress={onRestore} className="flex-row items-center py-1">
          <Text className="text-coral-500 font-semibold text-sm">{t('premium.restore')}</Text>
        </Pressable>
        <Pressable onPress={onManage} className="flex-row items-center py-1">
          <Text className="text-coral-500 font-semibold text-sm">Google Play</Text>
          <Ionicons name="open-outline" size={14} color={colors.coral[500]} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>
    </View>
  );
}

const buttonShadow = {
  shadowColor: colors.coral[600],
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.22,
  shadowRadius: 6,
  elevation: 3,
};
