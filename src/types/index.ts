// Types métier de base. À terme, ces types seront alignés sur les
// schémas exposés par l'API backend (NestJS).

export type EspaceType =
  | "boutique"
  | "entrepreneur"
  | "agence_livraison"
  | "agence_cargo"
  | "transitaire";

export interface EspaceTypeOption {
  type: EspaceType;
  label: string;
  description: string;
  icon: string; // nom d'icône Ionicons
}

export type BadgeLevel = "bronze" | "argent" | "or";

export interface EspaceOwner {
  id: string;
  name: string;
  initials: string;
  colorKey: "teal" | "coral" | "purple" | "gray";
  badgeLevel?: BadgeLevel;
  badgeThematique?: string; // ex: "Livraison rapide"
  location?: string;
}

export interface Publication {
  id: string;
  owner: EspaceOwner;
  title: string;
  price: number;
  currency: "XOF";
  imageUrl?: string;
  tranchesActivees: boolean;
}

export interface DeliveryRequest {
  id: string;
  depart: string;
  destination: string;
  multiPickup: boolean;
  nbColis: number;
}

export interface DeliveryOffer {
  id: string;
  requestId: string;
  provider: EspaceOwner;
  providerType: "livreur_independant" | "agence";
  price: number;
  rating: number;
  distanceKm: number;
}

export interface Conversation {
  id: string;
  contact: EspaceOwner;
  lastMessagePreview: string;
  lastMessageType: "text" | "audio" | "location" | "auto_reply";
  timestamp: string;
  unreadCount: number;
}

export type ShipmentStatus = "enregistre" | "en_transit" | "arrive";

export interface ShipmentStep {
  status: ShipmentStatus;
  label: string;
  date: string;
  done: boolean;
}

export interface Shipment {
  trackingCode: string;
  agence: EspaceOwner;
  origine: string;
  destination: string;
  nbColis: number;
  steps: ShipmentStep[];
}
export type MessageType = "text" | "audio" | "location" | "file";

export interface Message {
  id: string;
  type: MessageType;
  content: string; // texte du message, nom du fichier, ou libellé du lieu
  isMe: boolean;
  timestamp: string;
  audioTranslated?: boolean;
  audioDurationSeconds?: number;
}

export type GroupType = "discussion" | "annonces";

export interface CommunityGroup {
  id: string;
  espaceName: string;
  name: string;
  description: string;
  type: GroupType;
  memberCount: number;
  lastActivity: string;
}
export interface LiveComment {
  id: string;
  authorName: string;
  text: string;
}

export interface LiveSession {
  id: string;
  host: EspaceOwner;
  title: string;
  viewerCount: number;
  featuredProduct: {
    title: string;
    price: number;
  };
}
export type TontinePeriodicite = "hebdomadaire" | "mensuelle";

export interface TontineParticipant {
  id: string;
  name: string;
  initials: string;
  colorKey: "teal" | "coral" | "purple" | "gray";
  ordrePasssage: number | null; // null tant que le calendrier n'est pas validé par le créateur
}

export interface Tontine {
  id: string;
  name: string;
  montantCotisation: number;
  periodicite: TontinePeriodicite;
  createur: EspaceOwner;
  calendrierValide: boolean;
  prochainTour: string;
  participants: TontineParticipant[];
}
export interface UserProfile {
  name: string;
  phone: string;
  initials: string;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  badgeLevel: BadgeLevel;
}

export interface UserEspace {
  id: string;
  type: EspaceType;
  name: string;
  subscriptionActive: boolean;
}

export interface AffiliationStatus {
  points: number;
  pointsRequis: number;
  primeEstimee: number;
}