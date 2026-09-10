import { api } from "./api";

export type MessageType = "text" | "audio" | "image" | "video" | "location" | "contact" | "file";

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
  unreadCount: number;
}

export interface MessageMetadata {
  url?: string;
  fileName?: string;
  fileSize?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
  name?: string;
  phone?: string;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  translatedContent?: string;
  metadata: MessageMetadata | null;
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

export async function sendMessage(
  conversationId: string,
  content: string,
  type: MessageType = "text",
  metadata?: MessageMetadata,
) {
  // L'API accepte uniquement content et type. Les données d'une pièce
  // jointe sont donc sérialisées dans content pour éviter le rejet de
  // la propriété metadata par le DTO backend.
  const messageContent = metadata ? JSON.stringify(metadata) : content;
  return api.post<ApiMessage>(
    `/conversations/${conversationId}/messages`,
    { content: messageContent, type },
    true,
  );
}

export function getOtherParticipant(conversation: ApiConversation, myUserId: string): ParticipantInfo {
  return conversation.participantOneId === myUserId
    ? conversation.participantTwo
    : conversation.participantOne;
}

export function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
export async function getUnreadCount() {
  return api.get<{ count: number }>("/conversations/unread-count", true);
}