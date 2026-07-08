import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onReport: () => void;
  onBlock: () => void;
  onUnmatch?: () => void;
}

interface Anchor {
  top: number;
  right: number;
}

const MENU_WIDTH = 232;

/**
 * Compact "kebab" (⋮) options menu that groups the profile safety actions —
 * Report, Block and (optionally) Unmatch — inside a single dropdown so they no
 * longer occupy a full card on the profile. The trigger is a small circular
 * button meant to sit on the top-right of the profile photo; the popover is
 * anchored just below the trigger using its measured on-screen position.
 */
export function ProfileOptionsMenu({ onReport, onBlock, onUnmatch }: Props) {
  const { t } = useTranslation();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>({ top: 0, right: 16 });

  const openMenu = () => {
    const node = triggerRef.current;
    if (!node) {
      setOpen(true);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get('window').width;
      setAnchor({
        top: y + height + 8,
        right: Math.max(12, screenWidth - (x + width)),
      });
      setOpen(true);
    });
  };

  const runAction = (action: () => void) => {
    setOpen(false);
    // Defer so the popover is dismissed before the action opens a sheet/alert.
    setTimeout(action, 0);
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={t('profile.openMenu')}
        hitSlop={6}
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.62)' }}
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          <View
            style={[styles.menu, { top: anchor.top, right: anchor.right }]}
            // Stop the backdrop press from firing when tapping inside the menu.
            onStartShouldSetResponder={() => true}
          >
            <MenuItem
              icon="flag-outline"
              iconColor={colors.coral[600]}
              label={t('profile.reportUser')}
              onPress={() => runAction(onReport)}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="ban-outline"
              iconColor={colors.ink[700]}
              label={t('profile.blockUser')}
              onPress={() => runAction(onBlock)}
            />
            {onUnmatch ? (
              <>
                <View style={styles.divider} />
                <MenuItem
                  icon="heart-dislike-outline"
                  iconColor={colors.ink[700]}
                  label={t('matches.unmatch')}
                  onPress={() => runAction(onUnmatch)}
                />
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={styles.item}
      android_ripple={{ color: colors.cream[200] }}
    >
      <Ionicons name={icon} size={18} color={iconColor} style={styles.itemIcon} />
      <Text style={styles.itemLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[300],
    overflow: 'hidden',
    shadowColor: colors.ink[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink[700],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cream[300],
    marginHorizontal: 6,
  },
});
