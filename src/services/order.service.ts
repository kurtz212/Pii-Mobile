import { api } from "./api";

export type PaymentMethod = "cash" | "tranches";
export type ReceptionMode = "livraison" | "rendez_vous";
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface ApiOrder {
  id: string;
  clientId: string;
  publicationId: string;
  espaceId: string;
  sellerId: string;
  title: string;
  price: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  receptionMode: ReceptionMode;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
interface CreateOrderPayload {
  publicationId: string;
  quantity?: number;
  paymentMethod: PaymentMethod;
  receptionMode: ReceptionMode;
  notes?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  return api.post<ApiOrder>("/orders", payload, true);
}

export async function getMyOrders() {
  return api.get<ApiOrder[]>("/orders/mine", true);
}

export async function getReceivedOrders(espaceId?: string) {
  const query = espaceId ? `?espaceId=${espaceId}` : "";
  return api.get<ApiOrder[]>(`/orders/received${query}`, true);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return api.patch<ApiOrder>(`/orders/${orderId}/status`, { status }, true);
}