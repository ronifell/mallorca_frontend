import { chatApi } from '../api/endpoints';
import { Match } from '../api/types';
import { RootStackParamList } from '../navigation/types';

export async function buildConversationParams(
  match: Match,
): Promise<RootStackParamList['Conversation']> {
  const conv = match.conversationId
    ? { id: match.conversationId }
    : await chatApi.ensureConversation(match.matchId);

  return {
    conversationId: conv.id,
    otherName: match.otherUser.firstName,
    otherUserId: match.otherUser.id,
    otherUserAge: match.otherUser.age,
    otherUserPhoto: match.otherUser.coverPhoto,
  };
}
