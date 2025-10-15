# Guide de développement - Mémoire du Mékong v2.4

**Dernière mise à jour : Phase 16.2 complète - Thèmes avancés**  
**Date : 11 octobre 2025**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-générale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Système de Thèmes](#système-de-thèmes)
5. [Composants principaux](#composants-principaux)
6. [Gestion des photos](#gestion-des-photos)
7. [Messages et sessions](#messages-et-sessions)
8. [Système de notifications](#système-de-notifications)
9. [Interface utilisateur](#interface-utilisateur)
10. [Bonnes pratiques](#bonnes-pratiques)
11. [Méthodologie de travail](#méthodologie-de-travail)
12. [Phases complétées](#phases-complétées)
13. [Roadmap : Prochaines phases](#roadmap-prochaines-phases)

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme un **carnet d'expériences de voyage interactif**. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Stockage sur Google Drive
- **✨ Navigation par Moments :** Unités thématiques (1+ jours)
- **🏷️ Système de Thèmes :** Tags transversaux pour organiser les souvenirs
- **⏱️ Timeline Interactive :** Frise chronologique visuelle
- **📰 Contenu Riche :** Articles Mastodon + galeries photos
- **💬 Sessions conversationnelles :** Dialogues autour des souvenirs
- **🔔 Notifications push :** Communication asynchrone entre utilisateurs
- **⚙️ Synchronisation Automatique :** Connexion Drive au démarrage

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

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée (v2.2)
│   ├── UnifiedTopBar.jsx          # ✅ Barre contextuelle (v2.5)
│   ├── Navigation.jsx             # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx            # ✅ (v2.7.1 - Thèmes fixes)
│   ├── ThemeModal.jsx             # ✅ (v1.2 - z-index + redirect)
│   ├── SessionCreationModal.jsx   # (v1.1)
│   ├── SessionCreationSpinner.jsx
│   ├── StatsModal.jsx
│   ├── TimelineRule.jsx           # (v3.1)
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ (v6.4 - Headers fixes)
│       ├── SessionsPage.jsx       # ✅ (v6.2 - groupes + notifications)
│       ├── ChatPage.jsx           # (v2.1 - PhotoMessage)
│       ├── SettingsPage.jsx       # ✅ (v4.2 - Ordre thèmes + Moment tagging)
│       └── UserSelectionPage.jsx
├── core/
│   ├── dataManager.js             # ✅ v3.5 - Photo user message
│   ├── ConnectionManager.js       # v0.9.0 - Token OAuth
│   ├── DriveSync.js               # Pagination (pageSize: 1000)
│   ├── StateManager.js            # v0.7.0
│   ├── UserManager.js             # ✅ v2.1 - getAllUsers
│   ├── PhotoDataV2.js             # v3.6 - Mobile optimized
│   ├── MastodonData.js            # v0.8
│   ├── MasterIndexGenerator.js    # ✅ v5.0 - Thèmes
│   ├── NotificationManager.js     # ✅ v1.0 - Push notifications
│   └── ThemeAssignments.js        # ✅ v2.0 - Index inversé + Batch
├── hooks/
│   └── useAppState.js             # ✅ + sendNotification, getUnreadCount
├── utils/
│   ├── sessionUtils.js            # ✅ v2.0 - SESSION_STATUS.NOTIFIED
│   └── themeUtils.js              # ✅ v1.1 - sortThemes + helpers
└── main.jsx                       # ✅ + ThemeAssignments injection
```

---

## 🏷️ Système de Thèmes

### **Philosophie**

Les Thèmes sont des **tags transversaux** qui enrichissent la structure temporelle (Moments) :

- **Moments** = unités temporelles (voyage chronologique)
- **Thèmes** = catégories libres (Temples, Gastronomie, Scooter...)
- Un contenu (post/photo) peut avoir **plusieurs thèmes**
- Pas d'héritage automatique (tagging explicite)

### **Architecture**

#### **1. Stockage (Drive)**

**Fichier :** `theme_assignments.json`

```json
{
  "version": "2.0",
  "lastModified": "2025-10-11T12:30:00Z",
  "assignments": {
    "post:https://...": {
      "themes": ["temple", "architecture"],
      "assignedBy": "tom",
      "assignedAt": "2025-10-10T15:20:00Z"
    },
    "photo_moment:1abc...": {
      "themes": ["gastronomie"],
      "assignedBy": "lambert",
      "assignedAt": "2025-10-11T09:15:00Z"
    }
  }
}
```

**Thèmes dans masterIndex :**

```json
{
  "version": "5.0-themes",
  "themes": [
    {
      "id": "temple",
      "name": "Temples",
      "icon": "🛕",
      "color": "purple",
      "createdAt": "2025-10-10T21:27:53.484Z",
      "createdBy": "tom",
      "order": 0
    }
  ]
}
```

#### **2. Clés composites**

```javascript
// Posts Mastodon
post:${post.id}

// Photos moments
photo_moment:${google_drive_id}

// Photos Mastodon
photo_mastodon:${google_drive_id}
```

→ **Avantage :** Pas de collisions, facilite le debug

#### **3. ThemeAssignments v2.0**

**Index inversé pour performance O(1) :**

```javascript
{
  assignments: {
    "post:123": { themes: ["temple", "food"] },
    "photo_moment:456": { themes: ["temple"] }
  },
  invertedIndex: {
    "temple": Set(["post:123", "photo_moment:456"]),
    "food": Set(["post:123"])
  }
}
```

**API publique :**

```javascript
// CRUD
assignThemes(contentKey, themeIds, userId)
assignThemesBatch(contentKeys, themeIds, userId) // Batch
removeThemes(contentKey, themeIds)

// Lecture
getThemesForContent(contentKey) // → Array<themeId>
getAllContentsByTheme(themeId)  // → Array<contentKey> (O(1))

// Cascade delete
deleteThemeAssignments(themeId)

// Moment tagging (désactivé par défaut)
assignThemesToMoment(moment, themeIds, userId)

// Stats
getStats() // → { totalAssignments, byType, indexSize }
```

### **UX de tagging**

#### **Posts**

- Bouton 🏷️ dans header
- Click → ThemeModal
- Badge compteur si thèmes assignés

#### **Photos**

- **Individuelle** : Bouton 🏷️ dans PhotoViewer

- **collective** : Bouton 🏷️ dans header de photoDuMoment 
  
  et **Bulk** sur les vignette  : Longpress → mode sélection → "Assigner thèmes"

#### **Moments**

- Toggle dans Settings → Thèmes
- Bouton "🏷️ Moment" dans header
- Preview détaillé + confirmation explicite
- Batch assignation (tous posts + photos)

### **Ordre d'affichage (Phase 16.2)**

**4 options (Settings) :**

1. **Par utilisation** (défaut) : Plus tagués en premier
2. **Par création** : Récents en premier
3. **Alphabétique** : A → Z
4. **par couleur** : 
5. **Manuel** : Ordre personnalisé (à venir drag & drop)

**Fonction :**

```javascript
import { sortThemes } from '../utils/themeUtils.js';

const sortOrder = localStorage.getItem('mekong_theme_sort_order') || 'usage';
const sorted = sortThemes(rawThemes, window.themeAssignments, sortOrder);
```

### **Filtrage**

**Barre thèmes (MemoriesPage) :**

```
[🏷️] [Tous] [🛕 Temples (15)] [🍜 Gastronomie (8)] [🛵 Scooter (23)]
```

- Toggle TopBar pour afficher/masquer
- Pills horizontales avec compteurs
- Click → filtre moments par thème

### 

## Architecture hiérarchique du tagging

### **Hiérarchie des niveaux**

```
Moment (🗺️)
├── Posts (📄)
│   └── Photos des posts (📸)
└── Photos du moment (📸)
```

une option de Settings propose de répercuter les Tag/untag aux élément contenus (inférieurs dans la hierarchies). Si cette case est cochée une fenetre de confirmation demande si sur quels elements inférieurs, on veut propger le tag

### **Règles de propagation (phase 16.3)**

**Niveau 1 : Moment → Enfants**

```
Tagger Moment avec TagA + propagation
└─> Applique TagA à :
    ├─> Posts du moment (optionnel ☐)
    │   └─> Photos des posts (optionnel ☐)
    └─> Photos du moment (optionnel ☐)
```

**Niveau 2 : Post → Enfants**

```
Tagger Post avec TagB + propagation
└─> Applique TagB à :
    └─> Photos de ce post (optionnel ☐)
```

**Niveau 3 : Header Photos Moment → Enfants**

```
Tagger "Photos de Moment X" + propagation
└─> Applique tag à :
    └─> Toutes les photos du moment (optionnel ☐)
```

### **Affichage badges (UNIQUEMENT niveau actuel)**

| Élément    | Badge | Compte                      |
| ---------- | ----- | --------------------------- |
| 🗺️ Moment | 🏷️ 1 | Tags du moment UNIQUEMENT   |
| 📄 Post    | 🏷️ 2 | Tags du post UNIQUEMENT     |
| 📸 Photo   | 🏷️ 1 | Tags de la photo UNIQUEMENT |

---

## 🧩 Composants principaux

### 1. App.jsx (v2.2)

*États partagés :**

javascript

```javascript
const [isTimelineVisible, setIsTimelineVisible] = useState(false);
const [isSearchOpen, setIsSearchOpen] = useState(false);
const [currentDay, setCurrentDay] = useState(1);
const [displayOptions, setDisplayOptions] = useState({
  showPostText: true,
  showPostPhotos: true,
  showMomentPhotos: true
});
const [editingChatTitle, setEditingChatTitle] = useState(false);
const memoriesPageRef = useRef(null);
```

**Layout :**

jsx

```jsx
<div className="min-h-screen bg-gray-50 flex flex-col">
  <div className="fixed top-0 left-0 right-0 z-40">
    <UnifiedTopBar {...props} />
  </div>
  <main className="flex-1 pt-12 pb-16 overflow-auto">
    {renderPage()}
  </main>
  <BottomNavigation {...props} />
</div>
```

### 2. UnifiedTopBar.jsx (v2.5)

**Structure :** `[Action] [Contexte central] [...] [Avatar coloré]`

**Nouveautés Phase 16 :**

- Bouton 🏷️ toggle (Memories) si thèmes > 0
- Avatar coloré avec menu changement utilisateur direct

### 3. MemoriesPage.jsx (v6.4)

**Corrections Phase 16.1 :**

✅ **Header posts unifié** : `📸 N · 🏷️ M · 💬`
✅ **Header photos** : `N Photos de "Titre"`
✅ **Pas de redondance** : Bouton 🏷️ intègre le compteur

**Nouveautés Phase 16.2 :**

- Ordre thèmes (localStorage)
- Bouton "🏷️ Moment" si feature activée
- Filtrage par thème (pills)

### 4. ThemeModal.jsx (v1.2)

**Corrections Phase 16.1 :**

✅ **z-index 10000** (devant PhotoViewer)
✅ **Bouton "Créer thème"** redirige vers Settings

**Nouveautés Phase 16.2 :**

- Preview moment avec stats détaillées
- Support contentType = 'moment'
- Warning "écrasera les thèmes existants"

### 5. PhotoViewer.jsx (v2.7.1)

**Corrections Phase 16.1 :**

✅ **Thèmes affichés** : `window.dataManager.getState().masterIndex?.themes`
✅ **currentUser** : `window.dataManager.getState().currentUser`

### 6. SettingsPage.jsx (v4.2)

**Nouveautés Phase 16.2 :**

1. **Sélecteur ordre thèmes** (4 options)
2. **Toggle moment tagging** (désactivé par défaut)
3. **Cascade delete amélioré** :
   - Confirmation renforcée si >10 assignations
   - Message détaillé avec compteurs

---

## 📸 Gestion des photos

### Structure Drive

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

### Flow complet

1. Génération masterIndex :**

```
MasterIndexGenerator
  ├─ analyzePhotoMoments() → Photos du moment (google_drive_id direct)
  ├─ buildMastodonPhotoMapping() → Mapping nom → google_drive_id
  ├─ analyzeMastodonPostsByDay() → Posts bruts
  ├─ enrichPostWithPhotoIds() → Posts + google_drive_id
  └─ buildFinalStructure() → JSON final
```

**2. Affichage (PhotoDataV2) :**

javascript

```javascript
async resolveImageUrl(photo, useThumbnail) {
  if (!photo.google_drive_id) {
    return this.generatePlaceholderSVG();
  }
  // Résolution Drive optimisée mobile
  return this.buildOptimalUrl(fileId, size);
}
```

------

## 💬 Messages et sessions

### Structure message avec photo

javascript

```javascript
{
  id: "msg_1234567890",
  author: "lambert",
  content: "Regarde cette photo !",
  timestamp: "2025-01-15T10:30:00Z",
  edited: false,
  photoData: {
    filename: "IMG20221022.jpg",
    google_drive_id: "1abc...",
    width: 3468,
    height: 4624,
    mime_type: "image/jpeg"
  }
}
```

### Types de messages

| Type          | Author | photoData | Usage               |
| ------------- | ------ | --------- | ------------------- |
| Texte         | user   | ❌         | Message normal      |
| Photo + texte | user   | ✅         | Session photo       |
| Système       | duo    | ❌         | Session post/moment |

### ---

### Statuts de sessions (Phase 15)

**4 priorités :**

1. **NOTIFIED** 🔔 : Notification non répondue
2. **PENDING_YOU** 🟡 : Dernier msg ≠ currentUser
3. **PENDING_OTHER** 🔵 : Dernier msg = currentUser
4. **COMPLETED** ✅ : Marquée terminée

---

## 🔔 Système de notifications

### Architecture

**NotificationManager.js :**

javascript

```javascript
class NotificationManager {
  async sendNotification({ from, to, sessionId, sessionTitle })
  getNotifications(userId)
  getUnreadNotifications(userId)
  getUnreadCount(userId)
  async markAsRead(notificationId)
  async markAllAsRead(userId)
  hasUnreadNotificationForSession(sessionId, userId)
  getNotificationForSession(sessionId, userId)
}
```

**Stockage Drive :**

```
MemoireDuMekong-Data/
└── notifications.json
    {
      "version": "1.0",
      "notifications": [...]
    }
```

### Flow complet

**1. Envoi notification :**

```
ChatPage → Bouton 🔔 → app.sendNotification(targetUser, sessionId, title)
  → NotificationManager.sendNotification()
  → Drive: notifications.json updated
  → Confirmation "✅ Notification envoyée à Tom !"
```

**2. Détection notification :**

```
SessionsPage → enrichSessionWithStatus()
  → calculateSessionStatus()
  → window.notificationManager.hasUnreadNotificationForSession(sessionId, currentUserId)
  → Si true: SESSION_STATUS.NOTIFIED (priorité 1)
```

**3. Marquage lu :**

```
Ouverture session → dataManager.openChatSession()
  → notificationManager.markAsRead(notificationId)
  → Statut passe de NOTIFIED à PENDING_YOU ou PENDING_OTHER

OU

Envoi message → dataManager.addMessageToSession()
  → Auto markAsRead si notification existe---
```

## 🎨 Interface utilisateur

### Système visuel unifié (Phase 14.3)

**Couleurs discrètes + Icônes explicites**

| Concept       | Icône | Usage                              |
| ------------- | ----- | ---------------------------------- |
| Thèmes        | 🏷️   | Tagging posts/photos/moments       |
| Notifications | 🔔    | Badge priorité 1, bouton notifier  |
| Sessions/Chat | 💬    | Boutons session, compteur messages |
| Moments       | ✨     | Badge moments non explorés         |
| Timeline      | 🗺️   | Bouton timeline                    |

---

## ✅ Bonnes pratiques

### ### 1. Photos Mastodon

**❌ NE PAS** : Créer structure récursive profonde  
**✅ FAIRE** : Aplatir dans `Mastodon_Photos/`  
**❌ NE PAS** : Oublier `pageSize: 1000` dans listFiles  
**✅ FAIRE** : Toujours paginer les requêtes Drive

### 2. Messages

**❌ NE PAS** : `photoData` dans message système  
**✅ FAIRE** : `photoData` dans message utilisateur  
**✅ FAIRE** : `app.createSession(gameData, text, sourcePhoto)`

### 3. Communication TopBar ↔ Pages

**✅ FAIRE** : Exposer callbacks via `window.XXXPageFilters`

javascript

```javascript
window.memoriesPageFilters = {
  setMomentFilter: (filter) => { /* ... */ }
};
```

**✅ FAIRE** : Nettoyer au unmount

javascript

```javascript
return () => {
  delete window.memoriesPageFilters;
};
```

### 4. Notifications (Phase 15)

**✅ FAIRE** : Toujours utiliser `currentUser.id` (string)

javascript

```javascript
// ✅ BON
const userId = app.currentUser.id;
window.notificationManager.hasUnreadNotificationForSession(sessionId, userId);

// ❌ MAUVAIS
window.notificationManager.hasUnreadNotificationForSession(sessionId, app.currentUser);
```

**✅ FAIRE** : Vérifier existence avant envoi

javascript

```javascript
const existingNotif = window.notificationManager?.getNotificationForSession(
  sessionId, 
  currentUserId
);
if (!existingNotif) {
  // Envoyer
}
```

**✅ FAIRE** : Marquer read au bon moment

javascript

```javascript
// À l'ouverture
openChatSession(session) {
  const notif = notificationManager.getNotificationForSession(session.id, currentUserId);
  if (notif) notificationManager.markAsRead(notif.id);
}

// À la réponse
addMessageToSession(sessionId, content) {
  // ... ajouter message ...
  const notif = notificationManager.getNotificationForSession(sessionId, currentUserId);
  if (notif) notificationManager.markAsRead(notif.id);
}
```

### 5. **Thèmes (Phase 16)**

**✅ FAIRE :**

- Toujours utiliser clés composites (`generatePostKey`, etc.)
- Vérifier `window.themeAssignments` existe avant usage
- Utiliser `sortThemes()` pour affichage cohérent
- Batch pour moment tagging (`assignThemesBatch`)

**❌ NE PAS :**

- Oublier `window.dataManager` (pas `window.app` !)
- Créer thèmes avec ID en doublon
- Activer moment tagging sans confirmation
- Supprimer thème sans cascade delete

**Code correct :**

```javascript
// ✅ BON : Récupérer state
const appState = window.dataManager?.getState();
const themes = appState?.masterIndex?.themes || [];

// ✅ BON : Trier thèmes
import { sortThemes } from '../utils/themeUtils.js';
const sortOrder = localStorage.getItem('mekong_theme_sort_order') || 'usage';
const sorted = sortThemes(themes, window.themeAssignments, sortOrder);

// ✅ BON : Batch assignation
await window.themeAssignments.assignThemesBatch(
  contentKeys,
  themeIds,
  userId
);

// ❌ MAUVAIS : window.app n'existe pas
const themes = window.app?.masterIndex?.themes; // ERREUR
```

### 6. Déploiement

Checklist :**

- [ ] Tests locaux OK
- [ ] `localStorage.clear()` + test
- [ ] Git commit descriptif
- [ ] Push → attendre build Cloudflare
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Test navigation privée
- [ ] Test mobile

---

## 🔧 Méthodologie de travail

1. **Étapes incrémentales** : Petites modifications testables
2. **Tests immédiats** : Vérifier après chaque changement
3. **Documentation synchrone** : Mettre à jour le guide en même temps
4. **Git commits fréquents** : Historique clair
5. **Analyse méthodique** : Logs → hypothèses → tests
6. **Fichiers complets** : Éviter copier/coller fragmenté

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement
- [ ] Vérifier `currentUser.id` vs `currentUser`

---

## ✨ Phases complétées

### Phase 13B : Messages riches + TopBar unifiée + Photos Mastodon

**Date :** Décembre 2024

### Phase 14.1 : Dashboard sessions (Option A+)

**Date :** Janvier 2025

### Phase 14.2 : Niveau 1 Minimalisme

**Date :** Janvier 2025

### Phase 14.3 : Système visuel unifié

**Date :** 5 janvier 2025

### Phase 15 : Système de notifications push 🔔

**Date :** 6 janvier 2025

---

### Phase 16.1 : Système de Thèmes - Infrastructure

**Date :** 10 octobre 2025

**Réalisations :**

**1. Infrastructure thèmes**

- `ThemeAssignments.js` v1.0 : Gestionnaire CRUD + persistance Drive
- `themeUtils.js` v1.0 : Helpers clés composites + validation
- Structure `theme_assignments.json` sur Drive
- Intégration thèmes dans `masterIndex` v5.0

**2. CRUD thèmes (Settings)**

- Création/Édition/Suppression thèmes
- Emoji picker natif
- Palette couleurs (5 couleurs)
- Stats d'utilisation par thème

**3. Tagging UI**

- Bouton 🏷️ posts (header)
- Bouton 🏷️ photos individuelle (PhotoViewer)
- Longpress → mode sélection → bulk tag
- ThemeModal optimisé (grille 2 colonnes)

**4. Filtrage**

- Toggle TopBar pour afficher/masquer barre thèmes
- Pills horizontales avec compteurs
- Filtrage moments par thème

**Fichiers modifiés :**

- `ThemeAssignments.js` v1.0 - **NOUVEAU**
- `themeUtils.js` v1.0 - **NOUVEAU**
- `ThemeModal.jsx` v1.1 - **NOUVEAU**
- `MasterIndexGenerator.js` v5.0 - Thèmes ajoutés
- `MemoriesPage.jsx` v6.3 - Tagging + filtrage
- `PhotoViewer.jsx` v2.7 - Bouton tag
- `SettingsPage.jsx` v4.1 - CRUD thèmes
- `UnifiedTopBar.jsx` v2.5 - Toggle thèmes

**Bugs identifiés (5) :**

1. Header posts incohérent
2. Redondance icône Tag
3. Header photos redondant
4. Bouton "créer thème" non fonctionnel
5. ThemeModal derrière PhotoViewer

---

### Phase 16.2 : Système de Thèmes - Avancé

**Date :** 11 octobre 2025

**Réalisations :**

**1. Corrections bugs Phase 16.1 (5/5)**

✅ **Bug 1 & 2 :** Header posts unifié `📸 N · 🏷️ M · 💬`

- Bouton 🏷️ intègre le compteur (pas 2 icônes)
- Indicateur 📸 avec compte
- `MemoriesPage.jsx` v6.4

✅ **Bug 3 :** Header photos `N Photos de "Titre"`

- Suppression compteur redondant
- `MemoriesPage.jsx` v6.4

✅ **Bug 4 :** Bouton "Créer thème" fonctionnel

- Redirection `window.dataManager.updateCurrentPage('settings')`
- Auto-open section Thèmes
- `ThemeModal.jsx` v1.2

✅ **Bug 5 :** z-index ThemeModal

- `zIndex: 10000` (devant PhotoViewer)
- `ThemeModal.jsx` v1.2

✅ **Bug bonus :** Thèmes non affichés PhotoViewer

- `window.dataManager.getState().masterIndex?.themes`
- `PhotoViewer.jsx` v2.7.1

**2. Optimisation ThemeAssignments v2.0**

- **Index inversé** : O(1) pour `getAllContentsByTheme()`
- **Batch operations** : `assignThemesBatch()` pour moments
- **Performance** : `getStats()` renvoie `indexSize`
- Rebuild automatique au chargement

**3. Ordre d'affichage thèmes**

**4 options (Settings) :**

1. **Par utilisation** (défaut) : Plus tagués en premier
2. **Par création** : Récents en premier  
3. **Alphabétique** : A → Z
4. **Manuel** : Ordre personnalisé (prévu)

**Implémentation :**

- `sortThemes()` dans `themeUtils.js` v1.1
- Sélecteur dans `SettingsPage.jsx` v4.2
- Persistance `localStorage`
- Affichage cohérent partout (Settings, Pills, Modal)

**4. Moment tagging avec confirmation**

**Toggle désactivé par défaut (Settings) :**

- Activation explicite requise
- Warning "EXPÉRIMENTAL"

**UX moment tagging :**

- Bouton "🏷️ Moment" dans header (si activé)

- Preview détaillé dans ThemeModal :
  
  - Compteurs (posts/photos moment/photos Mastodon)
  - Warning "écrasera thèmes existants"

- Confirmation explicite :
  
  ```
  ⚠️ CONFIRMATION REQUISE
  Vous allez appliquer 2 thèmes à :
  • 4 articles
  • 12 photos du moment
  • 8 photos des articles
  Total : 24 contenus
  
  Voulez-vous vraiment continuer ?
  ```

- Batch assignation performant

- Feedback après application

**Features :**

- Pas d'héritage automatique
- Batch via `assignThemesBatch()`
- Support dans `ThemeModal.jsx` (contentType = 'moment')

**5. Cascade delete amélioré**

- Confirmation renforcée si >10 assignations
- Message détaillé avec compteurs posts/photos
- Nettoyage automatique `theme_assignments.json`

**Fichiers modifiés :**

- `ThemeAssignments.js` v2.0 - Index inversé + Batch
- `themeUtils.js` v1.1 - sortThemes()
- `ThemeModal.jsx` v1.2 - z-index + redirect + moment preview
- `PhotoViewer.jsx` v2.7.1 - Thèmes fixes
- `MemoriesPage.jsx` v6.4 - Headers fixes + ordre thèmes + moment tagging
- `SettingsPage.jsx` v4.2 - Ordre + toggle moment + cascade delete

**Impact :**

- **UX optimale** : Thèmes pertinents en premier
- **Performance** : Index O(1), batch operations
- **Flexibilité** : 4 ordres d'affichage
- **Sécurité** : Moment tagging avec confirmation explicite
- **Robustesse** : Cascade delete intelligent

## 🛠️ Implémentation Phase 16.3 (en cours / à tester)

### **Étape 1 : Nouvelles clés composites avec niveau**

**Fichier : `themeUtils.js`**

Ajouter une fonction pour générer des clés "niveau parent" :

javascript

```javascript
/**
 * Génère une clé pour un moment entier
 */
export function generateMomentKey(moment) {
  return `moment:${moment.id}`;
}

/**
 * Récupère tous les contenus enfants d'un moment
 */
export function getMomentChildrenKeys(moment) {
  const keys = [];

  // Posts du moment
  const postKeys = [];
  moment.posts?.forEach(post => {
    const postKey = generatePostKey(post);
    postKeys.push(postKey);
    keys.push(postKey);
  });

  // Photos des posts
  const postPhotoKeys = [];
  moment.posts?.forEach(post => {
    post.photos?.forEach(photo => {
      const key = generatePhotoMastodonKey(photo);
      if (key) {
        postPhotoKeys.push(key);
        keys.push(key);
      }
    });
  });

  // Photos du moment
  const momentPhotoKeys = [];
  moment.dayPhotos?.forEach(photo => {
    const key = generatePhotoMomentKey(photo);
    if (key) {
      momentPhotoKeys.push(key);
      keys.push(key);
    }
  });

  return {
    all: keys,
    posts: postKeys,
    postPhotos: postPhotoKeys,
    momentPhotos: momentPhotoKeys
  };
}

/**
 * Récupère toutes les photos d'un post
 */
export function getPostChildrenKeys(post) {
  const keys = [];

  post.photos?.forEach(photo => {
    const key = generatePhotoMastodonKey(photo);
    if (key) keys.push(key);
  });

  return keys;
}
```

---

### **Étape 2 : Modification ThemeModal avec checkboxes**

**Fichier : `ThemeModal.jsx`**

Ajouter un état pour les options de propagation :

javascript

```javascript
export default function ThemeModal({ 
  isOpen, 
  onClose, 
  availableThemes,
  currentThemes,
  onSave,
  title = "Assigner des thèmes",
  contentType = null,
  momentData = null,
  postData = null // ✅ NOUVEAU pour posts
}) {
  const [selectedThemes, setSelectedThemes] = useState([]);

  // ✅ NOUVEAU : Options de propagation
  const [propagationOptions, setPropagationOptions] = useState({
    applyToPosts: false,
    applyToPostPhotos: false,
    applyToMomentPhotos: false,
    applyToPhotos: false // Pour posts → photos
  });

  // Reset options quand modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedThemes(currentThemes || []);
      setPropagationOptions({
        applyToPosts: false,
        applyToPostPhotos: false,
        applyToMomentPhotos: false,
        applyToPhotos: false
      });
    }
  }, [isOpen, currentThemes]);

  // ... handlers existants ...

  const handleSave = () => {
    onSave(selectedThemes, propagationOptions); // ✅ Passer les options
    onClose();
  };

  return (
    <div className="..." onClick={handleCancel}>
      <div className="..." onClick={(e) => e.stopPropagation()}>

        {/* Header - INCHANGÉ */}

        {/* ✅ NOUVEAU : Preview moment avec checkboxes */}
        {contentType === 'moment' && momentData && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">📦</span>
                <h4 className="font-medium text-purple-900">{momentData.momentTitle}</h4>
              </div>

              <p className="text-sm text-purple-700 mb-3">
                Choisissez où appliquer les thèmes :
              </p>

              {/* ✅ Checkboxes de propagation */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToPosts}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToPosts: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-purple-800">
                    📄 Appliquer aux {momentData.stats.postCount} article{momentData.stats.postCount > 1 ? 's' : ''}
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer ml-6">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToPostPhotos}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToPostPhotos: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-purple-800">
                    📸 Inclure {momentData.stats.photoMastodonCount} photo{momentData.stats.photoMastodonCount > 1 ? 's' : ''} des articles
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToMomentPhotos}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToMomentPhotos: e.target.checked
                    }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-purple-800">
                    📸 Appliquer aux {momentData.stats.photoMomentCount} photo{momentData.stats.photoMomentCount > 1 ? 's' : ''} du moment
                  </span>
                </label>
              </div>

              <p className="text-xs text-purple-700 mt-3 italic">
                Les thèmes du moment seront toujours appliqués au moment lui-même
              </p>
            </div>
          </div>
        )}

        {/* ✅ NOUVEAU : Preview post avec checkbox */}
        {contentType === 'post' && postData && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">📄</span>
                <h4 className="font-medium text-blue-900">{postData.postTitle}</h4>
              </div>

              {postData.photoCount > 0 && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToPhotos}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToPhotos: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-blue-800">
                    📸 Appliquer aux {postData.photoCount} photo{postData.photoCount > 1 ? 's' : ''} de cet article
                  </span>
                </label>
              )}

              <p className="text-xs text-blue-700 mt-2 italic">
                Les thèmes de l'article seront toujours appliqués à l'article lui-même
              </p>
            </div>
          </div>
        )}

        {/* Liste thèmes - INCHANGÉ */}

        {/* Footer - INCHANGÉ */}

      </div>
    </div>
  );
}
```

---

### **Étape 3 : Handlers avec propagation**

**Fichier : `MemoriesPage.jsx`**

Modifier les handlers pour gérer la propagation :

javascript

```javascript
// Handler moment avec propagation
const handleSaveMomentThemes = useCallback(async (selectedThemes, propagationOptions, momentData) => {
  if (!momentData || !app.currentUser) return;

  const keysToTag = [];

  // 1. Toujours tagger le moment lui-même
  const momentKey = generateMomentKey(momentData.moment);
  keysToTag.push(momentKey);

  // 2. Collecter les enfants selon options
  const childrenKeys = getMomentChildrenKeys(momentData.moment);

  if (propagationOptions.applyToPosts) {
    keysToTag.push(...childrenKeys.posts);
  }

  if (propagationOptions.applyToPostPhotos) {
    keysToTag.push(...childrenKeys.postPhotos);
  }

  if (propagationOptions.applyToMomentPhotos) {
    keysToTag.push(...childrenKeys.momentPhotos);
  }

  // 3. Confirmation
  const confirmMessage = `⚠️ CONFIRMATION\n\n` +
    `Appliquer ${selectedThemes.length} thème${selectedThemes.length > 1 ? 's' : ''} à :\n\n` +
    `• 1 moment\n` +
    (propagationOptions.applyToPosts ? `• ${childrenKeys.posts.length} article${childrenKeys.posts.length > 1 ? 's' : ''}\n` : '') +
    (propagationOptions.applyToPostPhotos ? `• ${childrenKeys.postPhotos.length} photo${childrenKeys.postPhotos.length > 1 ? 's' : ''} d'articles\n` : '') +
    (propagationOptions.applyToMomentPhotos ? `• ${childrenKeys.momentPhotos.length} photo${childrenKeys.momentPhotos.length > 1 ? 's' : ''} du moment\n` : '') +
    `\nTotal : ${keysToTag.length} élément${keysToTag.length > 1 ? 's' : ''}\n\n` +
    `Continuer ?`;

  if (!confirm(confirmMessage)) {
    setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [], momentData: null });
    return;
  }

  // 4. Batch assignation
  const result = await window.themeAssignments.assignThemesBatch(
    keysToTag,
    selectedThemes,
    app.currentUser.id
  );

  if (result.success) {
    alert(`✅ ${result.count} élément${result.count > 1 ? 's' : ''} taggué${result.count > 1 ? 's' : ''} !`);
  }

  setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [], momentData: null });
  setViewerState(prev => ({ ...prev }));
}, [app.currentUser]);

