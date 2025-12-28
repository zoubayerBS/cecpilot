# CEC Pilot 🫀

**Application de Gestion et d'Assistance Intelligente pour la Circulation Extracorporelle (CEC)**

Une plateforme web moderne pour la gestion des comptes rendus de CEC avec intelligence artificielle intégrée pour l'aide à la décision clinique et la prédiction des risques.

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Intelligence Artificielle](#intelligence-artificielle)
- [Architecture](#architecture)
- [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

CEC Pilot est une application web complète conçue pour les perfusionnistes et équipes de CEC. Elle combine la gestion documentaire, le monitoring en temps réel et l'intelligence artificielle pour améliorer la sécurité et l'efficacité des procédures de circulation extracorporelle.

### Objectifs Principaux

- **Digitalisation** : Remplacement des comptes rendus papier par des formulaires numériques structurés
- **Sécurité** : Alertes en temps réel basées sur les paramètres hémodynamiques
- **Intelligence** : Prédictions IA pour les risques de transfusion et complications
- **Traçabilité** : Historique complet et génération automatique de rapports PDF/QR

---

## ✨ Fonctionnalités

### 📝 Gestion des Comptes Rendus

- **Formulaire CEC complet** avec sections :
  - Identification patient et intervention
  - Équipe chirurgicale
  - Matériel (oxygénateur, circuits, canules)
  - Paramètres de perfusion
  - Bilan liquidien
  - Anticoagulation et médicaments
  - Gaz du sang et biologie
  - Incidents et complications
  
- **Sauvegarde automatique** : Toutes les 30 secondes
- **Validation en temps réel** : Schémas Zod pour la cohérence des données
- **Export PDF** : Génération de rapports professionnels avec QR code
- **Historique** : Consultation et modification des rapports antérieurs

### 🔴 Monitoring en Temps Réel

- **Surveillance hémodynamique** :
  - Pression artérielle (PAM, PAS, PAD)
  - Pression veineuse centrale (PVC)
  - Débit de perfusion
  - Température
  
- **Alertes intelligentes** :
  - Seuils configurables par paramètre
  - Désactivation automatique pendant le clampage
  - Notifications visuelles et sonores
  - Historique des alertes

### 🤖 Intelligence Artificielle

#### Modèles Prédictifs (TensorFlow.js)

1. **Prédiction de Transfusion**
   - Entrées : Poids, taille, âge, hématocrite
   - Sortie : Probabilité de besoin transfusionnel
   - Métriques : Précision, rappel, F1-score

2. **Analyse des Gaz du Sang**
   - Entrées : pH, pCO2, pO2, HCO3, lactate
   - Sortie : Détection d'acidose/alcalose
   - Classification : Normal, Warning, Alert

3. **Optimisation de Perfusion**
   - Calcul du débit optimal basé sur BSA et CI cible
   - Ajustement selon la température

#### TensorBoard Intégré

- **Visualisation en temps réel** des métriques d'entraînement
- **Graphiques** : Loss, accuracy, validation metrics
- **Import de datasets** : Support JSON pour entraînement personnalisé
- **Historique** : Suivi de l'amélioration du modèle

### 🛠️ Utilitaires

- **Gestion des listes** : Interventions, chirurgiens, personnel, matériel
- **Configuration** : Paramètres d'alerte, préférences utilisateur
- **Monitoring système** : État TensorFlow.js, mémoire, backend

### 👤 Authentification & Sécurité

- **Firebase Authentication** : Connexion sécurisée
- **Gestion des rôles** : Perfusionniste, administrateur
- **Sessions persistantes** : Cookies sécurisés
- **Protection des routes** : Middleware d'authentification

---

## 🚀 Technologies

### Frontend

- **Next.js 15.3** : Framework React avec App Router
- **React 18** : Interface utilisateur réactive
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling moderne et responsive
- **shadcn/ui** : Composants UI de haute qualité
- **React Hook Form** : Gestion des formulaires
- **Zod** : Validation de schémas

### Backend & Base de Données

- **Firebase** :
  - Authentication (gestion utilisateurs)
  - Firestore (base de données NoSQL)
  - Storage (fichiers et médias)
- **Drizzle ORM** : Migrations et requêtes SQL
- **PostgreSQL** : Base de données relationnelle (optionnelle)

### Intelligence Artificielle

- **TensorFlow.js 4.22** : Machine learning dans le navigateur
- **tfjs-vis** : Visualisation des modèles
- **Google Gemini AI** : Assistant conversationnel
- **Genkit** : Framework IA de Google

### Outils de Développement

- **Turbopack** : Bundler ultra-rapide
- **Jest** : Tests unitaires
- **ESLint** : Linting du code
- **TypeScript** : Vérification de types

---

## 📦 Installation

### Prérequis

- Node.js 20+ 
- npm ou yarn
- Compte Firebase (pour l'authentification et la base de données)
- Clé API Google Gemini (optionnel, pour l'assistant IA)

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/zoubayerBS/cecpilot.git
   cd cecpilot
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créer un fichier `.env.local` :
   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Google Gemini (optionnel)
   GEMINI_API_KEY=your_gemini_api_key
   
   # PostgreSQL (optionnel)
   DATABASE_URL=postgresql://user:password@localhost:5432/cecpilot
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Accéder à l'application**
   
   Ouvrir [http://localhost:9002](http://localhost:9002)

---

## ⚙️ Configuration

### Firebase Setup

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activer Authentication (Email/Password)
3. Créer une base Firestore
4. Configurer les règles de sécurité (`firestore.rules`)
5. Copier les credentials dans `.env.local`

### Base de Données (Optionnel)

Si vous utilisez PostgreSQL :

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:migrate
```

### TensorFlow.js

Le modèle est entraîné localement dans le navigateur. Aucune configuration serveur requise.

**Formats de données supportés pour l'import JSON :**

```json
[
  {
    "poids": 70,
    "taille": 170,
    "age": 65,
    "hematocrite": 25,
    "transfusion": 1
  }
]
```

---

## 💻 Utilisation

### Créer un Compte Rendu

1. Se connecter à l'application
2. Cliquer sur "Nouveau Rapport"
3. Remplir les sections du formulaire
4. Le rapport est sauvegardé automatiquement
5. Cliquer sur "Finaliser" pour terminer

### Monitoring en Temps Réel

1. Ouvrir un rapport en cours
2. Activer le monitoring dans la sidebar
3. Les alertes s'affichent automatiquement selon les seuils
4. Consulter l'historique des alertes

### Entraîner un Modèle IA

1. Aller dans **Utilitaires** → **État Système AI**
2. Cliquer sur "Ouvrir TensorBoard"
3. Choisir une option :
   - **Bootstrap** : Entraînement rapide avec données de base
   - **Entraîner** : Utiliser vos comptes rendus existants
   - **Importer JSON** : Charger un dataset externe

4. Observer les métriques en temps réel dans TensorBoard

### Générer un PDF

1. Ouvrir un rapport finalisé
2. Cliquer sur "Exporter PDF"
3. Le PDF inclut :
   - Toutes les données du rapport
   - QR code pour accès rapide
   - Signature numérique

---

## 🧠 Intelligence Artificielle

### Architecture des Modèles

```
┌─────────────────────────────────────┐
│     TensorFlow.js (Client-Side)     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Modèle Transfusion         │   │
│  │  Input: [4] features        │   │
│  │  Hidden: Dense(8, relu)     │   │
│  │  Output: Dense(1, sigmoid)  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Modèle Gaz du Sang         │   │
│  │  Input: [5] features        │   │
│  │  Hidden: Dense(10, relu)    │   │
│  │  Hidden: Dense(8, relu)     │   │
│  │  Output: Dense(1, sigmoid)  │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Entraînement

- **Optimiseur** : Adam (learning rate adaptatif)
- **Loss** : Binary Crossentropy
- **Métriques** : Accuracy, Precision, Recall, F1
- **Validation** : 20% split automatique
- **Early Stopping** : Patience de 5 époques
- **Normalisation** : Min-Max scaling

### Stockage

- **Modèles** : IndexedDB du navigateur
- **Métadonnées** : LocalStorage (min/max pour normalisation)
- **Logs** : Historique des 50 derniers entraînements

### Performance

- **Backend** : WebGL (accélération GPU)
- **Fallback** : CPU si WebGL indisponible
- **Mémoire** : Nettoyage automatique des tensors
- **Big Data** : Batch size adaptatif (8-128)

---

## 🏗️ Architecture

### Structure du Projet

```
cecpilot/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (authed)/          # Routes protégées
│   │   │   ├── dashboard/     # Tableau de bord
│   │   │   ├── rapports/      # Liste des rapports
│   │   │   ├── nouveau/       # Création de rapport
│   │   │   └── utilitaires/   # Gestion et AI
│   │   └── auth/              # Authentification
│   ├── components/            # Composants React
│   │   ├── cec-form/         # Formulaire CEC
│   │   ├── tools/            # Outils (TensorBoard, etc.)
│   │   └── ui/               # Composants shadcn/ui
│   ├── services/             # Logique métier
│   │   ├── ai-prediction.ts  # Modèles TensorFlow
│   │   ├── firebase.ts       # Configuration Firebase
│   │   └── pdf-generator.ts  # Génération PDF
│   ├── lib/                  # Utilitaires
│   └── types/                # Types TypeScript
├── public/                   # Assets statiques
├── drizzle/                  # Migrations DB
└── docs/                     # Documentation
```

### Flux de Données

```
User Input → React Hook Form → Zod Validation
     ↓
Firebase/Firestore ← Auto-save (30s)
     ↓
TensorFlow.js Models → Predictions
     ↓
UI Updates (Real-time monitoring)
```

---

## 🚢 Déploiement

### Firebase Hosting

```bash
# Build de production
npm run build

# Déployer sur Firebase
firebase deploy
```

### Vercel

```bash
# Connecter le dépôt GitHub
vercel

# Variables d'environnement à configurer dans Vercel Dashboard
```

### Docker (Optionnel)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur dev (port 9002)
npm run build            # Build production
npm run start            # Serveur production
npm run lint             # Linter ESLint
npm run typecheck        # Vérification TypeScript

# Base de données
npm run db:generate      # Générer migrations
npm run db:migrate       # Appliquer migrations

# Tests
npm run test             # Tests Jest (watch mode)

# IA
npm run genkit:dev       # Serveur Genkit
npm run genkit:watch     # Genkit avec hot-reload
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence privée. Tous droits réservés.

---

## 👨‍💻 Auteur

**Zoubayer Bensaid**

- GitHub: [@zoubayerBS](https://github.com/zoubayerBS)

---

## 🙏 Remerciements

- **shadcn/ui** pour les composants UI
- **TensorFlow.js** pour le machine learning client-side
- **Firebase** pour l'infrastructure backend
- **Next.js** pour le framework React

---

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `/docs`

---

**Version** : 0.1.0  
**Dernière mise à jour** : Décembre 2024
