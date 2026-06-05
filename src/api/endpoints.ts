import { api } from './client';
import {
  AuthResult,
  FeedCandidate,
  Match,
  MatchUserProfile,
  Message,
  MyProfile,
  SubscriptionPlan,
} from './types';

export const authApi = {
  register: (input: { email: string; password: string; acceptedTerms: true; language?: 'en' | 'es' }) =>
    api.post<AuthResult>('/auth/register', input).then((r) => r.data),
  login: (input: { email: string; password: string }) =>
    api.post<AuthResult>('/auth/login', input).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<void>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, password: string) =>
    api.post<void>('/auth/reset-password', { token, password }).then((r) => r.data),
};

export const usersApi = {
  me: () => api.get<MyProfile>('/users/me').then((r) => r.data),
  update: (patch: Partial<{
    firstName: string;
    birthDate: string;
    gender: 'male' | 'female';
    interestedIn: 'men' | 'women' | 'both';
    minAge: number;
    maxAge: number;
    city: string;
    bio: string;
    languages: string[];
    appLanguage: 'en' | 'es';
  }>) => api.patch<MyProfile>('/users/me', patch).then((r) => r.data),
  uploadPhoto: async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    // React Native FormData accepts the file object shape below.
    formData.append('photo', { uri, name: filename, type: mime } as unknown as Blob);
    const r = await api.post<{ id: string; url: string; orderIndex: number }>(
      '/users/me/photos',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return r.data;
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
  pass: (id: string) => api.post<void>(`/discovery/pass/${id}`).then((r) => r.data),
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
    input: { type: 'text' | 'image'; text?: string; imageUrl?: string },
  ) =>
    api
      .post<Message>(`/chat/conversations/${conversationId}/messages`, input)
      .then((r) => r.data),
  uploadImage: async (conversationId: string, uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('image', { uri, name: filename, type: mime } as unknown as Blob);
    const r = await api.post<{ url: string }>(
      `/chat/conversations/${conversationId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return r.data;
  },
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
