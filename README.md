# NoteSnap 📝

Application de prise de notes moderne, offline-first avec support des photos, organisée par dossiers.

## 🌟 Fonctionnalités

- **Gestion de notes** : Création, édition, suppression de notes avec titres, contenu, tags et priorités
- **Organisation par dossiers** : Classez vos notes dans des dossiers colorés avec icônes
- **Support photos** : Ajoutez des photos à vos notes (compression automatique)
- **Mode offline** : Fonctionne entièrement sans connexion internet (IndexedDB + Service Worker)
- **Recherche avancée** : Recherchez dans vos notes par titre, contenu ou tags
- **Export PDF** : Exportez vos notes en PDF avec mise en forme
- **Thème sombre/clair** : Interface adaptée à vos préférences
- **PWA installable** : Installez l'application sur mobile et desktop
- **Responsive design** : Interface optimisée pour tous les appareils

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd notesnap

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## 📦 Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualisation du build de production
npm run lint         # Linter ESLint
```

## 🏗️ Structure du projet

```
notesnap/
├── public/              # Assets statiques et manifest PWA
│   ├── manifest.json    # Manifest PWA
│   ├── icon-192.png     # Icône 192x192
│   └── icon-512.png     # Icône 512x512
├── scripts/             # Scripts utilitaires
│   └── generate-icons.js # Génération des icônes
├── src/
│   ├── components/      # Composants React réutilisables
│   ├── db/             # Configuration IndexedDB (Dexie)
│   ├── hooks/          # Hooks personnalisés
│   ├── pages/          # Pages de l'application
│   ├── App.jsx         # Composant principal
│   ├── main.jsx        # Point d'entrée
│   └── index.css       # Styles globaux
├── index.html          # HTML racine
├── vite.config.js      # Configuration Vite + PWA
└── package.json        # Dépendances
```

## 🔧 Configuration PWA

### Manifest

Le fichier `public/manifest.json` contient la configuration PWA :
- Nom de l'application
- Icônes (192x192, 512x512)
- Thème de couleur
- Mode d'affichage (standalone)
- Raccourcis d'application

### Service Worker

Le Service Worker est généré automatiquement par `vite-plugin-pwa` avec Workbox :
- **Stratégie de cache** : CacheFirst pour les images, StaleWhileRevalidate pour les ressources statiques
- **Auto-update** : Mise à jour automatique du Service Worker
- **Skip waiting** : Activation immédiate des nouvelles versions
- **Clients claim** : Contrôle immédiat de tous les clients
- **Offline fallback** : Fallback sur index.html pour la navigation

### Caching

Les ressources sont cachées selon les stratégies suivantes :
- **Google Fonts** : CacheFirst (1 an)
- **Images** : CacheFirst (30 jours)
- **JS/CSS** : StaleWhileRevalidate (7 jours)
- **Assets statiques** : Précache lors de l'installation

## 🎨 Personnalisation des icônes

Pour régénérer les icônes avec un design personnalisé :

```bash
# Installer canvas (si pas déjà fait)
npm install canvas --save-dev

# Générer les icônes
node scripts/generate-icons.js
```

Le script génère des icônes avec :
- Dégradé violet (#6C63FF) → bleu (#3B82F6)
- Lettre "N" blanche centrée
- Coins arrondis
- Style moderne

## 🌐 Déploiement sur Vercel

### Préparation

1. **Build de production** :
```bash
npm run build
```

2. **Vérifier le build** :
```bash
npm run preview
```

### Déploiement

#### Option 1 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

#### Option 2 : Via GitHub

1. Pousser le code sur GitHub
2. Connecter le repository sur [vercel.com](https://vercel.com)
3. Vercel détectera automatiquement la configuration Vite
4. Cliquer sur "Deploy"

### Configuration Vercel

Aucune configuration supplémentaire n'est nécessaire. Vercel détecte automatiquement :
- Framework : Vite
- Build command : `npm run build`
- Output directory : `dist`
- Install command : `npm install`

### Variables d'environnement

Aucune variable d'environnement n'est requise pour le fonctionnement de base.

## ✅ Validation PWA

### Vérifier l'installation

1. **Chrome Desktop** :
   - Ouvrir les DevTools (F12)
   - Aller dans l'onglet "Application"
   - Vérifier "Manifest" et "Service Workers"

2. **Chrome Android** :
   - Ouvrir l'application dans Chrome
   - Cliquer sur le menu (⋮)
   - Vérifier "Installer NoteSnap" ou "Ajouter à l'écran d'accueil"

3. **Safari iOS** :
   - Ouvrir l'application dans Safari
   - Cliquer sur le bouton Partager (↑)
   - Sélectionner "Sur l'écran d'accueil"

### Tester le mode offline

1. **Chrome Desktop** :
   - Ouvrir les DevTools (F12)
   - Aller dans l'onglet "Network"
   - Cocher "Offline"
   - Rafraîchir la page
   - L'application doit fonctionner normalement

2. **Mobile** :
   - Activer le mode avion
   - Ouvrir l'application
   - Vérifier que les notes sont accessibles

### Lighthouse PWA Audit

```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Lancer l'audit
lighthouse http://localhost:5173 --view
```

Score cible :
- PWA : ≥ 90
- Performance : ≥ 90
- Accessibility : ≥ 90
- Best Practices : ≥ 90
- SEO : ≥ 90

## 🔒 Sécurité

- Les données sont stockées localement dans IndexedDB
- Aucune donnée n'est envoyée à un serveur externe
- Les photos sont compressées avant stockage
- Le Service Worker ne cache que les ressources nécessaires

## 📱 Compatibilité

### Navigateurs supportés

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### Mobile

- iOS 14+ (Safari)
- Android 10+ (Chrome)

## 🐛 Dépannage

### Le Service Worker ne se met pas à jour

```bash
# Supprimer les caches et le Service Worker
# Dans Chrome DevTools > Application > Service Workers
# Cliquer sur "Unregister" et "Clear storage"
```

### Les icônes ne s'affichent pas

```bash
# Régénérer les icônes
node scripts/generate-icons.js

# Rebuild
npm run build
```

### Erreur IndexedDB

```bash
# Dans Chrome DevTools > Application > IndexedDB
# Supprimer la base de données "NoteSnapDB"
# Rafraîchir la page
```

## 📝 Technologies utilisées

- **React 18** : Framework UI
- **Vite** : Build tool et dev server
- **React Router** : Navigation
- **Dexie** : IndexedDB wrapper
- **jsPDF** : Génération PDF
- **vite-plugin-pwa** : Configuration PWA
- **Workbox** : Service Worker

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📞 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur le repository.

---

**NoteSnap** - Vos notes, toujours disponibles. 📱✨
