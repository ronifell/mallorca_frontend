import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const authHeroImage = require('../../../assets/login.png');

export const authScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fadeLayer: {
    width: '100%',
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  topSpacer: {
    flex: 0.14,
    minHeight: 8,
  },
  welcomeBlock: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  formCard: {
    flex: 0.86,
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 32,
  },
  primaryButton: {
    shadowColor: colors.coral[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonArrow: {
    position: 'absolute',
    right: 22,
  },
});
