import { api } from "./api";

export type MessageType = "text" | "audio" | "location" | "file";

interface ParticipantInfo {
  id: string;
  fullName: string;
  phone: string;
}

export interface ApiConversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  participantOne: ParticipantInfo;
  participantTwo: ParticipantInfo;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  createdAt: string;
}

export async function startConversation(recipientId: string) {
  return api.post<ApiConversation>("/conversations", { recipientId }, true);
}

export async function getMyConversations() {
  return api.get<ApiConversation[]>("/conversations/mine", true);
}

export async function getMessages(conversationId: string) {
  return api.get<ApiMessage[]>(`/conversations/${conversationId}/messages`, true);
}

export async function sendMessage(conversationId: string, content: string, type: MessageType = "text") {
  return api.post<ApiMessage>(`/conversations/${conversationId}/messages`, { content, type }, true);
}

// Détermine l'autre participant d'une conversation, par rapport à
// l'utilisateur connecté — évite de répéter cette logique dans chaque écran.
export function getOtherParticipant(conversation: ApiConversation, myUserId: string): ParticipantInfo {
  return conversation.participantOneId === myUserId
    ? conversation.participantTwo
    : conversation.participantOne;
}

// Initiales à partir du nom complet, pour l'avatar (ex: "Aïcha Traoré" -> "AT")
export function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}