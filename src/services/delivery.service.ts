import { api } from "./api";

export interface ApiDeliveryRequest {
  id: string;
  clientId: string;
  depart: string;
  destination: string;
  notes: string | null;
  packageSize: string | null;
  isFragile: boolean;
  status: "open" | "assigned" | "completed" | "cancelled";
  acceptedOfferId: string | null;
  assignedLivreurId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDeliveryOffer {
  id: string;
  deliveryRequestId: string;
  providerId: string;
  price: string;
  espaceId: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface ApiContactInfo {
  name: string;
  phone: string;
  role: "client" | "provider";
}

export async function createDeliveryRequest(
  depart: string,
  destination: string,
  notes?: string,
  packageSize?: string,
  isFragile?: boolean,
) {
  return api.post<ApiDeliveryRequest>(
    "/delivery-requests",
    { depart, destination, notes, packageSize, isFragile },
    true,
  );
}

export async function getOpenDeliveryRequests() {
  return api.get<ApiDeliveryRequest[]>("/delivery-requests/open?excludeMine=true", true);
}

export async function getMyDeliveryRequests() {
  return api.get<ApiDeliveryRequest[]>("/delivery-requests/mine", true);
}

export async function createOffer(requestId: string, price: number, espaceId?: string) {
  return api.post<ApiDeliveryOffer>(
    `/delivery-requests/${requestId}/offers`,
    { price, espaceId },
    true,
  );
}

export async function getOffersForRequest(requestId: string) {
  return api.get<ApiDeliveryOffer[]>(`/delivery-requests/${requestId}/offers`, true);
}

export async function acceptOffer(requestId: string, offerId: string) {
  return api.post<ApiDeliveryRequest>(`/delivery-requests/${requestId}/offers/${offerId}/accept`, undefined, true);
}

export async function getDeliveryContact(requestId: string) {
  return api.get<ApiContactInfo>(`/delivery-requests/${requestId}/contact`, true);
}