// Handler post avec propagation
const handleSavePostThemes = useCallback(async (selectedThemes, propagationOptions, postData) => {
  if (!postData || !app.currentUser) return;

  const keysToTag = [];

  // 1. Toujours tagger le post lui-même
  const postKey = generatePostKey(postData.post);
  keysToTag.push(postKey);

  // 2. Optionnellement tagger les photos du post
  if (propagationOptions.applyToPhotos) {
    const photoKeys = getPostChildrenKeys(postData.post);
    keysToTag.push(...photoKeys);
  }

  // 3. Batch assignation (pas de confirmation si juste le post)
  const result = await window.themeAssignments.assignThemesBatch(
    keysToTag,
    selectedThemes,
    app.currentUser.id
  );

  if (result.success) {
    console.log(`✅ Post taggué${propagationOptions.applyToPhotos ? ' avec photos' : ''}`);
  }

  setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [], postData: null });
  setViewerState(prev => ({ ...prev }));
}, [app.currentUser]);
```

---

### **Étape 4 : Badges UNIQUEMENT niveau actuel**

**Modifier l'affichage des badges pour ne compter QUE le niveau actuel :**

javascript

```javascript
// Dans MomentHeader
const momentKey = generateMomentKey(moment);
const momentThemes = window.themeAssignments?.getThemesForContent(momentKey) || [];
const hasMomentThemes = momentThemes.length > 0;

