# 📄 MM Dev Guide v2.4 - Système de thèmes

<artifact identifier="mm-dev-guide-v24" type="text/markdown" title="MM Dev Guide v2.4 - Système de thèmes">
# Guide de développement - Mémoire du Mékong v2.4

**Dernière mise à jour : Phase 16 complète - Système de thèmes**  
**Date : 18 octobre 2025**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-g%C3%A9n%C3%A9rale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Système visuel unifié](#syst%C3%A8me-visuel-unifi%C3%A9)
6. [Gestion des photos](#gestion-des-photos)
7. [Messages et sessions](#messages-et-sessions)
8. [Système de notifications](#syst%C3%A8me-de-notifications)
9. [**Système de thèmes** ⭐](#syst%C3%A8me-de-th%C3%A8mes)
10. [Interface utilisateur](#interface-utilisateur)
11. [Bonnes pratiques](#bonnes-pratiques)
12. [Méthodologie de travail](#m%C3%A9thodologie-de-travail)
13. [Phases complétées](#phases-compl%C3%A9t%C3%A9es)
14. [Roadmap : Prochaines phases](#roadmap-prochaines-phases)

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme un **carnet d'expériences de voyage interactif**. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Stockage sur Google Drive
- **✨ Navigation par Moments :** Unités thématiques (1+ jours)
- **⏱️ Timeline Interactive :** Frise chronologique visuelle
- **📰 Contenu Riche :** Articles Mastodon + galeries photos
- **💬 Sessions conversationnelles :** Dialogues autour des souvenirs
- **🔔 Notifications push :** Communication asynchrone entre utilisateurs
- **🏷️ Thèmes personnalisés :** Organisation thématique des contenus
- **⚙️ Synchronisation Automatique :** Connexion Drive au démarrage

---

## 🏗 Architecture générale

### Stack technique

- **React 18** (hooks, refs, forwardRef, useMemo)
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
- **Theme System** : ThemeAssignments (Map-based) + theme-assignments.json

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée (v2.3)
│   ├── UnifiedTopBar.jsx          # ✅ Barre contextuelle (v2.5 - toggle thèmes)
│   ├── Navigation.jsx             # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx            # ✅ (v2.7 - thèmes)
│   ├── ThemeModal.jsx             # ✅ NOUVEAU - Modal assignation thèmes
│   ├── SessionCreationModal.jsx   # (v1.1)
│   ├── SessionCreationSpinner.jsx
│   ├── StatsModal.jsx
│   ├── TimelineRule.jsx           # (v3.1)
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ (v7.0 - barre filtres thèmes)
│       ├── SessionsPage.jsx       # ✅ (v6.2 - groupes + notifications)
│       ├── ChatPage.jsx           # (v2.1 - PhotoMessage)
│       ├── SettingsPage.jsx       # ✅ (v4.2 - CRUD thèmes + modal suppression)
│       └── UserSelectionPage.jsx
├── core/
│   ├── dataManager.js             # ✅ v3.6 - Auto markAsRead
│   ├── ConnectionManager.js       # v0.9.0 - Token OAuth
│   ├── DriveSync.js               # Pagination (pageSize: 1000)
│   ├── StateManager.js            # v0.7.0
│   ├── UserManager.js             # ✅ v2.1 - getAllUsers
│   ├── PhotoDataV2.js             # v3.6 - Mobile optimized
│   ├── MastodonData.js            # v0.8
│   ├── MasterIndexGenerator.js    # ✅ v4.1 - Mastodon flat
│   ├── NotificationManager.js     # ✅ v1.0 - Système notifications
│   └── ThemeAssignments.js        # ✅ v1.0 - NOUVEAU (Phase 16)
├── hooks/
│   └── useAppState.js             # ✅ + sendNotification, getUnreadCount
├── utils/
│   ├── sessionUtils.js            # ✅ v2.0 - SESSION_STATUS.NOTIFIED
│   └── themeUtils.js              # ✅ v1.0 - NOUVEAU (Phase 16)
└── main.jsx                       # ✅ + NotificationManager + ThemeAssignments injection
```

### État déployé

- **CloudFlare Pages** : [https://mekongtandememoire.pages.dev/](https://mekongtandememoire.pages.dev/)
- **Compte** : [mekongtandem@gmail.com](mailto:mekongtandem@gmail.com)
- **Repository** : mekongtandem-crypto (GitHub)

---

## 🧩 Composants principaux

### 1. App.jsx (v2.3)

**États partagés :**

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
const [isThemeBarVisible, setIsThemeBarVisible] = useState(false); // ✅ Phase 16
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

---

### 2. UnifiedTopBar.jsx (v2.5)

**Structure :** `[Action] [Contexte central] [...] [Avatar coloré]`

| Page     | Gauche                     | Centre                               | Avatar           |
| -------- | -------------------------- | ------------------------------------ | ---------------- |
| Memories | 🏷️ + Timeline + Recherche | Dé + J15 + Options + Filtre dropdown | Menu utilisateur |
| Chat     | ← Retour                   | Titre session + 🔔 Notifier          | Menu utilisateur |
| Sessions | + Nouvelle                 | X Sessions · 🔔 Y · 🟡 Z · 🔵 W      | Menu utilisateur |
| Settings | ⚙️                         | "Réglages"                           | Menu utilisateur |

**Nouveautés Phase 16 :**

**Bouton toggle thèmes (ligne 148) :**

jsx

```jsx
{themeCount > 0 && (
  <button 
    onClick={() => setIsThemeBarVisible?.(!isThemeBarVisible)} 
    className={`p-1.5 rounded transition-colors ${
      isThemeBarVisible 
        ? 'bg-amber-100 text-amber-600' 
        : 'text-gray-400 hover:bg-gray-100'
    }`}
  >
    <Tag className="w-4 h-4" />
  </button>
)}
```

---

### 3. MemoriesPage.jsx (v7.0)

**Nouveautés Phase 16 :**

- Barre de filtres thématiques (toggle via TopBar)
- Calcul dynamique `themeStats` avec `useMemo`
- Badge thèmes au niveau sous-titre (MomentHeader)
- Bouton 🏷️ sur moment → ThemeModal avec options propagation

**Calcul themeStats :**

javascript

```javascript
const availableThemes = app.masterIndex?.themes || [];

const themeStats = useMemo(() => {
  if (!window.themeAssignments || availableThemes.length === 0) {
    return [];
  }

  return availableThemes
    .map(theme => {
      const contents = window.themeAssignments.getAllContentsByTheme(theme.id) || [];
      return {
        id: theme.id,
        name: theme.name,
        icon: theme.icon,
        color: theme.color,
        count: contents.length
      };
    })
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);
}, [availableThemes]);
```

**Barre filtres thèmes :**

jsx

```jsx
{isThemeBarVisible && themeStats.length > 0 && (
  <div className="bg-white border-b border-gray-200 px-4 py-3">
    <div className="flex items-center space-x-2 overflow-x-auto">
      <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <button onClick={() => setSelectedTheme(null)}>Tous</button>
      {themeStats.map(theme => (
        <button key={theme.id} onClick={() => setSelectedTheme(theme.id)}>
          {theme.icon} {theme.name} ({theme.count})
        </button>
      ))}
    </div>
  </div>
)}
```

---

### 4. SettingsPage.jsx (v4.2)

**Nouveautés Phase 16 :**

- Section "Mes thèmes" avec CRUD complet
- Formulaire création : nom + emoji + couleur
- Liste thèmes avec compteurs (posts/photos)
- Modal React personnalisé pour suppression (pas confirm navigateur)
- Compteurs dynamiques via `countThemeContents()`

**Fonction de suppression avec modal :**

javascript

```javascript
const [confirmDelete, setConfirmDelete] = useState({
  isOpen: false,
  themeId: null,
  message: ''
});

const handleDeleteTheme = async (themeId) => {
  const theme = themes.find(t => t.id === themeId);
  const stats = countThemeContents(window.themeAssignments, themeId);

  // Ouvrir modal React personnalisé
  setConfirmDelete({
    isOpen: true,
    themeId: themeId,
    message: stats.totalCount > 0 
      ? `⚠️ Ce thème est utilisé sur ${stats.totalCount} contenus...`
      : `Supprimer "${theme.name}" ?`,
    stats: stats
  });
};
```

---

### 5. ThemeModal.jsx (v1.0) - NOUVEAU

**Composant réutilisable** pour assigner des thèmes à n'importe quel contenu.

**Props :**

javascript

```javascript
{
  isOpen: boolean,
  onClose: function,
  availableThemes: Array,      // Thèmes disponibles
  currentThemes: Array,         // Thèmes actuellement assignés
  onSave: function,             // Callback(selectedThemes, propagationOptions)
  title: string,
  description: string,
  contentType: 'moment'|'post'|'photo',
  momentData: Object,           // Stats pour propagation
  postData: Object
}
```

**Features :**

- Titre dynamique : "Gérer les thèmes"
- Sous-titre : "Cochez pour ajouter, décochez pour retirer"
- Indication "(actuel)" sur thèmes déjà assignés
- Options propagation selon contentType :
  - **Moment** : ☐ Articles, ☐ Photos articles, ☐ Photos moment
  - **Post** : ☐ Photos de cet article

**Usage :**

jsx

```jsx
<ThemeModal
  isOpen={themeModal.isOpen}
  onClose={handleCloseThemeModal}
  availableThemes={availableThemes}
  currentThemes={themeModal.currentThemes}
  onSave={handleSaveThemes}
  contentType="moment"
  momentData={{
    momentTitle: "Chang Maï",
    stats: {
      postCount: 2,
      photoMastodonCount: 8,
      photoMomentCount: 20
    }
  }}
/>
```

---

## 🏷️ Système de thèmes

### Architecture (Phase 16)

**3 fichiers clés :**

1. **masterIndex.json** : Définitions thèmes
2. **theme-assignments.json** : Associations
3. **ThemeAssignments.js** : Manager (Map-based)

---

### 1. masterIndex.json

**Structure :**

json

```json
{
  "version": "4.1",
  "themes": [
    {
      "id": "temples",
      "name": "Temples",
      "icon": "🛕",
      "color": "purple",
      "createdAt": "2025-10-15T10:00:00Z",
      "createdBy": "lambert"
    }
  ],
  "moments": [...]
}
```

**Propriétés thème :**

| Champ     | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| id        | string   | Slug unique (lowercase, no spaces) |
| name      | string   | Nom d'affichage                    |
| icon      | string   | Emoji libre (1-2 caractères)       |
| color     | string   | purple\|orange\|blue\|green\|red   |
| createdAt | ISO date | Timestamp création                 |
| createdBy | string   | User ID créateur                   |

---

### 2. theme-assignments.json

**Structure :**

json

```json
{
  "version": "1.0",
  "assignments": {
    "moment:moment_1_bangkok": ["temples", "culture"],
    "post:post_12345": ["temples"],
    "photo:IMG20221022.jpg": ["temples", "architecture"]
  }
}
```

**Format clés :**

| Type   | Clé                 | Exemple                   |
| ------ | ------------------- | ------------------------- |
| Moment | `moment:{momentId}` | `moment:moment_1_bangkok` |
| Post   | `post:{postId}`     | `post:post_12345`         |
| Photo  | `photo:{filename}`  | `photo:IMG20221022.jpg`   |

---

### 3. ThemeAssignments.js (v1.0)

**Manager de thèmes** avec architecture Map pour performance.

**API publique :**

javascript

```javascript
class ThemeAssignments {
  async init()

  // Assignation
  async assignThemes(contentKey, themeIds)
  async removeTheme(contentKey, themeId)
  async clearThemes(contentKey)

  // Lecture
  getThemesForContent(contentKey)
  getAllContentsByTheme(themeId)
  hasTheme(contentKey, themeId)

  // Suppression cascade
  async deleteThemeAssignments(themeId)

  // Stats
  getThemeStats(themeId)
}
```

**Exemple usage :**

javascript

```javascript
// Assigner thèmes à un moment
const momentKey = `moment:${moment.id}`;
await window.themeAssignments.assignThemes(momentKey, ['temples', 'culture']);

// Récupérer thèmes d'un post
const postKey = `post:${post.id}`;
const themes = window.themeAssignments.getThemesForContent(postKey);

// Trouver tous contenus d'un thème
const contents = window.themeAssignments.getAllContentsByTheme('temples');
// → ['moment:moment_1', 'post:post_123', 'photo:IMG001.jpg']
```

---

### Propagation intelligente

**Options dans ThemeModal :**

#### **A. Tagger un moment**

```
Assigner les thèmes suivants à 🗺️ "Chang Maï"

  ☐ 📄 2 articles
     ☐ 📸 8 photos (articles)
  ☐ 📸 20 photos (moment)
```

**Logique :**

- Si "articles" coché → tag les 2 posts
- Si "photos articles" coché → tag les 8 photos des posts
- Si "photos moment" coché → tag les 20 photos du moment

#### **B. Tagger un post**

```
Assigner les thèmes suivants à 📄 "Visite Wat Pho"

  ☐ 📸 4 photos
```

**Logique :**

- Tag le post toujours
- Si "photos" coché → tag aussi les 4 photos

#### **C. Tagger une photo**

```
Assigner les thèmes suivants à 📸 IMG20221022.jpg

[Pas d'options propagation]
```

---

### Clés de contenu

**Fonctions utilitaires dans MemoriesPage :**

javascript

```javascript
// Générer clé moment
const momentKey = `moment:${moment.id}`;

// Générer clé post
const postKey = `post:${post.id}`;

// Générer clé photo
const photoKey = `photo:${photo.filename}`;

// Récupérer toutes les clés d'un moment (pour propagation)
function getMomentChildrenKeys(moment) {
  const keys = {
    posts: [],
    postPhotos: [],
    momentPhotos: [],
    all: []
  };

  moment.posts?.forEach(post => {
    const postKey = `post:${post.id}`;
    keys.posts.push(postKey);
    keys.all.push(postKey);

    post.photos?.forEach(photo => {
      const photoKey = `photo:${photo.filename}`;
      keys.postPhotos.push(photoKey);
      keys.all.push(photoKey);
    });
  });

  moment.dayPhotos?.forEach(photo => {
    const photoKey = `photo:${photo.filename}`;
    keys.momentPhotos.push(photoKey);
    keys.all.push(photoKey);
  });

  return keys;
}
```

---

### themeUtils.js (v1.0)

**Utilitaires thèmes** pour toute l'app.

**Exports principaux :**

javascript

```javascript
// Palette couleurs
export const THEME_COLORS = {
  purple: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-300', 
    badge: 'bg-purple-500' 
  },
  // ... orange, blue, green, red
};

// Générer ID unique
export function generateThemeId(name)

// Compter contenus d'un thème
export function countThemeContents(themeAssignments, themeId)
// → { momentCount, postCount, photoCount, totalCount }

// Trier thèmes
export function sortThemes(themes, themeAssignments, sortOrder)
// sortOrder: 'usage' | 'created' | 'alpha' | 'manual'
```

---

### Flow complet d'assignation

**1. User clique 🏷️ sur moment**

```
MemoriesPage → handleTagMoment()
  → Prépare momentData (stats)
  → window.memoriesPageActions.openThemeModal()
```

**2. Modal s'ouvre**

```
ThemeModal
  → Affiche thèmes disponibles
  → Pré-coche thèmes actuels (getThemesForContent)
  → Affiche options propagation
```

**3. User coche/décoche + valide**

```
ThemeModal → onSave(selectedThemes, propagationOptions)
  → handleSaveThemes()
  → Applique selon options :
    - applyToPosts: true → tag posts
    - applyToPostPhotos: true → tag photos posts
    - applyToMomentPhotos: true → tag photos moment
```

**4. Sauvegarde**

```
handleSaveThemes()
  → window.themeAssignments.assignThemes(contentKey, themes)
  → theme-assignments.json mis à jour sur Drive
  → UI refresh automatique
```

---

### Badges et indicateurs

**Placement stratégique :**

| Composant        | Badge | Format                       | Comportement        |
| ---------------- | ----- | ---------------------------- | ------------------- |
| MomentHeader     | ✅     | `🏷️ 3` au niveau sous-titre | Pastille numérotée  |
| PhotoViewer      | ✅     | Bouton coloré + pastille     | Orange si >0 thèmes |
| Vignettes photos | ❌     | Retiré volontairement        | Interface épurée    |
| ThemeModal       | ✅     | "(actuel)" sur thèmes        | Indication claire   |

**Code MomentHeader :**

jsx

```jsx
<div className="ml-auto flex items-center space-x-2">
  <button onClick={handleTagMoment} className={`relative p-1.5 rounded ${
    hasMomentThemes ? 'bg-purple-100 text-purple-600' : 'hover:bg-purple-50'
  }`}>
    <Tag className="w-4 h-4" />
    {hasMomentThemes && (
      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4">
        {momentThemes.length}
      </span>
    )}
  </button>
</div>
```

---

## 🎨 Système visuel unifié

### Philosophie (Phase 14.3 + 16)

**Couleurs discrètes (cadres/fonds uniquement) + Icônes explicites (concepts)**

### Palette de couleurs

| Usage                   | Couleur   | Classes Tailwind                 | Contexte                          |
| ----------------------- | --------- | -------------------------------- | --------------------------------- |
| **Notifications**       | 🟠 Orange | `bg-orange-50 border-orange-200` | Sessions notifiées (priorité 1)   |
| **Sessions/Chat**       | 🟡 Amber  | `bg-amber-50 border-amber-200`   | Sessions à traiter (priorité 2)   |
| **Moments/Souvenirs**   | 🟣 Purple | `bg-purple-50 border-purple-200` | Exploration, découverte, thèmes   |
| **Timeline/Navigation** | 🔵 Blue   | `bg-blue-50 border-blue-200`     | Navigation temporelle, en attente |
| **Photos/Galeries**     | 🟢 Green  | `bg-green-50 border-green-200`   | Médias visuels, terminé           |

### Icônes explicites

| Concept       | Icône | Usage                                |
| ------------- | ----- | ------------------------------------ |
| Notifications | 🔔    | Badge priorité 1, bouton notifier    |
| Sessions/Chat | 💬    | Boutons session, compteur messages   |
| **Thèmes**    | 🏷️   | **Boutons tag, filtres thématiques** |
| Moments       | ✨     | Badge moments non explorés           |
| Timeline      | 🗺️   | Bouton timeline                      |
| Recherche     | 🔍    | Bouton search                        |
| Photos        | 📸    | Photos moments                       |
| Articles      | 📄    | Posts Mastodon                       |
| Random        | 🎲    | Moment aléatoire                     |
| Réglages      | ⚙️    | Settings                             |

**Principe :** Les couleurs sont subtiles (contexte), les icônes sont fortes (action/concept)

---

## 📸 Gestion des photos

### Structure Drive

```
Medias/
├── Photos/
│   ├── 1. Jour 1 Bangkok/
│   │   ├── IMG001.jpg (google_drive_id: xxx)
│   │   └── IMG002.jpg (google_drive_id: yyy)
│   └── 2-3. Ayutthaya/
│       └── IMG003.jpg
└── Mastodon/
    └── Mastodon_Photos/  ← ✅ Structure aplatie
        ├── photo1.jpg (google_drive_id: aaa)
        ├── photo2.jpg (google_drive_id: bbb)
        └── photo3.jpg (google_drive_id: ccc)
```

### Flow complet

**1. Génération masterIndex :**

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

---

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

### Statuts de sessions (Phase 15)

**Table de priorité :**

| Priorité | Statut        | Icône | Condition                  | TopBar       | SessionsPage           |
| -------- | ------------- | ----- | -------------------------- | ------------ | ---------------------- |
| 1        | NOTIFIED      | 🔔    | Notification non répondue  | Badge orange | Groupe "🔔 NOTIFIÉES"  |
| 2        | PENDING_YOU   | 🟡    | Dernier msg ≠ currentUser  | Badge jaune  | Groupe "🟡 À TRAITER"  |
| 3        | PENDING_OTHER | 🔵    | Dernier msg = currentUser  | Badge bleu   | Groupe "🔵 EN ATTENTE" |
| 4        | COMPLETED     | ✅     | session.completed === true | -            | Groupe "✅ TERMINÉES"   |
| -        | ARCHIVED      | 📦    | session.archived === true  | -            | Masqué                 |

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
  → Auto markAsRead si notification existe
```

---

## 🎨 Interface utilisateur

### Layout

```
┌─────────────────────────────────────┐
│ UnifiedTopBar (48px, fixed)         │
├─────────────────────────────────────┤
│ Content (pt-12 pb-16)               │
├─────────────────────────────────────┤
│ BottomNavigation (64px, fixed)      │
└─────────────────────────────────────┘
```

### TopBar par page

**Memories :**

```
[🏷️] [🗺️] [🔍] [🎲] J15 [📄][🖼️][📸] Filtre ▼ [Avatar]
 ↑
toggle thèmes
```

**Sessions :**

```
[+] 12 Sessions · 🔔 2 · 🟡 3 · 🔵 1 · Tri ▼ [Avatar]
```

**Chat :**

```
[←] Titre session [🔔 Notifier] [...] [Avatar]
```

**Avatar (tous) :**

- Fond coloré selon utilisateur
- Menu déroulant : changement utilisateur direct

### Responsive

- **Mobile (< 640px)** : Options inline masquées, dropdown étendu
- **Desktop (≥ 640px)** : Tout visible

---

## ✅ Bonnes pratiques

### 1. Photos Mastodon

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

### 5. Thèmes (Phase 16) ⭐

**✅ FAIRE** : Toujours utiliser clés standardisées

javascript

```javascript
// ✅ BON
const momentKey = `moment:${moment.id}`;
const postKey = `post:${post.id}`;
const photoKey = `photo:${photo.filename}`;

// ❌ MAUVAIS
const key = moment.id; // Pas de préfixe
```

**✅ FAIRE** : Utiliser `useMemo` pour calculs coûteux

javascript

```javascript
const themeStats = useMemo(() => {
  return availableThemes
    .map(theme => ({
      ...theme,
      count: window.themeAssignments.getAllContentsByTheme(theme.id).length
    }))
    .filter(t => t.count > 0);
}, [availableThemes]);
```

**❌ NE PAS** : Stocker thèmes dans masterIndex

javascript

```javascript
// ❌ MAUVAIS (plan original abandonné)
post.themes = ["temples"];

// ✅ BON (architecture actuelle)
window.themeAssignments.assignThemes(`post:${post.id}`, ["temples"]);
```

**✅ FAIRE** : Modal React pour confirmations critiques

javascript

```javascript
// ✅ BON - Modal personnalisé
<ConfirmModal isOpen={confirmDelete.isOpen} onConfirm={executeDelete} />

// ❌ ÉVITER - confirm() navigateur (peut être bloqué)
if (confirm('Supprimer ?')) { /* ... */ }
```

### 6. Déploiement

**Checklist :**

- [ ] Tests locaux OK
- [ ] `localStorage.clear()` + test
- [ ] Git commit descriptif
- [ ] Push → attendre build Cloudflare
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Test navigation privée
- [ ] Test mobile

---

## 🔧 Méthodologie de travail

### Ce qui fonctionne

1. **Étapes incrémentales** : Petites modifications testables
2. **Tests immédiats** : Vérifier après chaque changement
3. **Documentation synchrone** : Mettre à jour le guide en même temps
4. **Git commits fréquents** : Historique clair
5. **Analyse méthodique** : Logs → hypothèses → tests
6. **Fichiers complets** : Éviter copier/coller fragmenté
7. **Console.log debugging** : Tracer exécution pas à pas
8. **Prendre du recul** : Si bug >3 tentatives, revoir approche globale

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement
- [ ] Vérifier `currentUser.id` vs `currentUser`
- [ ] Inspecter DOM (éléments cachés ?)
- [ ] Tests console rapides avant modification code

---

## ✨ Phases complétées

### Phase 13B : Messages riches + TopBar unifiée + Photos Mastodon

**Date :** Décembre 2024

**Réalisations :**

- Messages avec photos dans bulles utilisateur
- TopBar contextuelle unifiée
- Photos Mastodon avec mapping plat
- Stats corrigées dans SettingsPage

### Phase 14.1 : Dashboard sessions (Option A+)

**Date :** Janvier 2025

**Réalisations :**

- Dashboard avec volets Activité/Suggestions/Stats
- Filtres par statut (onglets)
- Toggle vue cards/compact
- **Note :** Dashboard supprimé en Phase 14.2 (redondant)

### Phase 14.2 : Niveau 1 Minimalisme

**Date :** Janvier 2025

**Réalisations :**

- **SUPPRESSION Dashboard** (maximum espace pour sessions)
- TopBar enrichie avec badges cliquables (🔴🟡🔵✨)
- Liste groupée automatique par statut
- Sections repliables avec mémorisation
- Filtrage 1 clic via badges TopBar
- **70% moins de code** vs v5.1

### Phase 14.3 : Système visuel unifié

**Date :** 5 janvier 2025

**Réalisations :**

- **Philosophie design clarifiée** : Couleurs discrètes + Icônes explicites
- TopBar MemoriesPage v2.0 :
  - Dropdown filtre (Tous/Non explorés/Avec articles/Avec photos)
  - Options affichage inline [📄] [🖼️] [📸]
  - Suppression menu "..." (options désormais visibles)
- Filtrage intelligent moments avec callbacks exposés
- Icônes unifiées : 💬 Sessions, ✨ Moments non explorés
- Badge ✨ redirige vers Memories

### Phase 15 : Système de notifications push 🔔

**Date :** 6 janvier 2025

**Réalisations :**

- NotificationManager.js v1.0
- Stockage notifications.json sur Drive
- Système de statuts avec 4 priorités
- TopBar Sessions avec badges cliquables
- Bouton 🔔 dans ChatPage
- Auto markAsRead à l'ouverture/réponse
- sessionUtils v2.0 avec SESSION_STATUS.NOTIFIED

---

### Phase 16 : Système de thèmes 🏷️ ⭐

**Date :** 18 octobre 2025

**Objectif :** Permettre l'organisation thématique des contenus (temples, gastronomie, transport, etc.)

**Réalisations :**

**Architecture séparée (décision clé) :**

- ✅ `ThemeAssignments.js` v1.0 : Manager Map-based
- ✅ `theme-assignments.json` : Fichier Drive séparé
- ✅ `themeUtils.js` v1.0 : Utilitaires (THEME_COLORS, generateThemeId, countThemeContents)
- ✅ Clés standardisées : `moment:X`, `post:X`, `photo:X`

**Composants modifiés :**

- ✅ `SettingsPage.jsx` v4.2 :
  - Section "Mes thèmes" avec CRUD
  - Formulaire création (nom + emoji + couleur)
  - Liste avec compteurs dynamiques
  - Modal React pour suppression (pas confirm navigateur)
- ✅ `ThemeModal.jsx` v1.0 : Composant réutilisable
  - Props flexibles (moment/post/photo)
  - Options propagation intelligentes
  - Indication "(actuel)" sur thèmes assignés
  - Message unifié : "Gérer les thèmes"
- ✅ `MemoriesPage.jsx` v7.0 :
  - Barre filtres thèmes (toggle TopBar 🏷️)
  - Calcul `themeStats` avec `useMemo`
  - Bouton 🏷️ sur MomentHeader
  - Badge thèmes au niveau sous-titre (pastille numérotée)
- ✅ `UnifiedTopBar.jsx` v2.5 :
  - Bouton toggle thèmes avec compteur
  - Intégration contextuelle Memories
- ✅ `PhotoViewer.jsx` v2.7 :
  - Bouton thèmes avec pastille si >0
  - Icône uniformisée (light si 0, pleine si >0)
- ✅ `App.jsx` v2.3 :
  - State `isThemeBarVisible`
  - Props passées à composants

**Propagation intelligente :**

- Moment → Articles + Photos articles + Photos moment (options)
- Post → Photos de l'article (option)
- Photo → Direct (pas d'options)

**Différences avec plan original :**

| Aspect           | Prévu                   | Réalisé                       | Impact                                    |
| ---------------- | ----------------------- | ----------------------------- | ----------------------------------------- |
| Architecture     | Thèmes dans masterIndex | ThemeAssignments séparé       | ✅ Meilleur (performance + maintenabilité) |
| Propagation      | Héritage auto simple    | Options dans modal            | ✅ Meilleur (contrôle granulaire)          |
| Sélection photos | Longpress bulk          | Pas implémenté                | ⚠️ À ajouter Phase 16b si besoin          |
| Badge placement  | Partout                 | Stratégique (header + viewer) | ✅ Meilleur (interface épurée)             |

**Décisions architecturales clés :**

1. **ThemeAssignments séparé** (vs intégré masterIndex)
   - Raison : Pas de régénération masterIndex à chaque tag
   - Avantage : Performance Map-based vs array search
2. **Modal React suppression** (vs confirm navigateur)
   - Raison : confirm() peut être bloqué par paramètres navigateur
   - Avantage : UX cohérente garantie
3. **Pas de sélection multiple photos** (report Phase 16b)
   - Raison : Complexité vs usage réel
   - Workaround : Tag par moment avec propagation

**Impact utilisateur :**

- ✅ Création thème : 30 secondes
- ✅ Tag moment : 10 secondes (avec propagation)
- ✅ Filtrage : 1 clic
- ⚠️ Tag 100 photos individuellement : Pénible (→ Phase 16b)

---

## ✨ Phase 17 : Navigation Chat ↔ Memories avec attachements photos

**Date :** 19-20 octobre 2025  
**Version :** 2.5

### Objectifs globaux

Transformer la relation entre ChatPage et MemoriesPage d'une navigation simple en un **workflow bidirectionnel contextuel** permettant :

- Navigation fluide avec préservation du contexte
- Attachement de photos depuis Memories vers Chat
- Auto-ouverture du moment correspondant à la session

---

### Phase 17a : Navigation bidirectionnelle

**Date :** 19 octobre 2025

#### Réalisations

**Architecture navigationContext :**

javascript

```javascript
navigationContext: {
  previousPage: 'chat',        // Page source
  pendingAttachment: null,     // Photo à attacher
  sessionMomentId: null        // ID du moment du chat
}
```

**Composants modifiés :**

| Fichier             | Version | Changements clés                                                                     |
| ------------------- | ------- | ------------------------------------------------------------------------------------ |
| `App.jsx`           | v2.4    | État `navigationContext`, handlers `handleNavigateWithContext`, `handleNavigateBack` |
| `UnifiedTopBar.jsx` | v2.6    | Bouton "✨ Souvenirs" dans ChatPage, bouton "← Retour" adaptatif dans MemoriesPage    |
| `MemoriesPage.jsx`  | v6.5    | Props `navigationContext`, `onNavigateBack`, mode "depuis chat"                      |

**Flux utilisateur :**

```
ChatPage
  ↓ Clic "✨ Souvenirs" (TopBar)
MemoriesPage (mode fromChat)
  - Badge "← Retour au chat"
  - Contexte préservé
  ↓ Clic retour
ChatPage (retour sans perte de contexte)
```

**Impact UX :**

- ✅ Navigation contextuelle (utilisateur sait d'où il vient)
- ✅ Bouton retour intelligent
- ✅ Préservation de l'état de navigation

---

### Phase 17b : Attachement photo depuis Memories

**Date :** 19 octobre 2025

#### Réalisations

**Menu contextuel photo :**

- Longpress sur photo depuis ChatMode → Menu 3 options
- Options : "Voir en grand" | "Thèmes" | "📎 Envoyer au chat"

**Composants modifiés :**

| Fichier            | Version | Changements clés                                                      |
| ------------------ | ------- | --------------------------------------------------------------------- |
| `ChatPage.jsx`     | v2.4    | Détection `pendingAttachment`, preview photo, envoi avec photoData    |
| `MemoriesPage.jsx` | v6.5    | Menu contextuel `PhotoContextMenu`, handler `handleAttachPhotoToChat` |
| `dataManager.js`   | v3.5    | Support `photoData` dans messages utilisateur                         |

**Structure message avec photo :**

javascript

```javascript
{
  id: "msg_123",
  author: "lambert",
  content: "Regarde cette photo !",
  photoData: {
    filename: "IMG20221022.jpg",
    google_drive_id: "1abc...",
    width: 3468,
    height: 4624,
    mime_type: "image/jpeg"
  }
}
```

**Flux utilisateur :**

```
ChatPage → Souvenirs
  ↓ Longpress photo
Menu contextuel
  ↓ "📎 Envoyer au chat"
Retour ChatPage avec photo attachée
  - Preview grande taille
  - Input avec photo + texte optionnel
  ↓ Send
Message avec photo dans conversation
```

**Composants créés :**

- `PhotoContextMenu` : Menu 3 options positionné au touch
- `PhotoPreview` : Preview haute résolution dans input
- `PhotoMessage` : Affichage photo dans bulle message

**Impact UX :**

- ✅ Workflow naturel photo → chat
- ✅ Preview avant envoi
- ✅ Message texte + photo combinés

---

### Phase 17c : Auto-ouverture moment du chat

**Date :** 20 octobre 2025

#### Réalisations

**Détection automatique :**

- Navigation Chat → Memories (TopBar OU BottomNav) → Auto-scroll vers moment de la session
- Fonctionne quel que soit le point d'entrée (bouton "Souvenirs" ou "Explorer")

**Composants modifiés :**

| Fichier             | Version | Changements clés                                                                             |
| ------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `App.jsx`           | v2.4    | Handler `handlePageChange` avec détection auto Chat→Memories, transmission `sessionMomentId` |
| `UnifiedTopBar.jsx` | v2.7    | Transmission `gameId` dans contexte lors du clic "✨ Souvenirs"                               |
| `MemoriesPage.jsx`  | v6.5    | useEffect auto-ouverture + scroll basé sur `navigationContext.sessionMomentId`               |

**Logique d'auto-ouverture :**

javascript

```javascript
// Dans App.jsx - Détection automatique
const handlePageChange = (newPage) => {
  if (newPage === 'memories' && 
      app.currentPage === 'chat' && 
      app.currentChatSession?.gameId) {
    setNavigationContext({
      previousPage: 'chat',
      sessionMomentId: app.currentChatSession.gameId  // Auto !
    });
  }
};

// Dans MemoriesPage.jsx - Auto-ouverture
useEffect(() => {
  if (navigationContext?.sessionMomentId && momentsData.length > 0) {
    const targetMoment = momentsData.find(m => m.id === navigationContext.sessionMomentId);
    if (targetMoment) {
      setSelectedMoments([targetMoment]);  // Ouvrir
      setTimeout(() => executeScrollToElement(...), 300);  // Scroller
    }
  }
}, [navigationContext?.sessionMomentId]);
```

**Flux utilisateur :**

```
ChatPage (Session sur moment_8_8_5)
  ↓ Clic "Souvenirs" (BottomNav) OU "✨ Explorer" (TopBar)
MemoriesPage
  → Moment moment_8_8_5 s'ouvre automatiquement
  → Scroll automatique vers ce moment
  → Utilisateur arrive exactement où il doit être
```

**Impact UX :**

- ✅ Zéro clic supplémentaire pour l'utilisateur
- ✅ Cohérence contextuelle maximale
- ✅ Navigation intelligente







## 🚀 Roadmap : Prochaines phases

### Phase 18 :

Faire un point général  sur le fonctionnement de l'appli et penser eventuellemnt une refonte de la navigation, l'organisation des données internes,   



### idée en vrac

Ce qu'il faut prioriser , c'est :

1) l'ammélioration de la communication/.navigation entre Page Chat et Page Memoire. Cela doit être très fluide et évident.

2) le developpement de la page Chat : je souhaite u'on puisse intégrer une visioneuse de lien youtube et importer des fichiers externes (non prioritaire pour le moment car cela fera un group developpemnt pour une v 3.0 je suppose)

=> Améliorer le  workfloaw

je suis dnas la page Chat et je veux chercher une information, une photo à insérer, un lien vers un souvenir (moment, post, ou photo).

Je vais donc vers la page chat (à trouver : le moyen le plus évident pour y aller car le bouton en top bar n'est ni très visible, ni très accessible); je peux naviguer facilement et récupérer un élément que j'incorpore sous forme de lien (moment, post, photoDuMoments) ou sous forme de photo (dejà implémenté).

Le lien aurait par roll-over un preview; un clic dessus nous emmenerait vers l'élement de la page memoire.

Toujours possibilité de retour au Chat par bouton "retour" (ou autre : bouton chat en bottom bar ?)

=====

* Pages session / Statut session :: lu /Non lus par user On pourra faire apparaître en tête de session, les messages non lus (un peu comme si on ouvrait son logiciel de messagerie) Et c’est le nb de session non lues qui doit apparaître en pastille sur l’icône session de la bottom bar 

* Système de lien :  Un chat est associé à des moments, tag, post, photo Cela se fait automatiquement à la création de session, mais cela doit aussi se faire et à l’insert de liens ou fichiers internes (photo) Mais on doit pouvoir associer aussi manuellement (notamment en ajoutant des tags). Ainsi Dans memoire, quand on est sur un moment, post ou photo qui est dans un chat, le compteur "bulle de message" indique le nombre de chat où cet élément apparait.

On doit pouvoir circuler librement et référencer les élément type photo

* Session archivé  devient un souvenir Un chat peut devenir un souvenir quand il est archivé Ajouter une option filtre d’affichage des Chat

---

### Phase 19 : Page Jeux de remémoration 🎮

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

| Fichier                | Version | État     | Notes                   |
| ---------------------- | ------- | -------- | ----------------------- |
| App.jsx                | v2.3    | ✅ Stable | TopBar fixe + thèmes    |
| UnifiedTopBar.jsx      | v2.5    | ✅ Stable | Toggle thèmes           |
| MemoriesPage.jsx       | v7.0    | ✅ Stable | Barre filtres thèmes    |
| SessionsPage.jsx       | v6.2    | ✅ Stable | Groupes + notifications |
| ChatPage.jsx           | v2.1    | ✅ Stable | PhotoMessage            |
| PhotoViewer.jsx        | v2.7    | ✅ Stable | Thèmes + pastilles      |
| SettingsPage.jsx       | v4.2    | ✅ Stable | CRUD thèmes + modal     |
| ThemeModal.jsx         | v1.0    | ✅ Stable | Modal réutilisable      |
| dataManager.js         | v3.6    | ✅ Stable | Auto markAsRead         |
| NotificationManager.js | v1.0    | ✅ Stable | Système notifications   |
| ThemeAssignments.js    | v1.0    | ✅ Stable | Manager thèmes          |
| themeUtils.js          | v1.0    | ✅ Stable | Utilitaires thèmes      |
| sessionUtils.js        | v2.0    | ✅ Stable | NOTIFIED priorité 1     |
| PhotoDataV2.js         | v3.6    | ✅ Stable | Mobile optimized        |

### Points d'amélioration identifiés

**Technique :**

- [ ] Tests unitaires (actuellement 0%)
- [ ] Gestion erreurs réseau Drive
- [ ] Optimisation images (WebP)
- [ ] Service Worker PWA
- [ ] Polling automatique notifications

**UX :**

- [ ] Transitions page (React Router)
- [ ] Animations micro-interactions
- [ ] Mode offline basique
- [ ] Accessibilité (ARIA labels)
- [ ] Sons notification
- [ ] Sélection multiple photos (Phase 16b)

**Fonctionnalités :**

- [ ] Export sessions PDF
- [ ] Recherche full-text avancée
- [ ] Export thématique (PDF par thème)
- [ ] Mode sombre

---

**Version du guide :** 2.4  
**Dernière révision :** Phase 16 complète - Système de thèmes  
**Prochaine phase :** 16b (optionnel) ou 17 (chat avancé)
</artifact>

# ✅ Guide v2.4 créé !

## 📊 Nouveautés documentées

### Chapitres ajoutés/modifiés :

1. ✅ **Chapitre 9 : Système de thèmes** (NOUVEAU)
   - Architecture complète (3 fichiers)
   - ThemeAssignments.js API
   - Propagation intelligente
   - Clés de contenu
   - Flow d'assignation
   - Badges et indicateurs
2. ✅ **ThemeModal.jsx** (composant documenté)
3. ✅ **MemoriesPage v7.0** (calcul themeStats + barre)
4. ✅ **SettingsPage v4.2** (CRUD + modal)
5. ✅ **Phase 16 complète** (historique détaillé)
6. ✅ **Bonnes pratiques thèmes** (section 5)

### Différences avec plan documentées :

- ✅ Architecture séparée (meilleure)
- ✅ Options propagation (meilleures)
- ⚠️ Sélection multiple manquante (Phase 16b)
- ✅ Modal React (mieux que confirm)
