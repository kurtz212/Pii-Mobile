import { api, setToken, clearToken, setUserId, clearUserId } from "./api";

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
  };
}

export async function register(fullName: string, phone: string, password: string, email?: string) {
  return api.post<{ id: string; fullName: string; phone: string; email: string | null }>("/users", {
    fullName,
    phone,
    password,
    email: email || undefined,
  });
}

export async function login(phone: string, password: string) {
  const result = await api.post<AuthResponse>("/auth/login", { phone, password });
  await setToken(result.accessToken);
  await setUserId(result.user.id);
  return result;
}

export async function logout() {
  await clearToken();
  await clearUserId();
}