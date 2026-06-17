import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '../Avatar';
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

// ───────────────────────────────────────────────────────────────────────────────
// Floating background layer: hearts + sparkles drifting upward.
// Pure JS animations so we don't pull in Reanimated.
// ───────────────────────────────────────────────────────────────────────────────

type FloaterKind = 'heart' | 'sparkle' | 'dot';

interface Floater {
  kind: FloaterKind;
  size: number;
  x: number; // start X, percent of width
  drift: number; // horizontal drift, px
  delay: number;
  duration: number;
  opacity: number;
  rotateStart: number;
}

function buildFloaters(seed: number, count: number): Floater[] {
  const out: Floater[] = [];
  for (let i = 0; i < count; i++) {
    const kind: FloaterKind =
      i % 5 === 0 ? 'heart' : i % 3 === 0 ? 'sparkle' : 'dot';
    const sizeBase =
      kind === 'heart' ? 22 + (i % 5) * 5 : kind === 'sparkle' ? 14 + (i % 3) * 4 : 6 + (i % 4) * 2;
    out.push({
      kind,
      size: sizeBase,
      x: ((i * 137 + seed) % 100) / 100,
      drift: (((i * 211 + seed) % 80) - 40) * (kind === 'heart' ? 1.2 : 0.8),
      delay: (i * 220 + seed) % 1800,
      duration: 4200 + ((i * 313 + seed) % 2600),
      opacity: kind === 'heart' ? 0.55 + (i % 3) * 0.12 : kind === 'sparkle' ? 0.85 : 0.7,
      rotateStart: ((i * 53) % 30) - 15,
    });
  }
  return out;
}

