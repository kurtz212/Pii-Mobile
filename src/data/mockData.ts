// Données factices, utilisées tant que le backend NestJS n'est pas branché.
// Chaque service dans src/services/ pourra plus tard remplacer ces
// fonctions par de vrais appels API sans changer les écrans.

import { AffiliationStatus, CommunityGroup, Conversation, DeliveryOffer, EspaceTypeOption, LiveComment, LiveSession, Message, Publication, Shipment, Tontine, UserEspace, UserProfile } from "@/types";

export const espaceTypeOptions: EspaceTypeOption[] = [
  {
    type: "boutique",
    label: "Boutique",
    description: "Vendre des produits, publier, faire des lives.",
    icon: "storefront-outline",
  },
  {
    type: "entrepreneur",
    label: "Entrepreneur",
    description: "Proposer des prestations de service.",
    icon: "briefcase-outline",
  },
  {
    type: "agence_livraison",
    label: "Agence de livraison",
    description: "Gérer une équipe de livreurs et leurs gains.",
    icon: "car-outline",
  },
  {
    type: "agence_cargo",
    label: "Agence cargo",
    description: "Enregistrer et transporter des marchandises.",
    icon: "cube-outline",
  },
  {
    type: "transitaire",
    label: "Transitaire",
    description: "Coordonner la logistique et les formalités douanières.",
    icon: "document-text-outline",
  },
];

export const mockPublications: Publication[] = [
  {
    id: "pub-1",
    owner: {
      id: "shop-1",
      name: "Aïcha Mode",
      initials: "AM",
      colorKey: "teal",
      badgeLevel: "or",
      location: "Ouagadougou",
    },
    title: "Robe wax bleue",
    price: 15000,
    currency: "XOF",
    tranchesActivees: true,
  },
  {
    id: "pub-2",
    owner: {
      id: "shop-2",
      name: "Issa Électronique",
      initials: "IE",
      colorKey: "coral",
      badgeThematique: "Livraison rapide",
      location: "Bobo-Dioulasso",
    },
    title: "Téléviseur 43 pouces",
    price: 180000,
    currency: "XOF",
    tranchesActivees: true,
  },
];

export const mockOffers: DeliveryOffer[] = [
  {
    id: "offer-1",
    requestId: "req-1",
    provider: { id: "u-1", name: "Moussa B.", initials: "MB", colorKey: "teal" },
    providerType: "livreur_independant",
    price: 2500,
    rating: 4.8,
    distanceKm: 2.1,
  },
  {
    id: "offer-2",
    requestId: "req-1",
    provider: {
      id: "u-2",
      name: "Rapido Transport",
      initials: "RT",
      colorKey: "coral",
      badgeLevel: "or",
    },
    providerType: "agence",
    price: 3000,
    rating: 4.9,
    distanceKm: 3.4,
  },
  {
    id: "offer-3",
    requestId: "req-1",
    provider: { id: "u-3", name: "Salif K.", initials: "SK", colorKey: "purple" },
    providerType: "livreur_independant",
    price: 2200,
    rating: 4.5,
    distanceKm: 4.0,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    contact: { id: "shop-1", name: "Aïcha Mode", initials: "AM", colorKey: "teal" },
    lastMessagePreview: "Message vocal · traduit en français",
    lastMessageType: "audio",
    timestamp: "09:41",
    unreadCount: 2,
  },
  {
    id: "conv-2",
    contact: { id: "agency-1", name: "Rapido Transport", initials: "RT", colorKey: "coral" },
    lastMessagePreview: "Votre colis est en route",
    lastMessageType: "text",
    timestamp: "Hier",
    unreadCount: 0,
  },
  {
    id: "conv-3",
    contact: { id: "u-3", name: "Salif K. — Livreur", initials: "SK", colorKey: "purple" },
    lastMessagePreview: "Position partagée",
    lastMessageType: "location",
    timestamp: "Hier",
    unreadCount: 0,
  },
  {
    id: "conv-4",
    contact: { id: "shop-2", name: "Issa Électronique", initials: "IE", colorKey: "gray" as any },
    lastMessagePreview: "Réponse automatique envoyée",
    lastMessageType: "auto_reply",
    timestamp: "Lundi",
    unreadCount: 0,
  },
];
export const mockShipment: Shipment = {
  trackingCode: "PII-7X29KD",
  agence: { id: "agence-1", name: "Sahel Cargo Express", initials: "SC", colorKey: "purple" },
  origine: "Ouagadougou",
  destination: "Bobo-Dioulasso",
  nbColis: 3,
  steps: [
    { status: "enregistre", label: "Colis enregistré", date: "24 juillet, 09:12", done: true },
    { status: "en_transit", label: "En transit", date: "24 juillet, 14:30", done: true },
    { status: "arrive", label: "Arrivé à destination", date: "En attente", done: false },
  ],
};
export const mockMessages: Message[] = [
  { id: "m1", type: "text", content: "Bonjour, la robe wax bleue est-elle toujours disponible ?", isMe: true, timestamp: "09:30" },
  { id: "m2", type: "audio", content: "", isMe: false, timestamp: "09:35", audioTranslated: true, audioDurationSeconds: 14 },
  { id: "m3", type: "text", content: "Oui, elle est disponible en taille M et L.", isMe: false, timestamp: "09:35" },
  { id: "m4", type: "text", content: "Parfait, je prends la taille M. Vous livrez sur Ouaga 2000 ?", isMe: true, timestamp: "09:41" },
  { id: "m5", type: "location", content: "Ouaga 2000, secteur 15", isMe: true, timestamp: "09:41" },
  { id: "m6", type: "text", content: "Oui sans problème, je vous prépare ça.", isMe: false, timestamp: "09:43" },
];

