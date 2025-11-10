# Guide de développement - Mémoire du Mékong v2.7.0

**Dernière mise à jour : Phase 23 - Refactoring MemoriesPage**  
**Date : 7 novembre 2025**

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme une application de remémoration autour d'un carnet d'expériences de voyage interactif. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Stockage sur Google Drive
- **✨ Navigation par Moments :** Unités thématiques (1+ jours)
- **🏷️ Système de Thèmes :** Tags transversaux pour organiser les souvenirs
- **📰 Contenu Riche :** Articles Mastodon + galeries photos
- **💬 Sessions conversationnelles :** Dialogues autour des souvenirs
- **🔔 Notifications push :** Communication asynchrone entre utilisateurs
- **⚙️ Synchronisation Automatique :** Connexion Drive au démarrage

---

## Concepts de l'appli

### les Souvenirs

L'appli s'articule autour de données appelées **Souvenirs** = données brutes qui sont sauvegardées sur le Drive. Elles sont actuellement de 2 types :

- **Posts** issus de Mastodon : textes et photos associés
- **Photos** réparties dans des répertoires (issus d'albums de Google Photos)

Ces données a priori non modifiables, accessibles depuis un Google Drive, sont compilées dans un fichier **MasterIndex** qui introduit la notion de **Moment**.

La **page Mémoire = Souvenirs** permet d'accéder à l'ensemble des Souvenirs et d'interagir avec.

### ✨ Les Moments

**Moment :** un moment est un contenant regroupant plusieurs souvenirs.

Un moment représente une unité de temps/lieux. Par exemple : les posts et photos du jour 23 sont regroupés dans un Moment.

**Structure hiérarchique :**

```
Moment
├── Posts (articles Mastodon)
│   └── Photos des posts
└── Photos du moment (albums Google)
```

### 💬 Les Sessions

L'appli permet d'avoir des **Causeries = Chats = Sessions** qui sont des dialogues entre plusieurs utilisateurs autour d'un souvenir.

Chaque Session est sauvegardée dans Drive.

Une session éditée dans la page Chat a 4 états/priorités :

1. **NOTIFIED** 🔔 : Notification non répondue
2. **PENDING_YOU** : Dernier message ≠ currentUser
3. **PENDING_OTHER** : Dernier message = currentUser
4. **COMPLETED** ✅ : Marquée terminée

### Liens entre Sessions-Souvenirs

La base de l'utilisation de l'appli est de faire des aller-retours entre Chat et Mémoire.

La réciprocité des interactions et la fluidité de la navigation sont essentielles.

#### 🔗 Système de liens

Il est possible d'insérer des Souvenirs (ou plutôt des liens vers souvenirs) (photos, liens vers posts, liens vers moments) dans les Chats. Les souvenirs sont alors étiquetés comme "linkés".

Fichiers concernés : `ContentLinks.js`, `SessionInfoPanel.jsx`

Structure de données sur le Drive (`content-links.json`) :

```json
{
  "version": "1.0",
  "lastModified": "2025-10-31T14:49:48.473Z",
  "links": [
    {
      "id": "link_1761824554004_vineo47dy",
      "sessionId": "sid_1760274006275",
      "messageId": "sid_1760274006275-origin",
      "contentType": "moment",
      "contentId": "moment_92_92_83",
      "contentTitle": "Souvenirs du moment : Cacahouète de Don Nangloy",
      "linkedAt": "2025-10-30T11:42:34.004Z",
      "linkedBy": "tom"
    }
  ]
}
```

#### 🏷️ Système de Tags = Thèmes

Il est possible d'associer des **Thèmes = Tags** à des souvenirs ou des Chats.

Fichiers concernés : `ThemeAssignments.js`, `ThemeModal.jsx`

Les Tags permettent un autre regroupement transversal des souvenirs (différent de celui des moments attachés à un temps/lieu).

---

## Navigation et design

La page de l'appli est divisée en 3 :

- **Top Bar** (gérée dans `UnifiedTopBar.jsx`)
- **Page centrale**
- **Bottom Nav Bar**

### Les pages de l'appli

- **Startup** : Démarrage avec connexion + chargement + sélection user (`StartupPage.jsx`)
- **Sessions** : Liste des discussions en cours regroupées en volets selon leur statut (`SessionsPage.jsx`)
- **Mémoires** : Liste des souvenirs organisés hiérarchiquement (`MemoriesPage.jsx`)
- **Chat** : Discussions sous forme de dialogue d'appli de messagerie (`ChatPage.jsx`)
- **Settings** : Réglages utilisateurs, statistiques, régénérations (`SettingsPage.jsx`)
- **Home** : La HomePage est actuellement la page Sessions

### Les barres

Les barres sont contextuelles par rapport aux Pages :

- **BottomBar** : Navigation entre pages
- **TopBar** : Actions, filtres d'affichage et ordonnancement

---

## Principes de UX design

- **Intuitive et sobre** : Minimum essentiel d'information visible affiché sans explications textuelles
- **Simple et fluide** : Navigation fluide et rapide en un toucher pour l'essentiel. Tout doit être accessible en 3 clics max
- **Hiérarchique** : L'essentiel accessible en un clic. Mais pour ceux qui veulent aller plus loin, 2 niveaux de profondeur gérés avec des systèmes de **volets** (ouverture/fermeture) et **modals**
- **Responsive** : L'appli est utilisée essentiellement en version smartphone (portrait). Elle doit être utilisable aussi en Desktop et tablette (paysage)

### Utilisation des couleurs

Chaque élément interactif a une couleur et icône associées pour identification rapide :

- **Type d'élément** : liens (violet), thèmes (jaune/ambre), posts (bleu), messages (violet)
- **Statuts de Session** : notifié/alerte (orange), en attente (jaune), envoyés (verts), clos (bleu), archivés (gris)
- **Couleurs utilisateur** : Chaque utilisateur et chaque thème a une couleur associée (définie par l'utilisateur)

**À développer** : Version clair/sombre avec code couleurs qui demeure

### Gestion des couches

Par couche, on entend couches visuelles/superpositions. Actuellement 2 niveaux :

1. Couche principale
2. Modals (équivalent à menu ou fenêtre) et PhotoViewer

---

## 🏗 Architecture générale

### Stack technique

- **React 18** (hooks, refs, forwardRef)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Google Drive API** (stockage + notifications)

### Pattern architectural

- **MVVM-like** : DataManager ↔ useAppState ↔ Components
- **Pub/Sub** : Listeners pour synchronisation
- **Repository** : DriveSync pour abstraction stockage
- **Window Callbacks** : Communication TopBar ↔ Pages
- **Notification System** : NotificationManager + polling Drive
- **Theme System** : ThemeAssignments + index inversé
- **🆕 Custom Hooks** : Séparation logique métier/rendu (Phase 23)
- **🆕 Component-based** : Architecture modulaire par responsabilité (Phase 23)

---

## 📁 Structure des fichiers v2.7.0

```
src/
├── components/
│   ├── App.jsx                      # Point d'entrée (v2.2)
│   ├── UnifiedTopBar.jsx            # ✅ Barre contextuelle (v2.5)
│   ├── Navigation.jsx               # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx              # ✅ (v2.7.1 - Thèmes fixes)
│   ├── ThemeModal.jsx               # ✅ (v1.2 - z-index + redirect)
│   ├── SessionCreationModal.jsx     # (v1.1)
│   ├── SessionListModal.jsx
│   ├── SessionCreationSpinner.jsx
│   ├── StatsModal.jsx
│   ├── TimelineRule.jsx             # (v3.1)
│   │
│   ├── pages/
│   │   ├── MemoriesPage.jsx         # ✅ v7.0 - Refactoré (~700 lignes)
│   │   ├── SessionsPage.jsx         # ✅ (v6.2 - groupes + notifications)
│   │   ├── ChatPage.jsx             # (v2.1 - PhotoMessage)
│   │   ├── SettingsPage.jsx         # ✅ (v4.2 - Ordre thèmes + Moment tagging)
│   │   └── UserSelectionPage.jsx
│   │
│   └── memories/                    # 🆕 v7.0 - Architecture modulaire
│       ├── hooks/                   # Logique métier séparée
│       │   ├── useMemoriesState.js      # Gestion états (toggles, modals)
│       │   ├── useMemoriesFilters.js    # Logique filtrage + tri
│       │   └── useMemoriesScroll.js     # Navigation + scroll
│       │
│       ├── shared/                  # Composants transversaux
│       │   ├── SessionBadges.jsx        # Badges sessions (2 variantes)
│       │   ├── ContentBadges.jsx        # Badges thèmes/chat/liens
│       │   └── PhotoContextMenu.jsx     # Menu contextuel photo
│       │
│       ├── moment/                  # Composants Moment
│       │   ├── MomentCard.jsx           # Carte moment (orchestrateur)
│       │   ├── MomentHeader.jsx         # En-tête moment
│       │   └── MomentContent.jsx        # Container posts + photos
│       │
│       ├── post/                    # Composants Post
│       │   └── PostArticle.jsx          # Article Mastodon complet
│       │
│       ├── photo/                   # Composants Photo
│       │   ├── PhotoThumbnail.jsx       # Thumbnail avec lazy load
│       │   ├── PhotoGrid.jsx            # Grille responsive
│       │   └── PhotoGridHeader.jsx      # En-tête section photos
│       │
│       └── layout/                  # Layout & helpers
│           ├── MomentsList.jsx          # Liste moments
│           └── helpers.js               # Fonctions utilitaires
│
├── core/
│   ├── dataManager.js               # ✅ v3.5 - Photo user message
│   ├── ConnectionManager.js         # v0.9.0 - Token OAuth
│   ├── DriveSync.js                 # Pagination (pageSize: 1000)
│   ├── StateManager.js              # v0.7.0
│   ├── UserManager.js               # ✅ v2.1 - getAllUsers
│   ├── PhotoDataV2.js               # v3.6 - Mobile optimized
│   ├── MastodonData.js              # v0.8
│   ├── MasterIndexGenerator.js      # ✅ v5.0 - Thèmes
│   ├── NotificationManager.js       # ✅ v1.0 - Push notifications
│   └── ThemeAssignments.js          # ✅ v2.0 - Index inversé + Batch
│
├── hooks/
│   └── useAppState.js               # ✅ + sendNotification, getUnreadCount
│
├── utils/
│   ├── sessionUtils.js              # ✅ v2.0 - SESSION_STATUS.NOTIFIED
│   └── themeUtils.js                # ✅ v1.1 - sortThemes + helpers
│
└── main.jsx                         # ✅ + ThemeAssignments injection
```

### 🆕 Architecture MemoriesPage v7.0

**Refactoring majeur (Phase 23)** :

- **Avant** : 2348 lignes monolithiques
- **Après** : 17 fichiers modulaires (~2000 lignes total)
  - MemoriesPage.jsx : ~700 lignes (orchestrateur)
  - 3 hooks : ~730 lignes (logique métier)
  - 11 composants : ~1270 lignes (rendu)
  - 1 helpers : ~70 lignes (utilitaires)

**Bénéfices** :

- ✅ Responsabilité unique par fichier
- ✅ Logique métier séparée du rendu
- ✅ Composants réutilisables et testables
- ✅ Maintenance facilitée
- ✅ Onboarding développeur simplifié

---

## 🧩 Structure Drive

Sur le Drive, 2 dossiers :

- **"Medias"** : Données brutes issues du voyage
- **"MemoireDuMekong-Data"** : Données créées via l'appli

```
Medias/
├── Photos/
│   ├── 1. Jour 1 Bangkok/
│   │   └── IMG001.jpg (google_drive_id: xxx)
│   └── 2-3. Ayutthaya/
│       └── IMG003.jpg
└── Mastodon/
    └── Mastodon_Photos/  ← ✅ Structure aplatie
        ├── photo1.jpg (google_drive_id: aaa)
        └── photo2.jpg (google_drive_id: bbb)
```

---

## 🔧 Méthodologie de travail

1. **Étapes incrémentales** : Petites modifications testables
2. **Tests immédiats** : Vérifier après chaque changement
3. **Documentation synchrone** : Mettre à jour le guide à chaque grande étape achevée
4. **Git commits fréquents** : Historique clair
5. **Analyse méthodique** : Logs → hypothèses → tests
6. **Fichiers complets** : Éviter copier/coller fragmenté
7. **🆕 Refactoring régulier** : Maintenir une architecture propre

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement
- [ ] Vérifier `currentUser.id` vs `currentUser`
- [ ] 🆕 Vérifier imports relatifs (chemins corrects)
- [ ] 🆕 Extension fichiers (.jsx pour composants React)

---

## ✨ Phases complétées

### Phases historiques (1-22)

*[Conserver l'historique existant des phases 1-22]*

### Phase 25 : Mode clair/sombre

**Objectif :** Implémenter un thème sombre avec conservation du code couleurs

---

### Phase 24 : Refactoring UnifiedTopBar

```
src/components/topbar/
├── TopBar.jsx              // Container principal (router)
├── SessionsTopBar.jsx      // Page Sessions
├── ChatTopBar.jsx          // Page Chat
├── MemoriesTopBar.jsx      // Page Memories
├── SettingsTopBar.jsx      // Page Settings
└── OverflowMenu.jsx        // Menu "..." commun
```

---

La top est composée de 3 parties

#### 🎨 Design Pattern (Gauche → Centre → Droite)

##### Gauche : Action principale

- **Sessions** : `+ Nouvelle`
- **Chat** : `✕ Fermer`
- **Memories** : `🔍 Recherche`
- **Settings** : `← Retour`

##### Centre : Contexte page

- **Sessions** : Stats (n causeries actives/en attente)
- **Chat** : `Titre | 🔔 | ℹ️ | 🏷️`
- **Memories** : `📄 📸 📋 | Filtres ▼ | Tri ▼`
- Settings**

##### Droite : Overflow + Communs

```
Menu "..." :
├─ Actions secondaires page
├─ ─────────────
├─ 👤 [Nom User] → Settings
├─ ⚙️  Réglages
└─ 🌙 Mode sombre
```

#### Page Memoire :

##### nouveau système de filtre hierarchique

```
🎯 Moment  → masque/affiche TOUT le bloc moment
📰 Post    → masque/affiche TOUS les posts
📸 Photo   → masque/affiche TOUTES les photos
```

##### Rendu visuel proposé : MemoriesTopBar Centre :

```
┌─────────────────────────────────────────┐
│ [🎯] [📰] [📸] │ Filtres ▼ │ Tri ▼    │
│  ON   ON   ON                            │
└─────────────────────────────────────────┘
```

---

### Phase 23 : Refactoring MemoriesPage (Architecture modulaire)

**Date :** 7 novembre 2025

**Objectif :** Refactoriser MemoriesPage.jsx (2348 lignes monolithiques) en architecture modulaire

#### 23.1 : Extraction Hooks (Phase 1)

**Fichiers créés :**

- `useMemoriesState.js` : Gestion complète des états (toggles, modals, sélection)
- `useMemoriesFilters.js` : Logique filtrage + tri (recherche, thèmes, ordre)
- `useMemoriesScroll.js` : Navigation + scroll automatique

**Bénéfices :**

- Séparation logique métier / rendu
- États centralisés et testables
- Réduction ~350 lignes dans MemoriesPage.jsx

#### 23.2 : Extraction Composants Shared (Phase 2)

**Fichiers créés :**

- `SessionBadges.jsx` : Badges sessions (2 variantes)
- `ContentBadges.jsx` : Badges thèmes/chat/liens
- `PhotoContextMenu.jsx` : Menu contextuel photo

**Bénéfices :**

- Composants réutilisables
- Code DRY (Don't Repeat Yourself)

#### 23.3 : Extraction Composants Photo (Phase 3)

**Fichiers créés :**

- `PhotoThumbnail.jsx` : Thumbnail avec lazy load + badges
- `PhotoGrid.jsx` : Grille responsive avec mode sélection
- `PhotoGridHeader.jsx` : En-tête section photos

**Bénéfices :**

- Gestion photos isolée
- Performance optimisée (lazy loading)

#### 23.4 : Extraction Composants Post (Phase 4)

**Fichiers créés :**

- `PostArticle.jsx` : Article Mastodon complet (header + texte + photos)

- `MomentCard.jsx` : Orchestrateur moment (gestion état local)

- `MomentHeader.jsx` : En-tête avec titre + compteurs + badges

- `MomentContent.jsx` : Container posts + photos moment

- `MomentsList.jsx` : Liste moments avec filtrage

- `helpers.js` : Fonctions utilitaires (enrichMomentsWithData, normalizePhoto, etc.)

**Métriques :**

- Fichiers créés : 17
- Réduction complexité : -70% dans fichier principal
- Lignes code : 2348 → 700 (MemoriesPage) + 2000 (modules)
- Maintenabilité : +++
- Testabilité : +++

**Architecture finale :**

```
MemoriesPage.jsx (orchestrateur)
    ↓
├── Hooks (logique métier)
├── Composants Moment
│   ├── Header
│   └── Content
│       ├── Posts
│       └── Photos
└── Shared (badges, modals)
```

**Validation :** ✅ Tests complets réussis - Application fonctionnelle

---

## 🎯 Prochaines phases envisagées

### Phase 24 : Sessions archivées comme souvenirs

**Objectif :** Permettre aux sessions closes d'apparaître comme souvenirs de même niveau que les moments

**À définir :**

- Structure données
- Interface affichage
- Navigation

### Phase 26 : Optimisations performances

**Objectif :**

- Virtualisation liste moments (si >50 éléments)
- Optimisation images (WebP, compression)
- Cache intelligent

---

**Version du guide :** 2.7.0  
**Dernière révision :** Phase 23 - Refactoring MemoriesPage  
**Prochaine mise à jour :** À définir selon développements futurs
