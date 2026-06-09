export type Gender =
  | 'male'
  | 'female'
  | 'non_binary'
  | 'gender_fluid'
  | 'other'
  | 'prefer_not_to_say';

export const GENDER_VALUES: Gender[] = [
  'male',
  'female',
  'non_binary',
  'gender_fluid',
  'other',
  'prefer_not_to_say',
];

export type InterestedIn = 'men' | 'women' | 'both';
export type InterestSelection = 'men' | 'women' | 'everyone';

export interface Photo {
  id: string;
  url: string;
  orderIndex: number;
}

export interface MyProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  birthDate: string | null;
  age: number | null;
  gender: Gender | null;
  city: string | null;
  bio: string | null;
  languages: string[];
  photos: Photo[];
  isPremium: boolean;
  interestedIn: InterestedIn | null;
  interestSelections: InterestSelection[];
  minAge: number;
  maxAge: number;
  appLanguage: string;
  notifications: { matches: boolean; messages: boolean; subscription: boolean };
}

export interface FeedCandidate {
  id: string;
  firstName: string | null;
  age: number;
  city: string | null;
  bio: string | null;
  gender: Gender | null;
  interestedIn: InterestedIn | null;
  photos: Photo[];
  languages: string[];
  isPremium: boolean;
}

export interface LikedUser extends FeedCandidate {
  likedAt: string;
}

export interface Match {
  matchId: string;
  matchedAt: string;
  conversationId: string | null;
  hasConversation: boolean;
  otherUser: {
    id: string;
    firstName: string | null;
    age: number | null;
    city: string | null;
    coverPhoto: string | null;
    isPremium: boolean;
  };
  lastMessage: {
    id: string;
    text: string | null;
    type: 'text' | 'image';
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface MatchUserProfile {
  matchId: string;
  conversationId: string | null;
  user: {
    id: string;
    firstName: string | null;
    age: number | null;
    gender: Gender | null;
    city: string | null;
    bio: string | null;
    languages: string[];
    photos: Photo[];
    interestedIn: InterestedIn | null;
    isPremium: boolean;
  };
}

/** Shared shape for profile hero/details components. */
export type ProfileDisplayData = Pick<
  MyProfile,
  'firstName' | 'age' | 'city' | 'gender' | 'bio' | 'languages' | 'photos' | 'interestedIn'
> & { isPremium?: boolean };

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'image';
  text: string | null;
  imageUrl: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  conversationId?: string;
  receiverId?: string;
}

export interface SubscriptionPlan {
  id: 'monthly_premium' | 'annual_premium';
  name: string;
  description: string;
  price: string;
  period: 'month' | 'year';
  autoRenewing?: boolean;
  managedBy?: 'google_play' | 'app_store';
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  profileComplete: boolean;
  emailVerified: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
