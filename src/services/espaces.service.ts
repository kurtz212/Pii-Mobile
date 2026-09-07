import { api } from "./api";

export interface EspaceResponse {
  id: string;
  ownerId: string;
  type: string;
  name: string;
  description: string | null;
  location: string | null;
  
  photoUrl?: string | null;
  details: Record<string, unknown>;
  subscriptionActive: boolean;
  affiliationCodeUsed: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEspacePayload {
  type: string;
  name: string;
  description?: string;
  location?: string;
  photoUrl?: string;
  details?: Record<string, unknown>;
  affiliationCode: string;
}

export async function createEspace(payload: CreateEspacePayload) {
  return api.post<EspaceResponse>("/espaces", payload, true);
}

export async function getMyEspaces() {
  return api.get<EspaceResponse[]>("/espaces/mine", true);
}

export async function getEspacesPublic(type?: string, category?: string) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (category) params.append("category", category);
  const query = params.toString() ? `?${params.toString()}` : "";
  return api.get<EspaceResponse[]>(`/espaces${query}`, true);
}

export async function getEspaceById(id: string) {
  return api.get<EspaceResponse>(`/espaces/${id}`, true);
}

export async function updateEspace(
  espaceId: string,
  payload: {
    name?: string;
    description?: string;
    location?: string;
    photoUrl?: string;
    details?: Record<string, unknown>;
  },
) {
  return api.patch<EspaceResponse>(`/espaces/${espaceId}`, payload, true);
}

export async function subscribeToEspace(espaceId: string) {
  return api.post<{ subscribed: boolean }>(`/espaces/${espaceId}/subscribe`, undefined, true);
}

export async function unsubscribeFromEspace(espaceId: string) {
  return api.delete<{ subscribed: boolean }>(`/espaces/${espaceId}/subscribe`, true);
}

export async function getSubscriptionStatus(espaceId: string) {
  return api.get<{ subscribed: boolean }>(`/espaces/${espaceId}/subscribe/status`, true);
}