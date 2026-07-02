import { matchesApi } from '../api/endpoints';
import { useMatchPopup } from '../store/matchPopup';

/** How long after a match we still show the celebration if it was missed over socket. */
export const RECENT_MATCH_POPUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * Fallback when a `match:new` socket event is missed (socket still connecting,
 * brief disconnect, etc.). Fetches recent matches and surfaces the newest one
 * we have not celebrated yet this session.
 */
export async function syncRecentMatchPopups(): Promise<void> {
  try {
    const matches = await matchesApi.list();
    const now = Date.now();
    const { seenMatchIds, show } = useMatchPopup.getState();

    const latest = matches
      .filter((m) => now - new Date(m.matchedAt).getTime() < RECENT_MATCH_POPUP_WINDOW_MS)
      .filter((m) => !seenMatchIds.has(m.matchId))
      .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())[0];

    if (!latest) return;

    show({
      matchId: latest.matchId,
      otherUser: {
        id: latest.otherUser.id,
        firstName: latest.otherUser.firstName,
        photo: latest.otherUser.coverPhoto,
      },
    });
  } catch {
    // Non-fatal — socket events remain the primary path.
  }
}