export const mockGroups: CommunityGroup[] = [
  {
    id: "group-1",
    espaceName: "Aïcha Mode",
    name: "Clientes fidèles Aïcha Mode",
    description: "Nouveautés en avant-première et promotions réservées aux membres.",
    type: "annonces",
    memberCount: 128,
    lastActivity: "Aujourd'hui",
  },
  {
    id: "group-2",
    espaceName: "Aïcha Mode",
    name: "Discussion mode & tendances",
    description: "Échangez sur les tendances wax et vos looks du moment.",
    type: "discussion",
    memberCount: 64,
    lastActivity: "Hier",
  },
];
export const mockLiveSession: LiveSession = {
  id: "live-1",
  host: { id: "shop-1", name: "Aïcha Mode", initials: "AM", colorKey: "teal", badgeLevel: "or" },
  title: "Nouvelle collection wax — en direct de la boutique",
  viewerCount: 342,
  featuredProduct: { title: "Robe wax bleue", price: 15000 },
};

export const mockLiveComments: LiveComment[] = [
  { id: "c1", authorName: "Fatou S.", text: "Elle est magnifique 😍" },
  { id: "c2", authorName: "Ibrahim K.", text: "Vous avez la taille L ?" },
  { id: "c3", authorName: "Aïcha Mode", text: "Oui Ibrahim, taille L disponible !" },
  { id: "c4", authorName: "Rasmata O.", text: "Prix en tranches possible ?" },
  { id: "c5", authorName: "Moussa T.", text: "Je commande la bleue 🙌" },
];
export const mockTontines: Tontine[] = [
  {
    id: "tontine-1",
    name: "Tontine des commerçantes du marché",
    montantCotisation: 10000,
    periodicite: "mensuelle",
    createur: { id: "u-4", name: "Rasmata O.", initials: "RO", colorKey: "coral" },
    calendrierValide: true,
    prochainTour: "5 août 2026 · Fatou S.",
    participants: [
      { id: "u-4", name: "Rasmata O.", initials: "RO", colorKey: "coral", ordrePasssage: 1 },
      { id: "u-5", name: "Fatou S.", initials: "FS", colorKey: "teal", ordrePasssage: 2 },
      { id: "u-6", name: "Aïcha Mode", initials: "AM", colorKey: "purple", ordrePasssage: 3 },
    ],
  },
  {
    id: "tontine-2",
    name: "Tontine famille Ouédraogo",
    montantCotisation: 5000,
    periodicite: "hebdomadaire",
    createur: { id: "u-1", name: "Moi", initials: "MO", colorKey: "gray" },
    calendrierValide: false,
    prochainTour: "En attente de validation du calendrier",
    participants: [
      { id: "u-1", name: "Moi", initials: "MO", colorKey: "gray", ordrePasssage: null },
      { id: "u-7", name: "Salif K.", initials: "SK", colorKey: "purple", ordrePasssage: null },
    ],
  },
];
export const mockUserProfile: UserProfile = {
  name: "Kader Yaméogo",
  phone: "+226 70 12 34 56",
  initials: "KY",
  verified: true,
  ratingAverage: 4.7,
  ratingCount: 32,
  badgeLevel: "argent",
};

export const mockUserEspaces: UserEspace[] = [
  { id: "espace-1", type: "boutique", name: "Aïcha Mode", subscriptionActive: true },
  { id: "espace-2", type: "entrepreneur", name: "Kader Conseil", subscriptionActive: false },
];

export const mockAffiliation: AffiliationStatus = {
  points: 340,
  pointsRequis: 500,
  primeEstimee: 5000,
};