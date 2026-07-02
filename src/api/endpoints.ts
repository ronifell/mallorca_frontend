import { ImagePickerAsset } from 'expo-image-picker';
import { api, postMultipartFile } from './client';
import { prepareUploadFile } from '../utils/imageUpload';
import {
  AuthResult,
  FeedCandidate,
  Gender,
  InterestSelection,
  LikedUser,
  Match,
  MatchUserProfile,
  Message,
  MyProfile,
  RelationshipGoal,
  SubscriptionPlan,
  SuperLikeQuota,
  SuperLikeResult,
} from './types';

export const authApi = {
  register: (input: {
    email: string;
    password: string;
    acceptedTerms: true;
    acceptedPrivacy: true;
    language?: 'en' | 'es';
  }) => api.post<AuthResult>('/auth/register', input).then((r) => r.data),
  login: (input: { email: string; password: string }) =>
    api.post<AuthResult>('/auth/login', input).then((r) => r.data),
  loginWithGoogle: (input: {
    idToken: string;
    acceptedTerms?: true;
    acceptedPrivacy?: true;
    language?: 'en' | 'es';
  }) => api.post<AuthResult>('/auth/google', input).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<void>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (email: string, code: string, password: string) =>
    api.post<void>('/auth/reset-password', { email, code, password }).then((r) => r.data),
  resendVerification: (email: string) =>
    api.post<void>('/auth/resend-verification', { email }).then((r) => r.data),
  verifyEmail: (token: string) =>
    api
      .post<{ verified: boolean }>(
        '/auth/verify-email',
        { token },
        { headers: { Accept: 'application/json' } },
      )
      .then((r) => r.data),
};

export const usersApi = {
  me: () => api.get<MyProfile>('/users/me').then((r) => r.data),
  update: (patch: Partial<{
    firstName: string;
    birthDate: string;
    gender: Gender;
    interestedIn: 'men' | 'women' | 'both';
    interestSelections: InterestSelection[];
    relationshipGoals: RelationshipGoal[];
    minAge: number;
    maxAge: number;
    city: string;
    bio: string;
    languages: string[];
    appLanguage: 'en' | 'es';
  }>) => api.patch<MyProfile>('/users/me', patch).then((r) => r.data),
  uploadPhoto: async (asset: ImagePickerAsset) => {
    const file = await prepareUploadFile(asset);
    return postMultipartFile<{ id: string; url: string; orderIndex: number }>(
      '/users/me/photos',
      'photo',
      file,
    );
  },
  deletePhoto: (id: string) => api.delete<void>(`/users/me/photos/${id}`).then((r) => r.data),
  reorderPhotos: (order: string[]) =>
    api.patch<void>('/users/me/photos/order', { order }).then((r) => r.data),
  updateFcmToken: (fcmToken: string) =>
    api.put<void>('/users/me/fcm-token', { fcmToken }).then((r) => r.data),
  updateNotifications: (input: {
    matchesEnabled?: boolean;
    messagesEnabled?: boolean;
    subscriptionEnabled?: boolean;
  }) => api.patch<void>('/users/me/notification-settings', input).then((r) => r.data),
  deleteAccount: () => api.delete<void>('/users/me').then((r) => r.data),
  exportData: () => api.get<Record<string, unknown>>('/users/me/export').then((r) => r.data),
};

export const discoveryApi = {
  feed: (limit = 20) =>
    api.get<{ users: FeedCandidate[] }>(`/discovery/feed?limit=${limit}`).then((r) => r.data.users),
  resetFeed: () => api.post<void>('/discovery/reset').then((r) => r.data),
  like: (id: string) =>
    api.post<{ matched: boolean; matchId?: string }>(`/discovery/like/${id}`).then((r) => r.data),
  superLike: (id: string) =>
    api.post<SuperLikeResult>(`/discovery/super-like/${id}`).then((r) => r.data),
  superLikeQuota: () =>
    api.get<SuperLikeQuota>('/discovery/super-like/quota').then((r) => r.data),
  pass: (id: string) => api.post<void>(`/discovery/pass/${id}`).then((r) => r.data),
  sentLikes: () =>
    api.get<{ users: LikedUser[] }>('/discovery/likes/sent').then((r) => r.data.users),
  receivedLikes: () =>
    api.get<{ users: LikedUser[] }>('/discovery/likes/received').then((r) => r.data.users),
  unlike: (id: string) =>
    api.delete<void>(`/discovery/likes/sent/${id}`).then((r) => r.data),
};

export const matchesApi = {
  list: () => api.get<{ matches: Match[] }>('/matches').then((r) => r.data.matches),
  profile: (matchId: string) =>
    api.get<MatchUserProfile>(`/matches/${matchId}/profile`).then((r) => r.data),
  unmatch: (id: string) => api.delete<void>(`/matches/${id}`).then((r) => r.data),
};

export const chatApi = {
  ensureConversation: (matchId: string) =>
    api.post<{ id: string }>(`/chat/matches/${matchId}/conversation`).then((r) => r.data),
  list: (conversationId: string, before?: string, limit = 30) => {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    params.set('limit', String(limit));
    return api
      .get<{ messages: Message[] }>(
        `/chat/conversations/${conversationId}/messages?${params.toString()}`,
      )
      .then((r) => r.data.messages);
  },
  send: (
    conversationId: string,
    input: {
      type: 'text' | 'image' | 'audio';
      text?: string;
      imageUrl?: string;
      audioUrl?: string;
      audioDuration?: number;
    },
  ) =>
    api
      .post<Message>(`/chat/conversations/${conversationId}/messages`, input)
      .then((r) => r.data),
  uploadImage: async (conversationId: string, asset: ImagePickerAsset) => {
    const file = await prepareUploadFile(asset);
    return postMultipartFile<{ url: string }>(
      `/chat/conversations/${conversationId}/images`,
      'image',
      file,
    );
  },
  uploadAudio: async (
    conversationId: string,
    file: { uri: string; name: string; type: string },
  ) =>
    postMultipartFile<{ url: string }>(
      `/chat/conversations/${conversationId}/audio`,
      'audio',
      file,
    ),
  markRead: (conversationId: string) =>
    api.post<void>(`/chat/conversations/${conversationId}/read`).then((r) => r.data),
};

export const subscriptionsApi = {
  plans: () =>
    api.get<{ plans: SubscriptionPlan[] }>('/subscriptions/plans').then((r) => r.data.plans),
  status: () =>
    api
      .get<{ isPremium: boolean; expiryDate: string | null }>('/subscriptions/status')
      .then((r) => r.data),
  validate: (input: {
    platform: 'google_play' | 'app_store';
    productId: string;
    purchaseToken: string;
  }) =>
    api
      .post<{ isPremium: boolean; expiryDate: string; status: string; productId: string }>(
        '/subscriptions/validate',
        input,
      )
      .then((r) => r.data),
};

export const moderationApi = {
  block: (userId: string) => api.post<void>(`/moderation/blocks/${userId}`).then((r) => r.data),
  unblock: (userId: string) =>
    api.delete<void>(`/moderation/blocks/${userId}`).then((r) => r.data),
  listBlocks: () =>
    api
      .get<{ blocks: { id: string; userId: string; firstName: string | null; blockedAt: string }[] }>(
        '/moderation/blocks',
      )
      .then((r) => r.data.blocks),
  report: (userId: string, reason: string, details?: string) =>
    api.post<void>(`/moderation/reports/${userId}`, { reason, details }).then((r) => r.data),
};
