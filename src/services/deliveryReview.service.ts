import { api } from "./api";

export interface ApiDeliveryReview {
  id: string;
  deliveryRequestId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ApiDeliveryBadge {
  completedDeliveries: number;
  averageRating: number | null;
  reviewCount: number;
}

export async function markDeliveryCompleted(deliveryRequestId: string) {
  return api.post<any>(`/delivery-requests/${deliveryRequestId}/complete`, undefined, true);
}

export async function createDeliveryReview(deliveryRequestId: string, rating: number, comment?: string) {
  return api.post<ApiDeliveryReview>(
    "/delivery-requests/reviews",
    { deliveryRequestId, rating, comment },
    true,
  );
}

export async function getProviderBadge(providerId: string) {
  return api.get<ApiDeliveryBadge>(`/delivery-requests/provider/${providerId}/badge`, true);
}

export async function getAcceptedByMe() {
  return api.get<any[]>("/delivery-requests/accepted-mine", true);
}