function FloatingLayer({ active }: { active: boolean }) {
  const floaters = useMemo(() => buildFloaters(7, 22), []);
  const progress = useRef(floaters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) {
      progress.forEach((v) => v.stopAnimation());
      progress.forEach((v) => v.setValue(0));
      return;
    }
    const loops = floaters.map((f, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(f.delay),
          Animated.timing(progress[idx], {
            toValue: 1,
            duration: f.duration,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }),
          // Reset instantly off-screen so the loop is seamless.
          Animated.timing(progress[idx], {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, floaters, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {floaters.map((f, idx) => {
        const startX = f.x * SCREEN_WIDTH;
        const translateY = progress[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_HEIGHT + 30, -80],
        });
        const translateX = progress[idx].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, f.drift, 0],
        });
        const rotate = progress[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [`${f.rotateStart}deg`, `${f.rotateStart + (idx % 2 === 0 ? 18 : -18)}deg`],
        });
        const opacity = progress[idx].interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, f.opacity, f.opacity, 0],
        });

        return (
          <Animated.View
            key={idx}
            style={{
              position: 'absolute',
              left: startX,
              top: 0,
              transform: [{ translateY }, { translateX }, { rotate }],
              opacity,
            }}
          >
            {f.kind === 'heart' ? (
              <Ionicons name="heart" size={f.size} color="rgba(255,255,255,0.92)" />
            ) : f.kind === 'sparkle' ? (
              <Ionicons name="sparkles" size={f.size} color="rgba(255,255,255,0.95)" />
            ) : (
              <View
                style={{
                  width: f.size,
                  height: f.size,
                  borderRadius: f.size / 2,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                }}
              />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Match modal
// ───────────────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 148;
const AVATAR_OVERLAP = 36;

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

  // Choreographed entrance values.
  const backdrop = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const leftAvatar = useRef(new Animated.Value(0)).current;
  const rightAvatar = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(0)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    if (!visible) {
      backdrop.setValue(0);
      titleY.setValue(24);
      titleOpacity.setValue(0);
      leftAvatar.setValue(0);
      rightAvatar.setValue(0);
      heartScale.setValue(0);
      heartPulse.stopAnimation();
      heartPulse.setValue(0);
      actionsOpacity.setValue(0);
      actionsY.setValue(28);
      return;
    }

    Animated.sequence([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(leftAvatar, {
          toValue: 1,
          damping: 11,
          stiffness: 110,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.spring(rightAvatar, {
          toValue: 1,
          damping: 11,
          stiffness: 110,
          mass: 0.9,
          delay: 70,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          damping: 5,
          stiffness: 140,
          delay: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(actionsY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous gentle pulse on the heart badge.
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [
    visible,
    backdrop,
    titleY,
    titleOpacity,
    leftAvatar,
    rightAvatar,
    heartScale,
    heartPulse,
    actionsOpacity,
    actionsY,
  ]);

  const leftTranslateX = leftAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 0],
  });
  const leftScale = leftAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const leftRotate = leftAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '-6deg'],
  });

  const rightTranslateX = rightAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });
  const rightScale = rightAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const rightRotate = rightAvatar.interpolate({
    inputRange: [0, 1],
    outputRange: ['14deg', '6deg'],
  });

  const heartPulseScale = heartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const heartGlowScale = heartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });
  const heartGlowOpacity = heartPulse.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.55, 0.18, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.root, { opacity: backdrop }]}>
        {/* Romantic warm gradient backdrop */}
        <LinearGradient
          colors={['#FF6B5E', '#E8554E', '#B82E2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Vignette: darkens the corners so the centre composition pops */}
        <LinearGradient
          colors={['rgba(122,21,21,0.35)', 'rgba(0,0,0,0)', 'rgba(60,8,8,0.55)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Tap anywhere outside the content stack to dismiss */}
        <Pressable
          accessibilityLabel={t('discovery.keepSwiping')}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        {/* Floating hearts + sparkles */}
        <FloatingLayer active={visible} />

        {/* Center stack */}
        <View style={styles.centerStack} pointerEvents="box-none">
          {/* Top pill kicker */}
          <Animated.View
            style={[
              styles.kickerPill,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleY }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={12} color={colors.coral[500]} />
            <Text style={styles.kickerText}>{t('discovery.matchCelebrationCaption')}</Text>
            <Ionicons name="sparkles" size={12} color={colors.coral[500]} />
          </Animated.View>

          {/* Title + subtitle */}
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: titleOpacity,
              transform: [{ translateY: titleY }],
            }}
          >
            <Text style={styles.title}>{t('discovery.matchTitle')}</Text>
            {name ? (
              <Text style={styles.subtitle}>{t('discovery.matchSubtitle', { name })}</Text>
            ) : null}
          </Animated.View>

          {/* Avatars + heart */}
          <View style={styles.avatarStage} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.avatarFrame,
                styles.avatarLeft,
                {
                  transform: [
                    { translateX: leftTranslateX },
                    { rotate: leftRotate },
                    { scale: leftScale },
                  ],
                },
              ]}
            >
              <View style={styles.avatarRing}>
                <Avatar uri={myPhoto} name={myName} size={AVATAR_SIZE - 12} />
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.avatarFrame,
                styles.avatarRight,
                {
                  transform: [
                    { translateX: rightTranslateX },
                    { rotate: rightRotate },
                    { scale: rightScale },
                  ],
                },
              ]}
            >
              <View style={styles.avatarRing}>
                <Avatar uri={otherPhoto} name={name} size={AVATAR_SIZE - 12} />
              </View>
            </Animated.View>

            {/* Heart badge sitting at the overlap */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heartHaloGlow,
                {
                  transform: [{ scale: heartGlowScale }],
                  opacity: heartGlowOpacity,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heartBadge,
                { transform: [{ scale: Animated.multiply(heartScale, heartPulseScale) }] },
              ]}
            >
              <LinearGradient
                colors={['#FF7A6E', '#E8554E']}
                style={styles.heartBadgeInner}
              >
                <Ionicons name="heart" size={26} color={colors.white} />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* CTAs */}
          <Animated.View
            style={[
              styles.actionsWrap,
              {
                opacity: actionsOpacity,
                transform: [{ translateY: actionsY }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={onSendMessage}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('discovery.matchSendMessage')}
              style={styles.primaryButton}
            >
              <Ionicons
                name="paper-plane"
                size={18}
                color={colors.coral[600]}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.primaryButtonText}>{t('discovery.matchSendMessage')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('discovery.keepSwiping')}
              style={styles.ghostButton}
            >
              <Text style={styles.ghostButtonText}>{t('discovery.keepSwiping')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  centerStack: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },

  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  kickerText: {
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.coral[600],
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 52,
    lineHeight: 60,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    paddingHorizontal: 8,
    maxWidth: 320,
  },

  avatarStage: {
    height: AVATAR_SIZE + 36,
    width: AVATAR_SIZE * 2 - AVATAR_OVERLAP,
    marginTop: 28,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrame: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    shadowColor: '#5A0E0E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  avatarLeft: {
    left: 0,
  },
  avatarRight: {
    right: 0,
  },

  heartHaloGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
    zIndex: 4,
  },
  heartBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#3D0A0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
    borderWidth: 4,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  heartBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionsWrap: {
    width: '100%',
    alignItems: 'stretch',
  },

  primaryButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    minHeight: 58,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#3D0A0A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 14,
  },
  primaryButtonText: {
    color: colors.coral[600],
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  ghostButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  ghostButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
