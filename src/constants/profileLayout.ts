import { Dimensions } from 'react-native';

/** Horizontal inset for profile detail screens (matches header px-5). */
export const PROFILE_HORIZONTAL_PADDING = 20;

const SCREEN_WIDTH = Dimensions.get('window').width;

/** ScrollView content container — locks width to the screen and applies symmetric padding. */
export function profileScrollContentStyle(paddingBottom: number) {
  return {
    width: SCREEN_WIDTH,
    paddingHorizontal: PROFILE_HORIZONTAL_PADDING,
    paddingBottom,
  };
}

/** Usable content width inside a padded profile scroll area. */
export function profileContentWidth(): number {
  return SCREEN_WIDTH - PROFILE_HORIZONTAL_PADDING * 2;
}
