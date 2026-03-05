# YELY - Application de VTC

Plateforme professionnelle de mise en relation entre chauffeurs et passagers, operant initialement dans la zone de Mafere. 
Architecture developpee et maintenue selon des standards industriels stricts.

## Architecture Technique

- **Frontend :** React Native (Expo), Redux Toolkit (State Management), RTK Query.
- **Backend :** Node.js, Express, MongoDB (Non inclus dans ce depot).
- **Temps Reel :** Socket.io pour la synchronisation des etats de course et le suivi GPS bidirectionnel.
- **Supervision :** Sentry (Echantillonnage ajuste pour la production).
- **UI/UX :** Composants modulaires (Glassmorphism), theme centralise, mode clair natif force.

## Pre-requis

- Node.js (v18 ou superieur recommande)
- npm ou yarn
- Application Expo Go (pour les tests physiques) ou simulateurs/emulateurs configures.

## Installation et Configuration

1. Installer les dependances du projet :
\`\`\`bash
npm install
\`\`\`

2. Configurer les variables d'environnement. Creer un fichier \`.env\` a la racine du projet avec les cles suivantes :
\`\`\`env
EXPO_PUBLIC_API_URL=url_de_votre_backend/api/v1
EXPO_PUBLIC_SOCKET_URL=url_de_votre_serveur_websocket
EXPO_PUBLIC_SENTRY_DSN=votre_dsn_sentry
EXPO_PUBLIC_USE_MOCK_LOCATION=false
\`\`\`
*(Note : Basculer EXPO_PUBLIC_USE_MOCK_LOCATION sur "true" permet de forcer le positionnement a Mafere lors des tests web).*

3. Lancer le serveur de developpement :
\`\`\`bash
npx expo start
\`\`\`

## Fonctionnalites Principales

- **Module Passager :** Geolocation, estimation algorithmique des tarifs, commande, suivi d'approche en temps reel.
- **Module Chauffeur :** Gestion de disponibilite, acceptation de courses, validation d'arrivee (par perimetre de securite), gestion d'abonnement.
- **Module Administratif :** Ecrans de controle pour validation des paiements (Superadmin/Partenaire) et gestion de la carte.
- **Resilience :** Gestion automatique de la reconnexion des sockets en sortie d'arriere-plan (AppState).

## Deploiement (Production)

Ce projet est configure pour exclure les modules experimentaux (ex: React Compiler) en production. 
La compilation des binaires (.apk, .aab, .ipa) pour soumission aux stores necessitera l'ajout et la configuration du fichier \`eas.json\` ainsi que la definition des \`bundleIdentifier\` et \`package\` dans le fichier \`app.json\`.