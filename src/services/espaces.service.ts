import { api } from "./api";

export interface EspaceResponse {
  id: string;
  ownerId: string;
  type: string;
  name: string;
  description: string | null;
  location: string | null;
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
  payload: { description?: string; location?: string; details?: Record<string, unknown> },
) {
  return api.patch<EspaceResponse>(`/espaces/${espaceId}`, payload, true);
}