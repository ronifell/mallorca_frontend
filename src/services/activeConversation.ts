/** Conversation the user is currently viewing (null if elsewhere in the app). */
let activeConversationId: string | null = null;

export function setActiveConversationId(conversationId: string | null) {
  activeConversationId = conversationId;
}

export function getActiveConversationId(): string | null {
  return activeConversationId;
}
