import { create } from 'zustand';

/**
 * Single source of truth for the "It's a match!" celebration modal.
 *
 * Why this exists:
 *   The modal can be triggered from two independent code paths:
 *     1. The local API response from `discoveryApi.like(...)` when the user
 *        taps the heart and their like turns out to be reciprocal.
 *     2. The `match:new` socket event sent by the server when the OTHER user
 *        liked us back (we never tapped anything; we just need to celebrate).
 *
 *   Centralising the modal in a store lets both paths feed into the same
 *   UI without rendering duplicates (we dedup on `matchId`).
 */
export interface MatchPopupPayload {
  /** Match row id; doubles as the dedup key. */
  matchId: string;
  otherUser: {
    id: string;
    firstName: string | null;
    photo: string | null;
  };
}

interface MatchPopupState {
  current: MatchPopupPayload | null;
  /** Match ids we've already surfaced this session, to ignore echoes. */
  seenMatchIds: Set<string>;
  /** Show the modal if we haven't already shown this matchId. */
  show: (payload: MatchPopupPayload) => void;
  hide: () => void;
}

export const useMatchPopup = create<MatchPopupState>((set, get) => ({
  current: null,
  seenMatchIds: new Set(),

  show(payload) {
    const { seenMatchIds } = get();
    if (seenMatchIds.has(payload.matchId)) return;
    const nextSeen = new Set(seenMatchIds);
    nextSeen.add(payload.matchId);
    set({ current: payload, seenMatchIds: nextSeen });
  },

  hide() {
    set({ current: null });
  },
}));
