import { api } from "./api";

export type QuoteRequestStatus = "open" | "accepted" | "cancelled" | "completed";
export type QuoteTargetType = "agence_cargo" | "transitaire";

export interface ApiQuoteRequest {
  id: string;
  clientId: string;
  targetType: QuoteTargetType;
  targetEspaceIds: string[] | null;
  details: Record<string, unknown>;
  status: QuoteRequestStatus;
   acceptedQuoteId: string | null;
  trackingSteps: ApiQuoteTrackingStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiQuote {
  id: string;
  quoteRequestId: string;
  espaceId: string;
  espace: { id: string; name: string; ownerId: string };
  price: string;
  notes: string | null;
  createdAt: string;
}

export interface ApiQuoteContactInfo {
  name: string;
  phone: string;
  role: "client" | "agency";
  agencyName?: string;
}

interface CreateQuoteRequestPayload {
  targetType: QuoteTargetType;
  targetEspaceIds?: string[];
  details: Record<string, unknown>;
}

export async function createQuoteRequest(payload: CreateQuoteRequestPayload) {
  return api.post<ApiQuoteRequest>("/quote-requests", payload, true);
}

export async function getMyQuoteRequests() {
  return api.get<ApiQuoteRequest[]>("/quote-requests/mine", true);
}

export async function getReceivedQuoteRequests(espaceId: string) {
  return api.get<ApiQuoteRequest[]>(`/quote-requests/received?espaceId=${espaceId}`, true);
}

export async function getQuotesForRequest(requestId: string) {
  return api.get<ApiQuote[]>(`/quote-requests/${requestId}/quotes`, true);
}

export async function submitQuote(requestId: string, espaceId: string, price: number, notes?: string) {
  return api.post<ApiQuote>(
    `/quote-requests/${requestId}/quotes?espaceId=${espaceId}`,
    { price, notes },
    true,
  );
}

export async function acceptQuote(requestId: string, quoteId: string) {
  return api.post<ApiQuoteRequest>(`/quote-requests/${requestId}/quotes/${quoteId}/accept`, undefined, true);
}

export async function cancelQuoteRequest(requestId: string) {
  return api.post<ApiQuoteRequest>(`/quote-requests/${requestId}/cancel`, undefined, true);
}

export async function completeQuoteRequest(requestId: string) {
  return api.post<ApiQuoteRequest>(`/quote-requests/${requestId}/complete`, undefined, true);
}

export async function getQuoteContact(requestId: string) {
  return api.get<ApiQuoteContactInfo>(`/quote-requests/${requestId}/contact`, true);
}
export interface ApiQuoteTrackingStep {
  step: "picked_up" | "in_transit" | "customs" | "delivered";
  note: string | null;
  at: string;
}

export async function addQuoteTrackingStep(
  requestId: string,
  step: ApiQuoteTrackingStep["step"],
  note?: string,
) {
  return api.post<ApiQuoteRequest>(`/quote-requests/${requestId}/tracking`, { step, note }, true);
}