// Badge moment (ne compte PAS les enfants)
{hasMomentThemes && (
  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
    🏷️ {momentThemes.length}
  </span>
)}
```

---

## 📦

---

## 🚀 Roadmap : Prochaines phases

### Phase 17 : page chat avec volet d'exploration de souvenir

**Priorité :** HAUTE

### Phase 18 : Page Jeux de remémoration 🎮

**Priorité :** MOYENNE

**Objectif :** Réintroduire une page de mini-jeux pour stimuler la mémoire de façon ludique.

**Idées :**

- Quiz photos : "Quel jour était cette photo ?"
- Timeline reconstruction
- Memory game avec photos du voyage
- Challenges quotidiens

---

## 📊 État actuel du code

### Fichiers principaux et versions

| Fichier                 | Version | État     | Notes                          |
| ----------------------- | ------- | -------- | ------------------------------ |
| App.jsx                 | v2.2    | ✅ Stable | TopBar fixe                    |
| UnifiedTopBar.jsx       | v2.5    | ✅ Stable | Toggle thèmes                  |
| MemoriesPage.jsx        | v6.4    | ✅ Stable | Headers fixes + Moment tagging |
| SessionsPage.jsx        | v6.2    | ✅ Stable | Groupes + notifications        |
| ChatPage.jsx            | v2.1    | ✅ Stable | PhotoMessage                   |
| PhotoViewer.jsx         | v2.7.1  | ✅ Stable | Thèmes fixes                   |
| ThemeModal.jsx          | v1.2    | ✅ Stable | z-index + redirect + moment    |
| SettingsPage.jsx        | v4.2    | ✅ Stable | Ordre + toggle + cascade       |
| dataManager.js          | v3.5    | ✅ Stable | Photo user message             |
| ThemeAssignments.js     | v2.0    | ✅ Stable | Index inversé + Batch          |
| themeUtils.js           | v1.1    | ✅ Stable | sortThemes + helpers           |
| NotificationManager.js  | v1.0    | ✅ Stable | Système notifications          |
| sessionUtils.js         | v2.0    | ✅ Stable | NOTIFIED priorité 1            |
| PhotoDataV2.js          | v3.6    | ✅ Stable | Mobile optimized               |
| MasterIndexGenerator.js | v5.0    | ✅ Stable | Thèmes                         |

### Points d'amélioration identifiés

**Technique :**

- [ ] Tests unitaires (actuellement 0%)
- [ ] Gestion erreurs réseau Drive
- [ ] Optimisation images (WebP)
- [ ] Service Worker PWA
- [ ] Polling automatique notifications
- [ ] Drag & drop ordre thèmes

**UX :**

- [ ] Transitions page (React Router)
- [ ] Animations micro-interactions
- [ ] Mode offline basique
- [ ] Accessibilité (ARIA labels)
- [ ] Sons notification

**Fonctionnalités :**

- [ ] Export sessions PDF
- [ ] Recherche full-text avancée
- [ ] Tags/labels personnalisés
- [ ] Mode sombre

---

## 📝 Changelog récent

### v2.4 (11 octobre 2025) - Phase 16.2 complète- Phase 16.3 à tester

**Added :**

- Ordre d'affichage thèmes (4 options)
- Moment tagging avec confirmation explicite
- Index inversé ThemeAssignments (performance O(1))
- Batch operations pour moments
- Cascade delete intelligent (>10 confirmation renforcée)

**Changed :**

- ThemeAssignments v2.0 : index inversé + batch
- themeUtils v1.1 : sortThemes()
- ThemeModal v1.2 : z-index 10000 + redirect + moment preview
- PhotoViewer v2.7.1 : window.dataManager au lieu de window.app
- MemoriesPage v6.4 : headers fixes + ordre thèmes + moment tagging
- SettingsPage v4.2 : ordre + toggle moment + cascade delete

**Fixed :**

- Header posts incohérent (📸 N · 🏷️ M · 💬)
- Header photos redondant (N Photos de "Titre")
- Bouton "créer thème" ne redirige pas
- ThemeModal derrière PhotoViewer
- Thèmes non affichés dans PhotoViewer
- window.app → window.dataManager

---

**Version du guide :** 2.4  
**Dernière révision :** Phase 16.2 complète  
**Prochaine phase :** 17 - Optimisations UX