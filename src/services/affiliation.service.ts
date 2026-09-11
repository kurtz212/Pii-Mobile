import { api } from "./api";

export interface AffiliationInfo {
  affiliationCode: string;
  referredByCode: string | null;
  isCodeFieldLocked: boolean;
  mobileMoneyOperator: string | null;
  mobileMoneyNumber: string | null;
}

export async function getMyAffiliation() {
  return api.get<AffiliationInfo>("/affiliation/me", true);
}

export async function updateMobileMoney(operator: string, number: string) {
  return api.patch<{ mobileMoneyOperator: string; mobileMoneyNumber: string }>(
    "/affiliation/mobile-money",
    { operator, number },
    true,
  );
}

export interface ApiUserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  isPhoneVerified: boolean;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  kycStatus: "none" | "submitted" | "verified";
  preferredTextLanguage: string;
}

export async function getMyProfile() {
  return api.get<ApiUserProfile>("/users/me", true);
}

export async function submitKyc(idDocumentType: string, idDocumentNumber: string) {
  return api.patch<ApiUserProfile>("/users/me/kyc", { idDocumentType, idDocumentNumber }, true);
}

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

export async function updateLanguagePreferences(preferredTextLanguage: string) {
  return api.patch<ApiUserProfile & { preferredTextLanguage: string }>(
    "/users/me/language-preferences",
    { preferredTextLanguage },
    true,
  );
}
export async function claimAffiliationCode() {
  return api.post<{ affiliationCode: string }>("/users/me/claim-affiliation-code", undefined, true);
}