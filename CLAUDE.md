# CLAUDE.md - AI Assistant Guide for Mémoire du Mékong

> **Version:** 2.17 "Simplification Règles d'Affichage" | **Last Updated:** December 13, 2025
> **Purpose:** Comprehensive guide for development teams and AI assistants working on this codebase

---

## 🎯 Project Overview

**Mémoire du Mékong** is a Progressive Web App that transforms a travel diary into an interactive, conversation-based memory exploration platform. Users can discuss and organize travel experiences through themed "sessions" (chats), explore a timeline of "moments" (thematic units), and manage photos and Mastodon posts.

**Current Version:** 2.17 - Simplification Règles d'Affichage
**Release Date:** December 13, 2025
**Total LOC:** ~9,360 lines (-40 grâce à simplification)
**Language:** JavaScript (ES6+), no TypeScript
**Code Language:** French comments/documentation with English variable names

### ⚠️ Version 2.9 - État Actuel (1/3 Complete)

**🚧 INFRASTRUCTURE FONCTIONNELLE (✅ Partie 1/3)**
- ✅ État global `editionMode` dans App.jsx
- ✅ Bouton "Mode édition" dans MemoriesTopBar menu (icône rouge 📝)
- ✅ Barre rouge "Mode Édition" affichée sous TopBar quand actif
- ✅ Handlers : `handleToggleEditionMode()`, `handleCancelEditionMode()`
- ✅ Désactivation automatique lors changement de page
- ✅ Bouton "Quitter" dans la barre rouge

**🔨 EN ATTENTE (Parties 2 & 3)**
- ⏳ Modals d'édition : EditMomentModal, EditPostModal, ConfirmDeleteModal
- ⏳ Boutons conditionnels dans MomentHeader (📝 Éditer / 🗑️ Supprimer)
- ⏳ Boutons conditionnels dans PostArticle (📝 Éditer / 🗑️ Supprimer)
- ⏳ Bouton suppression dans PhotoThumbnail (🗑️ Supprimer)
- ⏳ Méthodes CRUD dans dataManager : `updateMoment()`, `deleteMoment()`, `updatePost()`, `deletePost()`, `deletePhoto()`

**📋 RÈGLES D'ÉDITION (Design Final)**
- **Moments Mastodon** (source: 'mastodon') → NON ÉDITABLES (seulement thèmes)
- **Moments Importés** (source: 'imported') → ÉDITABLES (titre, date, jnnn) + SUPPRIMABLES
- **Posts Mastodon** (category: 'mastodon') → NON ÉDITABLES
- **Photo Notes** (category: 'user_added') → ÉDITABLES (titre, contenu) + SUPPRIMABLES
- **Photos Importées** (source: 'imported') → SUPPRIMABLES uniquement

---

## 📝 Recent Changelog

### Version 2.17 (December 13, 2025) - SIMPLIFICATION Règles d'Affichage ✅

**🎯 Objectif : Simplification maximale du code d'affichage MemoriesPage**
- Minimum de règles et d'exceptions
- Code simple et optimisé
- Suppression des états locaux redondants
- Documentation complète des règles

---

#### 📐 RÈGLES D'AFFICHAGE COMPLÈTES

**✅ RÈGLES GLOBALES (TopBar - MemoriesTopBar.jsx)**

Nomenclature : **AM/AT/AP** (Affichage) + **DM/DT/DP** (Déploiement)

| Bouton | Code | Fonction |
|--------|------|----------|
| **✨ Structure** | AM | Affiche/Masque les en-têtes moments |
| **🗒️ Textes** | AT | Affiche/Masque les volets posts |
| **📸 Images** | AP | Affiche/Masque les volets photos |
| **> Structure** | DM | Déplie/Replie tous les moments |
| **> Textes** | DT | Déplie/Replie tous les posts |
| **> Images** | DP | Déplie/Replie toutes les grilles photos |

**Protection :** Au moins 1 filtre AM/AT/AP doit être actif (impossible de tout masquer).

**État par défaut :**
```
AM=1  DM=0    (Structure affichée, Moments fermés)
AT=1  DT=1    (Textes affichés, Posts dépliés)
AP=1  DP=1    (Images affichées, PhotoGrids dépliées)
```

---

**✅ RÈGLES LOCALES (Volets - MomentHeader.jsx / PostArticle.jsx)**

Format identique au global pour cohérence :
- **Icône** (📸/🗒️) = **AFFICHAGE** du volet (comme AM/AT/AP)
- **Texte** ("X photos") = **DÉPLOIEMENT** du volet (comme DM/DT/DP)

