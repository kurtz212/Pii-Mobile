import { api } from "./api";

export type TontineStatus = "draft" | "active" | "completed" | "cancelled";
export type ContributionStatus = "pending" | "paid" | "missed";
export type ResponseStatus = "pending" | "validated" | "amended";

export interface ApiTontine {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  articleName: string | null;
  articlePrice: string | null;
  articleImageUrl: string | null;
  confidentialityPolicy: string | null;
  contributionAmount: string;
  maxParticipants: number;
  status: TontineStatus;
  createdAt: string;
}

export interface ApiTontineParticipant {
  id: string;
  tontineId: string;
  userId: string;
  user: { id: string; fullName: string; phone: string };
  proposedOrder: number | null;
  requestedOrder: number | null;
  responseStatus: ResponseStatus;
  confirmedOrder: number | null;
  joinedAt: string;
}

export interface ApiTontineContribution {
  id: string;
  tontineId: string;
  roundNumber: number;
  participantId: string;
  participant: { id: string; fullName: string };
  status: ContributionStatus;
  updatedAt: string;
}

interface CreateTontinePayload {
  name: string;
  description?: string;
  articleName?: string;
  articlePrice?: number;
  articleImageUrl?: string;
  confidentialityPolicy?: string;
  contributionAmount: number;
  maxParticipants: number;
}

export async function createTontine(payload: CreateTontinePayload) {
  return api.post<ApiTontine>("/tontines", payload, true);
}

export async function getMyTontines() {
  return api.get<ApiTontine[]>("/tontines/mine", true);
}

export async function getTontine(id: string) {
  return api.get<ApiTontine>(`/tontines/${id}`, true);
}

export async function getTontineParticipants(id: string) {
  return api.get<ApiTontineParticipant[]>(`/tontines/${id}/participants`, true);
}

export async function joinTontine(id: string) {
  return api.post<{ joined: boolean }>(`/tontines/${id}/join`, undefined, true);
}

export async function proposeCalendar(id: string, assignments: { userId: string; order: number }[]) {
  return api.post<ApiTontineParticipant[]>(`/tontines/${id}/propose-calendar`, { assignments }, true);
}

export async function respondToProposal(id: string, accept: boolean, requestedOrder?: number) {
  return api.post<ApiTontineParticipant>(`/tontines/${id}/respond`, { accept, requestedOrder }, true);
}

export async function finalizeCalendar(id: string) {
  return api.post<ApiTontine>(`/tontines/${id}/finalize`, undefined, true);
}

export async function getContributions(id: string, round?: number) {
  const query = round ? `?round=${round}` : "";
  return api.get<ApiTontineContribution[]>(`/tontines/${id}/contributions${query}`, true);
}

export async function updateContribution(
  tontineId: string,
  contributionId: string,
  status: ContributionStatus,
) {
  return api.patch<ApiTontineContribution>(
    `/tontines/${tontineId}/contributions/${contributionId}`,
    { status },
    true,
  );
}
