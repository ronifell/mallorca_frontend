export type Gender = 'male' | 'female';
export type InterestedIn = 'men' | 'women' | 'both';

export interface Photo {
  id: string;
  url: string;
  orderIndex: number;
}

export interface MyProfile {
  id: string;
  email: string;
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
  photos: Photo[];
  languages: string[];
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

export interface Message {
  id: string;
  senderId: string;
  type: 'text' | 'image';
  text: string | null;
  imageUrl: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  // Set client-side when echoing a message we just sent.
  conversationId?: string;
  receiverId?: string;
}

export interface SubscriptionPlan {
  id: 'monthly_premium' | 'annual_premium';
  name: string;
  description: string;
  price: string;
  period: 'month' | 'year';
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  profileComplete: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