**Les boutons globaux commandent les boutons locaux (pas l'inverse).**

Exemples :
- Clic sur icône 🗒️ dans MomentHeader → Toggle affichage volet posts
- Clic sur texte "5 posts" → Toggle déploiement posts + scroll vers volet

---

**✅ RÈGLES D'INTERACTION Global ↔ Local**

**1. Mode Structure (AM=1) :**
- Volets visibles **SEULEMENT** si moment parent ouvert
- Fermer moment → masque automatiquement ses volets

**2. Mode Vrac (AM=0) :**
- Structure invisible = tous moments "ouverts" implicitement
- Tous volets visibles selon AT/AP (pas de notion de "moment parent")
- Affichage en liste continue (FlatContentList)

**3. Reset cascade (fermeture moment) :**
- Fermer un moment (DM) → replier automatiquement ses posts/photoGrids enfants
- Évite de garder l'état des enfants en mémoire
- Simplifie la gestion d'état

**4. Ouverture moment (chevron) :**
- Ouvrir moment avec état local par défaut = **état global (AT/AP)**
- `showPosts = AT`, `showDayPhotos = AP`
- Pas de règle auto spéciale

**5. Scroll automatique :**
- Déclenché **UNIQUEMENT** par clic sur bouton **TEXTE** local (déploiement)
- Scroll vers le volet qui vient de s'ouvrir
- **PAS** de scroll si on referme
- **PAS** de scroll depuis bouton ICÔNE (affichage)
- **PAS** de scroll depuis boutons globaux TopBar
- Délai 100-150ms pour attendre le rendu

**6. Griser badges locaux :**
- Badge local en **COULEUR** si : Filtre global ON **ET** volet local affiché
- Badge local **GRISÉ** si : Filtre global OFF **OU** volet local masqué

**7. Persistance localStorage :**
- État d'affichage sauvegardé : `contentFilters`, `expanded`, `sortOrder`
- Clé : `mekong_memories_display`
- Restauré au chargement de la page

---

#### 🔧 SIMPLIFICATIONS TECHNIQUES (v2.17)

**PostArticle.jsx (v8.0) :**
- ❌ Supprimé : États locaux `isPostExpanded`, `showThisPostPhotos`
- ❌ Supprimé : 3 useEffect de synchronisation
- ✅ Remplacé par : Calculs directs depuis Context
- **Gain :** ~40 lignes de code, plus de cycles de synchronisation

**MomentHeader.jsx (v8.0) :**
- ❌ Supprimé : Logique auto-open conditionnelle
- ✅ Remplacé par : État par défaut = filtres globaux AT/AP
- **Gain :** Cohérence totale Global ↔ Local

**Architecture :**
- **Source unique de vérité :** Context (`MemoriesDisplayContext.jsx`)
- **Pas d'états locaux** pour synchroniser expansion
- **Computed values** calculés à la volée
- **Zero polling** (réactivité native React)

---

#### 📊 Métriques de simplification

| Métrique | Avant v2.17 | Après v2.17 | Gain |
|----------|-------------|-------------|------|
| États locaux (PostArticle) | 2 | 0 | -2 |
| useEffect (PostArticle) | 3 | 0 | -3 |
| Lignes de code (PostArticle) | ~450 | ~410 | -40 |
| Règles auto spéciales | 2 | 0 | -2 |
| Cycles de synchronisation | ~6 | 0 | -6 |

---

### Version 2.10 (December 1, 2025) - Archivage par Consensus ✅

**🎯 Nouvelle Règle: Archivage Collaboratif**
- L'archivage d'une session nécessite maintenant l'accord des **DEUX** utilisateurs
- Empêche l'archivage unilatéral d'une conversation active
- Workflow transparent avec message système et feedback

**✅ Infrastructure Archivage Consensus:**

**dataManager.js** - 4 nouvelles méthodes:
- `requestArchive(sessionId)` : User A demande l'archivage
- `acceptArchiveRequest(sessionId)` : User B accepte → session archivée
- `rejectArchiveRequest(sessionId)` : User B refuse → demande supprimée
- `cancelArchiveRequest(sessionId)` : User A annule sa propre demande

**Structure session** - Nouveau champ `archiveRequest`:
```javascript
{
  archiveRequest: {
    requestedBy: 'alice',           // User qui demande
    requestedAt: '2025-12-01...',   // Timestamp demande
    status: 'pending',              // 'pending' | 'accepted' | 'rejected'
    acceptedBy: 'bob',              // User qui accepte (si accepted)
    acceptedAt: '2025-12-01...'     // Timestamp acceptation
  },
  archived: true,                    // true seulement si accepté
  archivedBy: 'consensus'            // Indique archivage par consensus
}
```

**✅ UI Composants:**

**ChatTopBar** - Menu dynamique:
- **Sans demande** : "Demander archivage"
- **Avec demande (par moi)** : "Annuler ma demande d'archivage"
- Pas d'option "Désarchiver" (archivage définitif par consensus)

**ArchiveRequestMessage** - Message système:
- Design bleu/amber distinctif avec icône Archive
- Affiché uniquement pour l'autre user (pas le demandeur)
- Message: "X a demandé à clore cette session"
- Boutons : **Accepter** (vert) | **Refuser** (rouge)
- Accepter → Archive session + retour automatique SessionsPage
- Refuser → Toast feedback + demande supprimée

**Toast** - Système de notifications:
- Composant Toast.jsx réutilisable
- Variants: success, error, info
- Animation slide-up depuis le bas
- Auto-fermeture après 3 secondes
- Position: `bottom-20` centrée (au-dessus bottom nav)

**✅ Workflow Complet:**

**Scénario 1 : Acceptation**
1. Alice clique "Demander archivage" dans menu TopBar
2. Bob voit message système "Alice a demandé à clore cette session"
3. Bob clique **Accepter**
4. Session archivée pour tous
5. Bob redirigé vers SessionsPage
6. Alice voit la session dans section "Archivées" lors de sa prochaine visite

**Scénario 2 : Refus**
1. Alice clique "Demander archivage"
2. Bob voit message système
3. Bob clique **Refuser**
4. Toast affiché : "Demande de Alice refusée"
5. Message système disparaît
6. Conversation continue normalement

**Scénario 3 : Annulation**
1. Alice clique "Demander archivage"
2. Avant que Bob réponde, Alice change d'avis
3. Alice clique "Annuler ma demande d'archivage"
4. Demande supprimée
5. Bob ne voit plus le message système

**🔧 Détails Techniques:**
- Persistance: `archiveRequest` sauvegardé dans `session_XXX.json` sur Drive
- Visibilité conditionnelle : Message système filtré par `requestedBy !== currentUser`
- Spinners: Monkey variant pour toutes opérations archivage
- Toast CSS: Keyframe `@keyframes slide-up` dans `index.css`
- Boutons désactivés pendant traitement (`isProcessing` state)

---

### Version 2.9x (December 1, 2025) - Sessions UX Complete ✅

**🐛 CRITICAL FIX: "new" vs "unread" status tracking**
- **Root Cause**: Tracking was NEVER written to localStorage (only read!)
- `hasBeenOpened` and `lastOpenedAt` were never saved
- All sessions appeared as "new" regardless of actual state

**✅ Solution Implemented:**

**ChatPage.jsx**: Session tracking on open
- New useEffect when session opens → writes tracking to localStorage
- Sets `hasBeenOpened = true` and `lastOpenedAt = current timestamp`
- Calls `dataManager.notify()` to refresh badges in all components

**SessionsPage.jsx**: Auto-sync from localStorage
- New useEffect re-reads tracking when `app.sessions` changes
- Local state syncs automatically with localStorage updates
- Detects changes from ChatPage navigation

**📊 Status Logic (Correctly Implemented):**
- **NEW**: Session created by other user, NEVER opened by current user (`!hasBeenOpened`)
- **UNREAD**: Session previously opened, has new message since last open (`lastMessageTime > lastOpenedAt`)
- **READ**: Up to date with all messages

**✨ UX Improvements: Search in Sessions**
- Replaced 💬 "Toutes" button with 🔎 search button in SessionsTopBar
- Added total count display: "Causeries (42)"
- Search input opens below TopBar (like MemoriesPage)
- Intelligent scoring: title match = 100 points, message match = 10 points each
- Real-time results counter: "X résultat(s) trouvé(s)"
- Search filters by title OR message content
- Results sorted by relevance score

**✨ Badge on Bottom Navigation**
- Session icon now shows badge with total: `notified + new + unread`
- Badge formula matches SessionsTopBar logic
- Updates in real-time when sessions are read
- Red badge with count (9+ max display)

**🔧 Technical Details:**
- Storage key: `mekong_sessionReadStatus_${userId}`
- Structure: `{[sessionId]: {hasBeenOpened: boolean, lastOpenedAt: ISO timestamp}}`
- SessionsTopBar reads directly from localStorage (no stale cache)
- Navigation.jsx reads directly from localStorage in useMemo
- All components re-render when sessions change via `dataManager.notify()`

---

### Version 2.9w6 (November 30, 2025) - Fix Retour Auto MemoriesPage v2 ✅

**🐛 HOTFIX: Navigation method fix**
- Fix critical error: `app.navigateTo is not a function`
- Replaced all `app.navigateTo()` calls with `dataManager.updateState()`
- Fixed in ChatPage.jsx (4 occurrences) for auto-return to MemoriesPage
- Auto-return now works correctly after deletion from Modal 2

**✨ UX Improvements: ChatPage input area (iMessage style)**
- Redesigned input section with smaller + button on left
- Send button integrated at bottom-right of textarea (rounded pill style)
- Wider textarea with better use of horizontal space
- Adaptive dark mode support
- More modern, clean appearance

**✨ UX Improvements: CrossRefsWarningModal**
- Removed colored frame from info message (now neutral gray text)
- Synthesized message: "Les photos que vous voulez supprimer du cloud, sont encore utilisées..."
- Links more prominent with MessageCircle icon before session title
- Session format: `[icon] Session Title : italic preview (author, date)`
- Better visual hierarchy for easier scanning

**🧹 Code Cleanup**
- Removed 10+ debug console.logs from MemoriesPage.jsx
- Commented out `📸 Photo data:` log in PhotoThumbnail.jsx
- Cleaner console output for production

**📱 Mobile Optimization: Edit mode banner**
- Reduced from 4+ lines to 2 lines on mobile
- Compact padding: `px-4 py-3` → `px-3 py-2`
- Smaller text: `text-lg` → `text-base` for title, `text-sm` → `text-xs` for instructions
- Simplified instructions: "Modifier" and "Supprimer" with icons only
- Less horizontal spacing: `gap-2` and `gap-1` instead of `space-x-4`

### Version 2.9n (November 22, 2025) - Suppression Sécurisée ✅

**🐛 Bug Fix: Suppression thumbnails**
- Les thumbnails (`_thumb.ext`) n'étaient pas supprimés du Drive
- Ajout `findFileIdByName()` dans DriveSync pour retrouver fichiers par nom
- `deletePhoto()` supprime maintenant fichier principal + thumbnail
- Pattern automatique: `filename.ext` → `filename_thumb.ext`

**🔒 Sécurité: Vérification cross-références**
- `checkPhotoCrossReferences()`: Détecte si photo utilisée dans plusieurs moments
- `collectMomentPhotos()`: Inventaire complet photos d'un moment
- Vérification AVANT suppression Drive (Option A validée par user)
- `deletePhoto()` retourne `{success: false, reason: 'cross_references', crossRefs: [...]}` si photo utilisée ailleurs
- `deleteMoment()` vérifie toutes photos en amont de la cascade
- Empêche casse de références accidentelle

**📦 Nouvelles méthodes (dataManager.js)**
```javascript
checkPhotoCrossReferences(photoId, excludeMomentId) // Retourne liste moments utilisant photo
collectMomentPhotos(moment, deleteNoteIds)          // Inventaire photos du moment
```

**📦 Nouvelles méthodes (DriveSync.js)**
```javascript
findFileIdByName(filename, folderPath)  // Recherche fichier par nom dans Drive
```

### Version 2.9m (November 22, 2025) - Upload Optimisé Photo Souvenir 🚀

**✨ Nouvelle séquence UX améliorée**
1. Sélection photo → Spinner court "Préparation..." (~1s)
2. Conversion locale (compression + thumbnail) **en mémoire**
3. Modal création moment s'ouvre **immédiatement**
4. Preview photo dans Chat (ObjectURL temporaire)
5. Upload Drive + création moment **SEULEMENT à l'envoi message**
6. Si annulation → cleanup mémoire, **0 gaspillage cloud** ✅

**📦 Nouvelles fonctions (imageCompression.js)**
```javascript
processImageLocally(file, userId)      // Conversion locale sans upload
uploadProcessedImage(processedData, userId)  // Upload image prétraitée
cleanupProcessedImage(processedData)   // Nettoyage ObjectURLs
```

**🎯 Avantages**
- UX plus fluide (attente répartie, non-bloquante)
- Pas de gaspillage cloud si annulation
- Un seul spinner après validation (upload + création)
- Compatible avec ancien flow (photoData direct)

### Version 2.9l2 (November 16, 2025) - Cadres Photos Distinctifs 🔴🔵

**🖼️ Distinction visuelle photos importées dans ChatPage**
- PhotoENVrac (sans association moment): **Bordure ROUGE** `border-4 border-red-500`
- PhotoSouvenir (associée à moment): **Bordure BLEUE** `border-4 border-blue-500`

**🔍 Enrichissement automatique momentId**
- `findPhotoMomentId()`: Recherche photo dans masterIndex
- Enrichissement `message.photoData` avant affichage
- Recherche dans `moment.dayPhotos[]` et `moment.posts[].photos[]`
- Matching par `google_drive_id` ET `filename`

**🐛 Fix syntaxe JSX**
- Correction erreur: `Expected "..." but found "}"`
- Déplacement commentaires JSX hors des props

---

### Version 2.8f Highlights (Stable)

✅ **Photo Souvenir depuis MemoriesPage** - Bouton dans TopBar menu
✅ **Spinner pendant upload** - Feedback "Traitement de l'image..."
✅ **Scroll automatique** - Vers textarea après conversion
✅ **Inputs compacts** - Date/Jnnn optimisés dans modal
✅ **Fix Jundefined** - Affichage correct du jnnn pour moments importés
✅ **Pastilles violettes** - Sur photos liées (double linking post+photo)

---

## 🛠 Tech Stack

### Core Framework
- **React 18.2.0** - UI framework (hooks-based, no class components)
- **Vite 7.1.7** - Build tool (zero-config with defaults)
- **JavaScript ES6+** - Modern JavaScript without TypeScript

### Styling & Theming
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS + Autoprefixer** - CSS processing pipeline
- **Dark Mode:** Class-based system (`dark` class on `<html>`)
- **Default Theme:** Dark mode (user can toggle to light)
- **Color System:** Tailwind colors + custom theme assignments

### Data & Storage
- **Google Drive API** - Primary persistent storage (source of truth)
- **Google OAuth 2.0** - User authentication (1-hour token TTL)
- **localStorage** - Client-side caching and user preferences (~5-10MB limit)
- **Pub/Sub State Management** - Custom observable pattern (no Redux/Zustand)

### UI & Icons
- **lucide-react 0.303.0** - Icon library (only external UI dependency)

### Development & Deployment
- **ESLint** - Code linting with React Hooks rules
- **Cloudflare Pages** - Production deployment platform
- **git** - Version control

---

## 📁 Project Structure

```
MekongMemories/
├── Doc/                          # Development documentation (French)
│   ├── dev_guide_v2_2.md        # Legacy guides
│   ├── ...
│   └── dev_guide_v2_7.md        # Latest version 2.7
│
├── public/                       # Static PWA assets
│   ├── manifest.json            # PWA manifest configuration
│   └── splash.jpg               # PWA splash screen
│
├── src/
│   ├── main.jsx                 # ⭐ Entry point with dependency injection
│   ├── index.css                # Global styles + Tailwind imports
│   ├── constants.js             # Application-wide constants
│   │
│   ├── components/              # React components
│   │   ├── App.jsx             # ⭐ Root component with routing logic
│   │   ├── Navigation.jsx      # Bottom navigation bar (5 pages)
│   │   ├── ThemeContext.jsx    # Dark mode provider & context
│   │   ├── ThemeModal.jsx      # Theme tag assignment modal
│   │   ├── PhotoViewer.jsx     # ⭐ Fullscreen photo viewer (optimized v2.7)
│   │   ├── UnifiedTopBar.jsx   # Top bar wrapper (page-agnostic)
│   │   ├── LoadingSpinner.jsx  # Generic async operation spinner
│   │   │
│   │   ├── pages/              # Page components (routing targets)
│   │   │   ├── StartupPage.jsx    # App initialization + dark mode setup
│   │   │   ├── SessionsPage.jsx   # Chat sessions list with filtering
│   │   │   ├── ChatPage.jsx       # Individual session/chat view
│   │   │   ├── MemoriesPage.jsx   # Timeline of moments + galleries
│   │   │   └── SettingsPage.jsx   # User settings + theme management
│   │   │
│   │   ├── topbar/             # Page-specific top bar components
│   │   │   ├── ChatTopBar.jsx  # Chat menu with "Mark as unread"
│   │   │   ├── MemoriesTopBar.jsx
│   │   │   ├── SessionsTopBar.jsx
│   │   │   └── SettingsTopBar.jsx
│   │   │
│   │   └── memories/           # Memory timeline sub-components
│   │       ├── moment/         # Moment card rendering
│   │       ├── post/           # Mastodon post articles
│   │       ├── photo/          # Photo grid gallery
│   │       ├── shared/         # Shared timeline components
│   │       ├── layout/         # Layout helpers
│   │       └── hooks/          # Memory-specific hooks
│   │
│   ├── core/                   # ⭐ Business logic (singletons)
│   │   ├── dataManager.js          # ⭐ Central state hub (pub/sub)
│   │   ├── StateManager.js         # localStorage abstraction
│   │   ├── ConnectionManager.js    # Google OAuth state
│   │   ├── DriveSync.js           # Google Drive file operations
│   │   ├── UserManager.js         # User profiles & color assignments
│   │   ├── NotificationManager.js # Push notifications
│   │   ├── ContentLinks.js        # Bidirectional content↔session links
│   │   ├── ThemeAssignments.js    # Theme tag assignments
│   │   ├── MastodonData.js        # Mastodon feed parsing
│   │   ├── PhotoDataV2.js         # Photo metadata management
│   │   └── MasterIndexGenerator.js # Master timeline index
│   │
│   ├── hooks/
│   │   └── useAppState.js      # ⭐ Main application state hook
│   │
│   ├── config/
│   │   ├── version.js          # Version constants (update on release!)
│   │   └── googleDrive.js      # Google Drive API credentials
│   │
│   ├── utils/
│   │   ├── logger.js           # Custom color-coded logger
│   │   ├── storage.js          # localStorage utilities
│   │   ├── sessionUtils.js     # Session formatting/sorting/status
│   │   ├── themeUtils.js       # Theme utilities & color mapping
│   │   └── linkUtils.js        # Link utilities
│   │
│   └── styles/
│       └── startup-animations.css # Startup screen animations
│
├── index.html                   # Entry HTML with PWA meta tags
├── package.json                 # Dependencies and npm scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS plugins
├── eslint.config.js            # ESLint rules
└── wrangler.toml               # Cloudflare Pages deployment config
```

---

## 🏗 Architecture & Patterns

### State Management: Custom Pub/Sub (No Redux/Zustand)

The app uses a **three-layer custom state management** system designed for simplicity and explicit control:

#### Layer 1: Core Managers (Singleton Pattern)

All managers in `/src/core/` are singleton instances exposed on `window` for debugging:

**StateManager** (`StateManager.js`)
- Low-level localStorage wrapper with in-memory cache
- Observable pattern for React subscriptions
- Key prefix: `mekong_v2_`
- Handles persistence layer

**dataManager** (`dataManager.js`) - ⭐ **CENTRAL HUB**
- Coordinates all application state
- Pub/Sub pattern for component subscriptions
- Manages: sessions, masterIndex, currentUser, loadingOperation
- Methods: `subscribe()`, `notify()`, `getState()`, `updateState()`
- Handles automatic session archiving migration (v2.7)

**Other Core Managers:**
- `connectionManager` - Google OAuth authentication state
- `driveSync` - Google Drive file read/write operations
- `userManager` - User profiles and color style assignments
- `notificationManager` - Push notification management
- `contentLinks` - Bidirectional content↔session link indexing
- `themeAssignments` - Theme tag assignments to content

#### Layer 2: React Hook

**`useAppState()`** (`/src/hooks/useAppState.js`)
- Single source of truth for all components
- Subscribes to `dataManager` changes automatically
- Returns current state + action methods
- Usage: `const app = useAppState();`
- Cleanup on unmount prevents memory leaks

#### Layer 3: Component Consumption

```javascript
import { useAppState } from '../hooks/useAppState.js';

function MyComponent() {
  const app = useAppState();

  // Access state
  const sessions = app.sessions;          // Array of sessions
  const currentUser = app.currentUser;    // Current user object
  const masterIndex = app.masterIndex;    // Timeline data
  const loading = app.loadingOperation;   // Generic async spinner state

  // Call action methods (update state)
  app.createSession(title, author);
  app.addMessageToSession(sessionId, messageText);
  app.updateSession(sessionId, updates);
  app.deleteSession(sessionId);
  app.markSessionAsArchived(sessionId);
  app.navigateTo(pageName, context);
  app.setCurrentUser(userId);
}
```

### Routing: Custom Page-Based (No React Router)

**No routing library** - Routing via state machine in `App.jsx`:

```javascript
const renderPage = () => {
  switch (app.currentPage) {
    case 'sessions': return <SessionsPage />;
    case 'chat': return <ChatPage />;
    case 'memories': return <MemoriesPage />;
    case 'settings': return <SettingsPage />;
    default: return <StartupPage />;
  }
}
```

**Navigation Methods:**
- `app.navigateTo(page, context)` - Change page with optional context
- `context` object preserves state during transitions (selectionMode, pendingAttachment, etc.)
- `app.previousPage` enables smart back button behavior

**Navigation Context Fields:**
- `previousPage` - For back button functionality
- `pendingAttachment` - Photos to attach to sessions
- `sessionMomentId` - Moment context in chats
- `pendingLink` - Content links being created
- `targetContent` - Navigation targets
- `selectionMode` - UI mode (normal, link, select)

### Dependency Injection

**All manager dependencies are explicitly injected in `main.jsx`:**

```javascript
// main.jsx - Avoid circular dependencies
driveSync.initialize({ connectionManager });
dataManager.initializeDependencies({
  connectionManager,
  driveSync,
  stateManager,
  notificationManager,
  contentLinks
});
```

**Why?** Managers are singletons but need explicit initialization to avoid circular imports and ensure proper initialization order.

### Observer Pattern (Pub/Sub)

```javascript
// In React components
const app = useAppState();  // Automatically subscribed

// In core managers (manual subscription)
const unsubscribe = dataManager.subscribe(newState => {
  // React to state changes
});

// Later
unsubscribe();  // Cleanup

// Notify all subscribers
dataManager.notify();  // Called after state updates
```

### Error Handling

- React Error Boundary wraps entire app in `App.jsx`
- Catches render errors and displays fallback UI
- Errors logged via custom logger to console and localStorage
- Network errors handled gracefully in `DriveSync.js`

---

## 🎨 Styling & Theme System

### Dark Mode Implementation (v2.7 Complete)

**Architecture:**
- Context: `ThemeContext.jsx` provides `useTheme()` hook
- Class-based: Applies `dark` class to `<html>` element
- Default: Dark mode on first load (checked from localStorage)
- Persistence: localStorage key `mekong_theme_mode`

**StartupPage Dark Mode Initialization:**
```javascript
// On app startup, apply saved preference
useEffect(() => {
  const savedTheme = localStorage.getItem('mekong_theme_mode');
  const isDark = savedTheme ? savedTheme === 'dark' : true;
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
}, []);
```

**Tailwind Dual-Class Pattern:**
```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

**Color Palette (v2.7):**
- **Primary:** Amber (`amber-500`, `amber-600`)
- **Accent:** Purple (`purple-600`)
- **Status:** Red, Green, Blue
- **Backgrounds:** Gray scale (50-900)
- **User Colors:** Blue, Amber, Purple, Green, Red

**Section Header Colors (v2.7):**
- Utilisateurs: Dynamic user color
- Mes thèmes: Amber (`text-amber-500 dark:text-amber-400`)
- Statistiques: Violet (`text-violet-500 dark:text-violet-400`)
- Données: Indigo (`text-indigo-500 dark:text-indigo-400`)

**Layout Guidelines:**
- Mobile-first responsive design
- Fixed top bar: `fixed top-0 w-full z-50`
- Fixed bottom nav: `fixed bottom-0 w-full z-40`
- Main content padding: `pt-12 pb-16` (compensate for fixed bars)

---

## 📸 Photo Viewer (v2.7 - Optimized)

**PhotoViewer.jsx** - Fullscreen immersive photo display

### v2.7 Optimizations

**Visual Enhancements:**
- ✅ Maximum image width: Reduced padding `px-16` → `px-2`
- ✅ Full width photos while maintaining aspect ratio
- ✅ Object-contain ensures perfect fit without distortion
- ✅ Inspired by iOS Photos and Google Photos apps

**Navigation Subtlety:**
- ✅ Subtle arrows: `opacity-40` default, `opacity-70` on hover
- ✅ Smaller icons: `w-8 h-8` → `w-6 h-6`
- ✅ No background fill on arrows (pure transparency)
- ✅ Smooth transitions (`transition-opacity`)
- ✅ Keyboard shortcuts preserved (← → arrows, Esc)

**Mobile Experience:**
- ✅ Swipe gestures fully functional (horizontal swipe = navigate)
- ✅ Touch support: 50px minimum swipe distance
- ✅ Arrows fade subtly on hover (ideal for touch devices)
- ✅ Image centered and maximized for viewing

### PhotoViewer Features

**Session Integration:**
- Smart badge showing number of linked sessions
- Create new session directly from photo
- List existing sessions linked to this photo
- Both filename and google_drive_id lookups

**Theme Assignment:**
- Assign theme tags to photos
- Display assigned themes as badge
- Visual feedback (color changes)

**Content Linking:**
- Link photos to sessions while viewing
- Selection mode support
- Bidirectional link tracking

---

## 💾 Data Persistence

### localStorage Keys (Client-Side Cache)

| Key | Description | Type |
|-----|-------------|------|
| `mekong_v2_sessions` | Sessions array | JSON array |
| `mekong_v2_currentUser` | Current user ID | String |
| `mekong_v2_masterIndex` | Master moments timeline | JSON object |
| `oauth_token` | Google OAuth token | String (1h TTL) |
| `oauth_token_timestamp` | Token creation time | ISO timestamp |
| `mekong_theme_mode` | Dark/light preference | 'dark' \| 'light' |
| `mekong_sessionSort_{userId}` | Session sort preference | String |
| `mekong_sessionReadStatus_{userId}` | Read status tracking | JSON object |
| `mekong_theme_sort_order` | Theme sort order | String |
| `debug_mode` | Enable verbose logging | 'true' \| undefined |

### Google Drive Files (Source of Truth)

| File | Description | Format |
|------|-------------|--------|
| `session_{sessionId}.json` | Individual session data | JSON |
| `mekong_master_index_v3_moments.json` | Master timeline index | JSON |
| `content-links.json` | Bidirectional links | JSON |
| `theme-assignments.json` | Theme assignments | JSON |
| `notifications.json` | User notifications | JSON |

**Important:** All Drive operations go through `driveSync.js` for consistency and error handling.

---

## 📝 Code Conventions

### File Naming
- **Components:** PascalCase (`.jsx`) - `SessionPage.jsx`
- **Managers/Utils:** camelCase (`.js`) - `dataManager.js`
- **Config files:** kebab-case - `tailwind.config.js`

### Import Organization
```javascript
// 1. React/external libraries
import React, { useState, useEffect } from 'react';
import { X, Check, MoreVertical } from 'lucide-react';

// 2. Hooks/contexts
import { useAppState } from '../hooks/useAppState.js';
import { useTheme } from './ThemeContext.jsx';

// 3. Components
import TopBar from './TopBar.jsx';
import Navigation from './Navigation.jsx';

// 4. Core/utils
import { dataManager } from '../core/dataManager.js';
import { logger } from '../utils/logger.js';

// 5. Constants/config
import { APP_VERSION } from '../config/version.js';
```

### Comments & Documentation
**Language:** French for all comments and complex logic

**Emoji prefixes for visual scanning:**
- ✅ Completed features
- ⭐ Important sections
- 🔗 Link-related code
- 🔍 Debug code
- ⚠️ Warnings
- 🎯 TODO items
- ✨ New features or improvements

### File Headers
```javascript
/**
 * ComponentName.jsx v2.7 - Photo Viewer Optimization
 * ✅ Feature 1
 * ✅ Feature 2
 * ⭐ Important note
 */
```

### Logging System
```javascript
import { logger } from '../utils/logger.js';

logger.debug('Debugging info', data);    // 🔍 Blue
logger.info('Information');               // ℹ️ Cyan
logger.warn('Warning message');           // ⚠️ Yellow
logger.error('Error occurred', error);    // ❌ Red
logger.success('Operation successful');   // ✅ Green
```

**Features:**
- Color-coded console output with emoji indicators
- Toggle via `localStorage.debug_mode = 'true'`
- Automatically disabled in production

---

## 🔑 Key Concepts

### Sessions (Conversations)

**What:** Themed conversations/chats about travel memories between two users

**Data Structure:**
```javascript
{
  id: 'session_123',
  gameTitle: 'Session title',
  user: 'alice',              // Creator
  gameId: 'moment_1',         // Associated moment
  notes: [                    // Messages (formerly called messages)
    {
      id: 'msg_1',
      author: 'alice',
      content: 'Message text',
      timestamp: '2025-11-10T12:00:00Z',
      edited: false,
      photoData: {...},       // Optional photo attachment
      linkedContent: {...}    // Optional linked content
    }
  ],
  archived: false,            // v2.7: Replaces old 'completed' flag
  createdAt: '2025-11-10T12:00:00Z',
  updatedAt: '2025-11-10T13:00:00Z'
}
```

**Session Status (from enrichSessionWithStatus):**
```javascript
SESSION_STATUS = {
  NOTIFIED: 'notified',           // 🔔 Unread notification from other user
  PENDING_YOU: 'pending_you',     // ⏳ Your turn to respond
  PENDING_OTHER: 'pending_other', // ⏳ Waiting for response
  ACTIVE: 'active',               // 🟢 Normal conversation
  ARCHIVED: 'archived'            // 📚 v2.7: Archived (formerly completed)
}
```

**Read/Unread States (v2.7):**
```javascript
// For each user independently:
'new'      // Never opened + created by someone else
'unread'   // New message since last opened
'read'     // Up to date with all messages
```

### Moments (Thematic Timeline Units)

**What:** Days, experiences, or locations in the travel timeline

**Data Structure:**
```javascript
{
  id: 'moment_1',
  title: 'Jour 1 : Arrivée à Luang Prabang',
  date: '2024-01-15',
  description: 'First day arrival...',
  location: 'Luang Prabang',
  photos: ['photo_1', 'photo_2'],
  posts: ['post_1'],
  tags: ['arrival', 'city'],
  linkedSessions: ['session_1', 'session_2']
}
```

### Content Links (Bidirectional)

**What:** Smart linking between content (moments/photos/posts) and sessions

**Managed by:** `ContentLinks.js`

**Structure:**
```javascript
{
  links: [
    {
      id: 'link_1',
      sessionId: 'session_1',
      contentType: 'moment',  // 'moment' | 'photo' | 'post'
      contentId: 'moment_1',
      messageId: 'msg_1',     // Optional: which message linked this
      createdAt: '2025-11-10T12:00:00Z'
    }
  ]
}
```

**Performance:**
- Two Map structures for O(1) lookups
- `sessionIndex`: sessionId → Set<linkIds>
- `contentIndex`: contentKey → Set<linkIds>
- Content key format: `{contentType}:{contentId}`

### Theme Assignments (User-Created Tags)

**What:** Custom tags for organizing and categorizing content

**Managed by:** `ThemeAssignments.js`

**Available Themes:** Culture, Food, Nature, People, Architecture, + user-created

**Structure:**
```javascript
{
  id: 'theme_1',
  name: 'Culture',
  icon: '🏛️',
  color: 'purple',
  createdBy: 'alice',
  createdAt: '2025-11-10T12:00:00Z'
}
```

---

## 🚀 Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Version Updates (Release Process)

**When releasing a new version:**

1. Update `/src/config/version.js`:
   ```javascript
   export const APP_VERSION = "2.8";
   export const BUILD_DATE = "15 novembre 2025";
   export const PHASE = "Feature Name";
   ```

2. Update header in relevant component files (PhotoViewer.jsx, etc.)

3. Document changes in `/Doc/dev_guide_v2_X.md` (create new file for new version)

4. Commit with clear message:
   ```bash
   git add .
   git commit -m "Feat: Release v2.8 - Feature Name

   - Change 1
   - Change 2
   "
   git push
   ```

### Deployment

**Platform:** Cloudflare Pages (automatic on git push)

**Manual Deployment:**
```bash
npm run build
npx wrangler pages deploy dist/
```

**Configuration:** `wrangler.toml`
```toml
name = "mekong-memoire"
pages_build_output_dir = "dist"
```

### Debugging Tools

**Enable debug mode:**
```javascript
// In browser console
localStorage.setItem('debug_mode', 'true');
// Then refresh page
```

**Access managers:**
```javascript
// In browser console
window.dataManager.getState();
window.connectionManager.isConnected();
window.driveSync.listFiles();
window.userManager.getAllUsers();
window.themeAssignments.getAllThemes();
window.contentLinks.getAllLinks();
```

**Useful debug commands:**
```javascript
// Check current state
const state = window.dataManager.getState();
console.log('Sessions:', state.sessions);
console.log('Current user:', state.currentUser);

// Check localStorage usage
Object.keys(localStorage)
  .filter(k => k.startsWith('mekong_'))
  .map(k => `${k}: ${Math.round(localStorage.getItem(k).length / 1024)}KB`);

// Check read status for current user
JSON.parse(localStorage.getItem(`mekong_sessionReadStatus_${state.currentUser}`));

// Clear all data (⚠️ CAUTION!)
window.dataManager.resetAllData();
```

---

## ⚠️ Important Gotchas & Notes

### 1. No TypeScript
- Everything is JavaScript ES6+
- No type checking at build time
- Use JSDoc comments for IDE support if needed

### 2. No Router Library
- Navigation is state-based via `app.navigateTo()`
- No react-router or similar libraries
- Check `app.currentPage` to determine current route

### 3. French Codebase
- All comments and documentation in French
- Variable names in English
- Function names in English
- Keep this convention when adding code

### 4. Singleton Managers
- All managers in `/src/core/` are singletons
- Export as: `export const managerName = new Manager()`
- Never create new instances: ❌ `new DataManager()`
- Always import: ✅ `import { dataManager } from '../core/dataManager.js'`

### 5. State Updates
- **NEVER** mutate state directly
- Always go through `dataManager` methods
- State updates trigger pub/sub notifications
- React components re-render automatically via `useAppState()`

### 6. Google OAuth Token
- Tokens expire after 1 hour
- Check `connectionManager.isConnected()` before Drive operations
- Token refresh happens automatically
- Handle disconnection gracefully (redirect to login)

### 7. Dark Mode
- App defaults to dark mode
- Always test both light and dark themes
- Use `dark:` classes consistently
- Never hardcode colors without dark variants

### 8. Mobile-First Design
- App is primarily mobile-focused (375px viewport)
- Fixed top/bottom bars reduce usable height
- Always account for `pt-12 pb-16` padding
- Test touch interactions and swipe gestures

### 9. Performance Optimization
- Large photo collections can impact performance
- Use `useMemo` for expensive computations
- Avoid unnecessary re-renders with proper dependency arrays
- ContentLinks uses Map for O(1) lookups

### 10. localStorage Limits
- Browser limit: ~5-10MB per domain
- Monitor localStorage usage
- Critical data is synced to Google Drive
- Clear cache if hitting limits

### 11. Session Status Migration (v2.7)
- Old sessions may have `completed: true` flag
- `dataManager` automatically migrates to `archived: true`
- No manual intervention needed
- Ensure all code checks `archived` property, not `completed`

### 12. Photo Viewer Mobile Experience (v2.7)
- Swipe gestures are primary navigation method
- Navigation arrows are subtle (opacity-40)
- Photos maximize width on all screen sizes
- Test on actual mobile devices, not just desktop

---

## 🎯 Common Tasks

### Adding a New Page

1. Create component in `/src/components/pages/`:
   ```javascript
   // NewPage.jsx
   import React from 'react';
   import { useAppState } from '../../hooks/useAppState.js';

   function NewPage() {
     const app = useAppState();
     return (
       <div className="flex-1 bg-gray-50 dark:bg-gray-900">
         {/* Content */}
       </div>
     );
   }

   export default NewPage;
   ```

2. Add to routing in `/src/components/App.jsx`:
   ```javascript
   const renderPage = () => {
     switch (app.currentPage) {
       case 'new-page': return <NewPage />;
       // ... existing cases
     }
   }
   ```

3. Add to Navigation in `/src/components/Navigation.jsx`

4. Create TopBar in `/src/components/topbar/NewPageTopBar.jsx` if needed

5. Add case to `UnifiedTopBar.jsx` to render correct TopBar

### Adding a New Manager

1. Create in `/src/core/`:
   ```javascript
   // NewManager.js
   import { logger } from '../utils/logger.js';

   class NewManager {
     constructor() {
       this.data = null;
     }

     initialize() {
       logger.info('NewManager initialized');
     }
   }

   export const newManager = new NewManager();

   // Expose for debugging
   if (typeof window !== 'undefined') {
     window.newManager = newManager;
   }
   ```

2. Initialize in `/src/main.jsx`:
   ```javascript
   import { newManager } from './core/NewManager.js';
   newManager.initialize();
   dataManager.initializeDependencies({
     // ... add if it has dependencies
   });
   ```

3. Add to `dataManager` dependencies if needed

### Adding Dark Mode to a Component

1. Import theme hook:
   ```javascript
   import { useTheme } from './ThemeContext.jsx';
   ```

2. Use in component:
   ```javascript
   function MyComponent() {
     const { theme, toggleTheme } = useTheme();

     return (
       <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
         Current theme: {theme}
         <button onClick={toggleTheme}>Toggle</button>
       </div>
     );
   }
   ```

3. Always provide both light and dark variants for ALL colors

### Working with Sessions

```javascript
const app = useAppState();

// Create new session
const sessionId = app.createSession('Session Title', 'authorName');

// Add message to session
app.addMessageToSession(sessionId, 'Message content', photoData, linkedContent);

// Update session
app.updateSession(sessionId, {
  archived: true,           // Archive session (v2.7)
  themes: ['culture', 'food']
});

// Mark as unread (v2.7)
const storageKey = `mekong_sessionReadStatus_${userId}`;
const tracking = JSON.parse(localStorage.getItem(storageKey) || '{}');
tracking[sessionId] = {
  hasBeenOpened: true,
  lastOpenedAt: '1970-01-01T00:00:00.000Z'  // Force UNREAD status
};
localStorage.setItem(storageKey, JSON.stringify(tracking));

// Delete session
app.deleteSession(sessionId);
```

### Accessing Google Drive

```javascript
import { driveSync } from '../core/DriveSync.js';
import { connectionManager } from '../core/ConnectionManager.js';

// Check connection
if (!connectionManager.isConnected()) {
  // Handle disconnection (redirect to login)
  return;
}

// Read file
const data = await driveSync.readFile('session_123.json');

// Write file
await driveSync.writeFile('session_123.json', sessionData);

// List files
const files = await driveSync.listFiles();

// Delete file
await driveSync.deleteFile('session_123.json');
```

### Generic Loading Spinner (v2.7)

```javascript
import { dataManager } from '../core/dataManager.js';

// Show spinner
dataManager.setLoadingOperation(true, 'Loading...', 'Connecting to Google Drive', 'spin');

try {
  // Do async operation
  await someAsyncOperation();
} finally {
  // Hide spinner
  dataManager.setLoadingOperation(false);
}

// In component
const app = useAppState();
const { active, message, subMessage, variant } = app.loadingOperation;
```

---

## 📚 Documentation & Resources

### Project Documentation
- **Latest Dev Guide:** `/Doc/dev_guide_v2_7.md`
- **Previous Guides:** `/Doc/dev_guide_v2_*.md` (v2.2 → v2.6d)
- **Phase Specifications:** `/Doc/phase17_specs.md` and others
- **README:** `/README.md` (generic Vite template)

### Key Files to Review
Before making changes:
1. `/src/hooks/useAppState.js` - Main state hook
2. `/src/core/dataManager.js` - Central state manager
3. `/src/components/App.jsx` - Root component and routing
4. `/src/config/version.js` - Current version
5. `/Doc/dev_guide_v2_7.md` - Current phase documentation

### External References
- **React:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vite:** https://vitejs.dev
- **Lucide Icons:** https://lucide.dev
- **Google Drive API:** https://developers.google.com/drive/api

---

## 🤝 Contributing Guidelines

### When Adding Features

1. **Check current version** in `/src/config/version.js`
2. **Review latest dev guide** in `/Doc/dev_guide_v2_7.md`
3. **Follow existing patterns:**
   - Use pub/sub for state management
   - Singleton managers for shared logic
   - Custom page-based routing
   - Tailwind + dark mode classes
4. **Test both themes** (light and dark)
5. **Test on mobile** viewport (375px width)
6. **Add French comments** for complex logic
7. **Update version** number if releasing
8. **Document changes** in appropriate dev guide

### Code Quality Standards

✅ **DO:**
- Use `useAppState()` for all state access
- Follow import organization pattern
- Provide dark mode variants for ALL UI
- Use custom logger instead of `console.log`
- Handle errors gracefully
- Check OAuth connection before Drive operations
- Add meaningful comments in French
- Test on mobile devices

❌ **DON'T:**
- Mutate state directly
- Create new manager instances
- Use inline styles (use Tailwind)
- Hardcode colors without dark variants
- Use TypeScript or flow
- Add external UI libraries (Tailwind + lucide only)
- Use React Router or equivalent

### Testing Checklist

Before committing:
- [ ] Runs without errors (`npm run dev`)
- [ ] Linter passes (`npm run lint`)
- [ ] Works in dark mode
- [ ] Works in light mode
- [ ] Responsive on mobile (375px)
- [ ] Google Drive sync works
- [ ] localStorage persists correctly
- [ ] Navigation flows work
- [ ] No console errors or warnings
- [ ] Keyboard shortcuts work (if applicable)
- [ ] Touch/swipe gestures work (mobile)

---

## 🎓 Learning Path

**For new developers working on this codebase:**

1. **Start with:** `/src/components/App.jsx` - Understand routing and structure
2. **Then read:** `/src/hooks/useAppState.js` - Learn state management
3. **Study:** `/src/core/dataManager.js` - Central state coordination
4. **Explore:** `/src/components/pages/` - See how pages work
5. **Review:** `/Doc/dev_guide_v2_7.md` - Current phase goals
6. **Practice:** Enable debug mode and explore via console

**Key Mental Models:**
- **State Flow:** Component → `useAppState()` → `dataManager` → Managers → localStorage/Drive
- **Navigation:** User action → `app.navigateTo()` → State change → Page re-render
- **Data Sync:** User action → Manager → `driveSync` → Google Drive → Success callback
- **Pub/Sub:** Managers notify dataManager → dataManager notifies components → Components re-render

---

## 📞 Support & Help

For questions about specific aspects:

**Architecture & State Management:**
- Read: `/src/core/dataManager.js`
- Review: `/Doc/dev_guide_v2_7.md`

**Routing & Navigation:**
- Read: `/src/components/App.jsx`
- Check: `app.navigateTo()` in useAppState

**Styling & Theming:**
- Review Tailwind patterns above
- Check: `ThemeContext.jsx`
- Test both light and dark modes

**Data Structures:**
- Check manager files in `/src/core/`
- See "Key Concepts" section above

**Debugging:**
1. Enable debug mode: `localStorage.setItem('debug_mode', 'true')`
2. Check browser console for logger output
3. Inspect state: `window.dataManager.getState()`
4. Check localStorage: Filter by `mekong_` prefix

---

## 🔮 Planned Migrations & Future Work

### **v3.1 - MasterIndex Structure Uniformization** (Planned)

**Context:** Currently, the masterIndex has heterogeneous structures for different content types:
- `dayPhotos[]`: Simple photo objects
- `posts[]`: Post objects with optional photos array
- Photos imported (v3.0): Mixed into both structures

**Goal:** Uniformize all content into a consistent structure for easier querying and rendering.

**Proposed Unified Structure:**
```javascript
{
  moments: [
    {
      id: "moment_1",
      title: "...",
      jnnn: "J7" | "undefined",
      date: "2024-01-15",
      content: [  // ⭐ Unified content array
        {
          type: "photo",
          source: "moment" | "imported",
          google_drive_id: "...",
          // ...
        },
        {
          type: "post",
          category: "mastodon" | "user_added",
          source: "mastodon" | "imported",
          title: "...",  // optional
          content: "...",
          photos: [...]
        }
      ]
    }
  ]
}
```

**Benefits:**
- Single array to iterate for rendering
- Consistent filtering/sorting logic
- Easier to add new content types
- Simplified ContentLinks integration

**Migration Strategy:**
1. Create migration script in `/src/utils/migrateM

asterIndexV3_1.js`
2. Detect old structure and convert to new
3. Preserve all existing data
4. Update all rendering components
5. Test thoroughly before deployment

**ETA:** Post v3.0 feature completion

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~8,900 |
| **React Components** | 20+ |
| **Core Managers** | 10 |
| **Pages** | 5 |
| **Current Version** | 2.7 |
| **Build Size (JS)** | ~434 KB |
| **Build Size (CSS)** | ~58.5 KB |
| **Dependencies** | 3 external (React, Vite, Tailwind, Lucide) |

---

**Last Updated:** November 15, 2025
**Version:** 2.7 "Photo Viewer Optimization"
**Maintained by:** Development Team & AI Assistants
**Next Phase:** TBD
