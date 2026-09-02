import { api } from "./api";

export interface ApiReview {
  id: string;
  espaceId: string;
  authorId: string;
  author: { id: string; fullName: string };
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function createReview(orderId: string, rating: number, comment?: string) {
  return api.post<ApiReview>("/reviews", { orderId, rating, comment }, true);
}

export async function getReviewsByEspace(espaceId: string) {
  return api.get<ApiReview[]>(`/reviews?espaceId=${espaceId}`, true);
}