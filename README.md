# Pii — Application mobile

Structure de départ de l'application mobile Pii, construite avec **React Native** via **Expo** et **TypeScript**.

## Pourquoi Expo

Expo permet de lancer l'app directement sur ton téléphone (via l'app "Expo Go") sans avoir besoin d'installer Xcode ou Android Studio pour commencer à développer. C'est le choix le plus rapide pour un développeur solo qui veut itérer vite. On pourra basculer vers un projet React Native "nu" plus tard si un module natif spécifique l'exige (peu probable pour ce projet).

## Démarrer le projet

```bash
npm install
npm start
```

Un QR code s'affiche dans le terminal. Scanne-le avec l'app **Expo Go** (disponible sur Play Store / App Store) pour voir l'app tourner sur ton téléphone, en temps réel, avec rechargement automatique à chaque modification de code.

## Structure du projet

```
src/
  screens/        Un dossier par écran (Home, Delivery, Messaging, Publication, Profile...)
  components/      Composants réutilisables (Avatar, Badge, PublicationCard...)
  navigation/      Configuration de la navigation (onglets + pile d'écrans)
  theme/           Couleurs, espacements, rayons — à utiliser partout plutôt que des valeurs en dur
  types/           Types TypeScript partagés, alignés à terme sur l'API backend
  data/            Données de démonstration (à retirer une fois le backend branché)
  services/        (à créer) Appels API vers le backend NestJS
```

## Écrans déjà codés

- **Accueil** (`src/screens/Home`) — recherche par mots-clé, filtres par catégorie, feed de publications
- **Livraison** (`src/screens/Delivery`) — demande de livraison, liste des offres reçues, choix de l'offre
- **Messagerie** (`src/screens/Messaging`) — liste des conversations avec aperçu (audio traduit, position, réponse automatique)
- **Publication** (`src/screens/Publication`) — création d'un article, avec activation du paiement par tranches et option "présenter en live"
- **Profil** — écran minimal, à enrichir

## Ce qui reste à faire (prochaines étapes suggérées)

1. **Connecter au backend** : remplacer `src/data/mockData.ts` par de vrais appels API dans `src/services/`.
2. **Authentification** : écrans d'inscription/connexion, gestion du token de session.
3. **Création d'espace** : écran pour créer une boutique / espace entrepreneur / agence depuis le compte de base.
4. **Écran de conversation individuelle** : ouvrir une conversation depuis la liste, avec envoi de fichiers, audio, et traduction automatique.
5. **Écran de tontine et Molo Molo Paie** (Phase 2 du cahier des charges).
6. **Gestion d'état globale** : envisager Zustand ou React Query une fois les appels API réels branchés, pour gérer le cache et le rafraîchissement des données.

## Conventions de code

- Toujours importer les couleurs depuis `src/theme/colors.ts` — ne jamais écrire de code couleur (`#...`) directement dans un écran.
- Un composant réutilisé à plus d'un endroit va dans `src/components/`.
- Les types métier partagés vont dans `src/types/index.ts`.
