import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { colors } from '../../theme/colors';

interface Props {
  visible: boolean;
  name: string | null;
  otherPhoto?: string | null;
  myPhoto?: string | null;
  myName?: string | null;
  onSendMessage: () => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  startX: number;
  endX: number;
  delay: number;
  color: string;
  size: number;
  duration: number;
}

const CONFETTI: ConfettiPiece[] = Array.from({ length: 24 }).map((_, i) => {
  const palette = [colors.coral[500], colors.coral[400], '#F5B301', '#4A90D9', '#2E8C66', '#A57BD9'];
  return {
    startX: ((i * 137) % SCREEN_WIDTH) - SCREEN_WIDTH / 2,
    endX: (((i + 7) * 211) % SCREEN_WIDTH) - SCREEN_WIDTH / 2,
    delay: (i % 8) * 80,
    color: palette[i % palette.length],
    size: 8 + (i % 4) * 2,
    duration: 2400 + (i % 5) * 220,
  };
});

function ConfettiLayer({ active }: { active: boolean }) {
  const progress = useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) {
      progress.forEach((v) => v.setValue(0));
      return;
    }
    const anims = CONFETTI.map((piece, idx) =>
      Animated.timing(progress[idx], {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    );
    Animated.stagger(40, anims).start();
  }, [active, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CONFETTI.map((piece, idx) => {
        const translateY = progress[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [-60, SCREEN_HEIGHT * 0.6],
        });
        const translateX = progress[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [piece.startX, piece.endX],
        });
        const rotate = progress[idx].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(idx % 2 === 0 ? 1 : -1) * 360}deg`],
        });
        const opacity = progress[idx].interpolate({
          inputRange: [0, 0.05, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={idx}
            style={{
              position: 'absolute',
              top: 0,
              left: SCREEN_WIDTH / 2,
              width: piece.size,
              height: piece.size * 0.45,
              borderRadius: 2,
              backgroundColor: piece.color,
              transform: [{ translateX }, { translateY }, { rotate }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Celebratory full-screen takeover shown when the user gets a new match.
 * Mirrors patterns from popular dating apps: paired avatars, a big bold
 * headline, animated confetti and dual CTAs ("send a message" / "keep
 * swiping"). All animations use the JS-only timing API so we don't need
 * native gesture/reanimated worklets.
 */
export function MatchModal({
  visible,
  name,
  otherPhoto,
  myPhoto,
  myName,
  onSendMessage,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const heartScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const leftAvatar = useRef(new Animated.Value(0)).current;
  const rightAvatar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      heartScale.setValue(0.6);
      cardOpacity.setValue(0);
      leftAvatar.setValue(0);
      rightAvatar.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1,
        damping: 6,
        mass: 0.9,
        stiffness: 110,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(leftAvatar, {
        toValue: 1,
        damping: 9,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.spring(rightAvatar, {
        toValue: 1,
        damping: 9,
        stiffness: 90,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, heartScale, cardOpacity, leftAvatar, rightAvatar]);

  const leftTranslate = leftAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 0],
  });
  const rightTranslate = rightAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel={t('discovery.keepSwiping')}
        />

        <ConfettiLayer active={visible} />

        <Animated.View
          style={[styles.card, { opacity: cardOpacity }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.kicker}>{t('discovery.matchCelebrationCaption')}</Text>
          <Text style={styles.title}>{t('discovery.matchTitle')}</Text>
          {name ? (
            <Text style={styles.subtitle}>{t('discovery.matchSubtitle', { name })}</Text>
          ) : null}

          <View style={styles.avatarsRow}>
            <Animated.View
              style={[
                styles.avatarFrame,
                styles.avatarLeft,
                { transform: [{ translateX: leftTranslate }, { rotate: '-8deg' }] },
              ]}
            >
              <Avatar uri={myPhoto} name={myName} size={120} />
            </Animated.View>

            <Animated.View
              style={[
                styles.heartHalo,
                { transform: [{ scale: heartScale }] },
              ]}
            >
              <View style={styles.heartCircle}>
                <Ionicons name="heart" size={32} color={colors.white} />
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.avatarFrame,
                styles.avatarRight,
                { transform: [{ translateX: rightTranslate }, { rotate: '8deg' }] },
              ]}
            >
              <Avatar uri={otherPhoto} name={name} size={120} />
            </Animated.View>
          </View>

          <View style={styles.actions}>
            <Button
              label={t('discovery.matchSendMessage')}
              onPress={onSendMessage}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
            <View style={styles.spacer} />
            <Button
              label={t('discovery.keepSwiping')}
              variant="ghost"
              onPress={onClose}
              fullWidth
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 14, 7, 0.7)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cream[50],
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 18,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.coral[500],
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink[400],
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  avatarsRow: {
    height: 150,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarFrame: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarLeft: {
    left: '50%',
    marginLeft: -135,
  },
  avatarRight: {
    right: '50%',
    marginRight: -135,
  },
  heartHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.coral[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 5,
  },
  heartCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.coral[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  actions: {
    width: '100%',
    marginTop: 4,
  },
  spacer: {
    height: 8,
  },
});
