import { api } from "./api";

export type GroupType = "discussion" | "annonces";

export interface ApiGroup {
  id: string;
  espaceId: string;
  creatorId: string;
  type: GroupType;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ApiGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface CreateGroupPayload {
  espaceId: string;
  type: GroupType;
  name: string;
  description?: string;
}

export async function createGroup(payload: CreateGroupPayload) {
  return api.post<ApiGroup>("/groups", payload, true);
}

export async function getGroupsByEspace(espaceId: string) {
  return api.get<ApiGroup[]>(`/groups?espaceId=${espaceId}`, true);
}

export async function getMyGroups() {
  return api.get<ApiGroup[]>("/groups/mine", true);
}

export async function joinGroup(groupId: string) {
  return api.post<{ joined: boolean }>(`/groups/${groupId}/join`, undefined, true);
}

export async function getGroupMessages(groupId: string) {
  return api.get<ApiGroupMessage[]>(`/groups/${groupId}/messages`, true);
}

export async function sendGroupMessage(groupId: string, content: string) {
  return api.post<ApiGroupMessage>(`/groups/${groupId}/messages`, { content }, true);
}