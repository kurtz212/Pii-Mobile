import { api } from "./api";

export interface ApiDeliveryRequest {
  id: string;
  clientId: string;
  depart: string;
  destination: string;
  notes: string | null;
  packageSize: string | null;
  isFragile: boolean;
  isGrouped: boolean;
  pickupPoints: ApiPickupPoint[] | null;
  trackingSteps: ApiTrackingStep[];
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
export interface ApiPickupPoint {
  espaceId: string;
  espaceName: string;
  location: string | null;
  orderId: string;
  title: string;
}

interface CreateGroupedDeliveryPayload {
  orderIds: string[];
  destination: string;
  notes?: string;
  packageSize?: string;
  isFragile?: boolean;
}

export async function createGroupedDelivery(payload: CreateGroupedDeliveryPayload) {
  return api.post<ApiDeliveryRequest>("/delivery-requests/grouped", payload, true);
}

export interface ApiTrackingStep {
  step: "picked_up" | "in_transit" | "delivered";
  note: string | null;
  at: string;
}

export async function addTrackingStep(requestId: string, step: string, note?: string) {
  return api.post<ApiDeliveryRequest>(`/delivery-requests/${requestId}/tracking`, { step, note }, true);
}