// Palette centrale de l'app. Toujours importer les couleurs depuis ici
// plutôt que d'écrire des codes hex directement dans les écrans —
// ça permettra plus tard d'ajouter un mode sombre sans tout réécrire.

export const colors = {
  // Couleurs de marque
  navy: "#1F3A5F",
  gold: "#B8862B",

  // Fonds
  background: "#FFFFFF",
  surface: "#F3F8F4",
  surfaceMuted: "#E7F3E9",

  // Textes
  textPrimary: "#1A2420",
  textSecondary: "#5C6B61",
  textMuted: "#98A69D",
  onAccent: "#FFFFFF",

  // Couleur principale de l'app : le vert domine (boutons, navigation
  // active, liens, éléments de confiance)
  accent: "#15803D",
  accentBg: "#DCF3E2",

  // Couleur secondaire : orange, utilisé ponctuellement pour les mises
  // en avant (paiement par tranches, offres, éléments à remarquer) —
  // ne doit jamais dominer visuellement un écran face au vert
  secondary: "#EA580C",
  secondaryBg: "#FFEDD9",

  // Bordures
  border: "#E1EDE3",
  borderStrong: "#C6DBC9",

  // États sémantiques
  success: "#15803D",
  successBg: "#DCF3E2",
  warning: "#854F0B",
  warningBg: "#FAEEDA",
  danger: "#A32D2D",
  dangerBg: "#FCEBEB",

  // Catégories (avatars de boutiques par exemple)
  teal: "#0F6E56",
  tealBg: "#E1F5EE",
  coral: "#993C1D",
  coralBg: "#FAECE7",
  purple: "#534AB7",
  purpleBg: "#EEEDFE",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};
