import { api } from "./api";

export type BadgeLevel = "bronze" | "argent" | "or" | null;

export interface ApiBadgeInfo {
  completedOrders: number;
  averageRating: number | null;
  reviewCount: number;
  level: BadgeLevel;
}

export async function getBadgeInfo(espaceId: string) {
  return api.get<ApiBadgeInfo>(`/espaces/${espaceId}/badge`, true);
}