import { api } from "./api";
import { ApiDeliveryRequest } from "./delivery.service";

export interface ApiTeamMember {
  id: string;
  espaceId: string;
  livreurId: string;
  livreur: { id: string; fullName: string; phone: string };
  status: "pending" | "accepted";
  joinedAt: string;
}

export interface ApiTeamInvite {
  id: string;
  espaceId: string;
  espace: { id: string; name: string; details: Record<string, unknown> };
  status: "pending" | "accepted";
  joinedAt: string;
}

export async function inviteLivreur(espaceId: string, phone: string) {
  return api.post<ApiTeamMember>(`/espaces/${espaceId}/team/invite`, { phone }, true);
}

export async function getTeam(espaceId: string) {
  return api.get<ApiTeamMember[]>(`/espaces/${espaceId}/team`, true);
}

export async function getMyTeamInvites() {
  return api.get<ApiTeamInvite[]>("/team-invites/mine", true);
}

export async function respondToTeamInvite(membershipId: string, accept: boolean) {
  return api.post<{ accepted: boolean }>(`/team-invites/${membershipId}/respond`, { accept }, true);
}

export async function getAgencyAssignments(espaceId: string) {
  return api.get<ApiDeliveryRequest[]>(`/espaces/${espaceId}/deliveries`, true);
}

export async function assignToLivreur(requestId: string, livreurId: string) {
  return api.post<ApiDeliveryRequest>(`/delivery-requests/${requestId}/assign`, { livreurId }, true);
}