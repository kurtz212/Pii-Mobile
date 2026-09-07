// Client API centralisé — toutes les requêtes vers le backend passent
// par ici plutôt que d'utiliser fetch() directement dans les écrans.
//
// IMPORTANT : "localhost" ne fonctionne PAS depuis le téléphone (Expo Go)
// car il pointerait vers le téléphone lui-même, pas vers le PC qui fait
// tourner le backend. Il faut l'adresse IP locale du PC sur le réseau
// Wi-Fi (trouvée avec `ipconfig` sous "Adresse IPv4").
const API_BASE_URL = "http://192.168.1.70:3000";

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "pii_access_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
const USER_ID_KEY = "pii_user_id";

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function setUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
}

export async function clearUserId(): Promise<void> {
  await AsyncStorage.removeItem(USER_ID_KEY);
}
interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export class ApiRequestError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as ApiError | null;
    const message = Array.isArray(errorData?.message)
      ? errorData!.message.join(", ")
      : (errorData?.message ?? "Une erreur est survenue");
    throw new ApiRequestError(message, response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "POST", body, auth }),
  patch: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth = false) => request<T>(path, { method: "DELETE", auth }),
};
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${API_BASE_URL}${path}`;
}

export async function uploadImage(localUri: string): Promise<string> {
  const token = await getToken();
  const filename = localUri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === "jpg" ? "jpeg" : match[1]}` : "image/jpeg";

  // Contourne un bug de compatibilité entre React Native récent et
  // l'ancienne syntaxe FormData ({uri, name, type}) — on récupère le
  // fichier local comme un vrai Blob avant de l'attacher.
  const fileResponse = await fetch(localUri);
  const rawBlob = await fileResponse.blob();
  const blob = rawBlob.type === type ? rawBlob : new Blob([rawBlob], { type });

  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiRequestError(data?.message ?? "Échec de l'envoi de l'image", response.status);
  }
  return data.url as string;
}

export async function uploadVideo(localUri: string): Promise<string> {
  const token = await getToken();
  const filename = localUri.split("/").pop() ?? "video.mp4";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `video/${match[1] === "mov" ? "quicktime" : match[1]}` : "video/mp4";

    const fileResponse = await fetch(localUri);
  const rawBlob = await fileResponse.blob();
  const blob = rawBlob.type === type ? rawBlob : new Blob([rawBlob], { type });

  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch(`${API_BASE_URL}/uploads/video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiRequestError(data?.message ?? "Échec de l'envoi de la vidéo", response.status);
  }
  return data.url as string;
}
export interface ApiUserSearchResult {
  id: string;
  fullName: string;
  phone: string;
}

export async function searchUsers(query: string) {
  return api.get<ApiUserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`, true);
}