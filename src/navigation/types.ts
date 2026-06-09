import { NavigatorScreenParams } from '@react-navigation/native';
import { FeedCandidate } from '../api/types';

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
  Conversation: {
    conversationId: string;
    otherName: string | null;
    otherUserId: string;
    otherUserAge?: number | null;
    otherUserPhoto?: string | null;
  };
  MatchProfile: { matchId: string };
  CandidateProfile: { candidate: FeedCandidate; distanceKm?: number };
  Premium: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Language: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Legal: undefined;
  Contact: undefined;
  BlockedUsers: undefined;
  VerifyEmail: undefined;
};
