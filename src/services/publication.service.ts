import { api } from "./api";

export type PublicationContentType = "image" | "video" | "text";

export interface ApiPublication {
  id: string;
  espaceId: string;
  espace: {
    id: string;
    name: string;
    type: string;
    location: string | null;
    details: Record<string, unknown>;
    subscriptionActive: boolean;
  };
  contentType: PublicationContentType;
  title: string;
  description: string | null;
  price: string | null;
  tranchesActivees: boolean;
  presenterEnLive: boolean;
  imageUrl: string | null;
  isPaused: boolean;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreatePublicationPayload {
  espaceId: string;
  contentType: PublicationContentType;
  title: string;
  description?: string;
  price?: number;
  tranchesActivees?: boolean;
  presenterEnLive?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

export async function createPublication(payload: CreatePublicationPayload) {
  return api.post<ApiPublication>("/publications", payload, true);
}

export async function getFeed(espaceId?: string) {
  const query = espaceId ? `?espaceId=${espaceId}` : "";
  return api.get<ApiPublication[]>(`/publications${query}`, true);
}
export async function getMyPublications(espaceId: string) {
  return api.get<ApiPublication[]>(`/publications/mine?espaceId=${espaceId}`, true);
}

export async function updatePublication(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    tranchesActivees: boolean;
    presenterEnLive: boolean;
    isPaused: boolean;
  }>,
) {
  return api.patch<ApiPublication>(`/publications/${id}`, payload, true);
}