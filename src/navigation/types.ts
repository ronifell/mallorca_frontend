import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type ProfileSetupStackParamList = {
  CreateProfile: undefined;
  UploadPhotos: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Chat: undefined;
  Premium: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ProfileSetup: NavigatorScreenParams<ProfileSetupStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Conversation: { conversationId: string; otherName: string | null; otherUserId: string };
  Premium: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Language: undefined;
  Notifications: undefined;
  Privacy: undefined;
  BlockedUsers: undefined;
};
