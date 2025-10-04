# Guide de développement - Mémoire du Mékong v2.0

**Dernière mise à jour : Phase 13B - Messages riches + TopBar unifiée**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet]()
2. [Architecture générale](#architecture-g%C3%A9n%C3%A9rale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Flux de données](#flux-de-donn%C3%A9es)
6. [Messages et sessions](#messages-et-sessions)
7. [Interface utilisateur](#interface-utilisateur)
8. [Bonnes pratiques](#bonnes-pratiques)
9. [Méthodologie de travail](#M%C3%thodologie de travail)
10. [Prochaines étapes](Prochaines %C3%tapes)

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme un **carnet d'expériences de voyage interactif**. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs. L'utilisateur navigue à travers des "Moments" significatifs (un festival, la visite d'une ville, une excursion) plutôt que jour par jour.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Toutes les données sources (photos, articles) sont stockées sur **Google Drive**. Les données générées par l'application sont stockées dans un dossier applicatif dédié pour plus de clarté.
- **✨ Navigation par Moments :** Le cœur de l'application est une navigation par "Moments", des unités thématiques qui peuvent couvrir un ou plusieurs jours.
- **⏱️ Timeline Interactive :** Une frise chronologique visuelle permet de naviguer rapidement entre les Moments et les grandes étapes du voyage.
- **📰 Contenu Riche et Contextualisé :** Chaque Moment regroupe des **articles** (issus d'un export Mastodon) et des **galeries de photos**.
- **⚙️ Synchronisation Automatique :** La connexion à Google Drive et le chargement des données sont entièrement automatiques au démarrage.
- **☁️ Cloud-First :** La source de vérité pour les données de l'application (comme l'index) est Google Drive. Le cache local (`localStorage`) sert à accélérer le démarrage.

---

## Architecture générale

### Stack technique

- **React 18** (hooks, refs, forwardRef)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Google Drive API** (stockage)

### Pattern architectural

- **MVVM-like** : DataManager (Model) ↔ useAppState (ViewModel) ↔ Components (View)
- **Pub/Sub** : Listeners pour synchronisation état
- **Repository** : DriveSync pour abstraction stockage

---

## Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée, gestion états globaux
│   ├── UnifiedTopBar.jsx          # ✅ NOUVEAU - Barre contextuelle unifiée
│   ├── Navigation.jsx             # BottomNavigation (toujours visible)
│   ├── PhotoViewer.jsx            # Modal photo plein écran
│   ├── SessionCreationModal.jsx   # Modal création session
│   ├── TimelineRule.jsx           # Timeline horizontale
│   └── pages/
│       ├── MemoriesPage.jsx       # Page souvenirs (avec ref pour fonctions)
│       ├── SessionsPage.jsx       # Liste sessions
│       ├── ChatPage.jsx           # Conversation (sans header local)
│       ├── SettingsPage.jsx       # Réglages (sections dépliables)
│       └── UserSelectionPage.jsx  # Sélection utilisateur initial
├── core/
│   ├── dataManager.js             # ✅ v3.5 - Gestion données + messages photo
│   ├── ConnectionManager.js       # Gestion connexion Google
│   ├── DriveSync.js              # Synchronisation Drive
│   ├── StateManager.js           # Cache localStorage
│   ├── UserManager.js            # ✅ v2.0 - Gestion users + avatars
│   └── PhotoDataManagerV2.js     # Résolution URLs photos
├── hooks/
│   └── useAppState.js            # Hook central état application
└── main.jsx                      # Initialisation app
```

### État actuel de l'application

**Repository GitHub :** [mekongtandem-crypto (lambert-mekong) · GitHub](https://github.com/mekongtandem-crypto/)

**Version déployée :**

- CloudFlare Pages : [https://mekongtandememoire.pages.dev/](https://mekongtandememoire.pages.dev/)
- Compte : [mekongmemoire@gmail.com](mailto:mekongmemoire@gmail.com)
- ~~Netlify (bloqué - dépassement limites gratuites)~~ : [https://zesty-creponne-dcf96e.netlify.app/](https://zesty-creponne-dcf96e.netlify.app/)

---

## Composants principaux

### 1. App.jsx (v2.2)

**Responsabilités :**

- Gestion états partagés (timeline, recherche, jour courant, options affichage)
- Routing entre pages
- Exposition fonctions MemoriesPage via ref
- TopBar et BottomNavigation fixes

**États clés :**

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
const memoriesPageRef = useRef(null); // ✅ Pour jumpToRandomMoment
```

**Structure layout :**

jsx

```jsx
<div className="min-h-screen bg-gray-50 flex flex-col">
  {/* TopBar fixe */}
  <div className="fixed top-0 left-0 right-0 z-40">
    <UnifiedTopBar {...props} />
  </div>

  {/* Contenu avec padding-top:48px */}
  <main className="flex-1 pt-12 pb-16 overflow-auto">
    {renderPage()}
  </main>

  {/* BottomNavigation fixe */}
  <BottomNavigation {...props} />
</div>
```

---

### 2. UnifiedTopBar.jsx (v1.2) ✅ NOUVEAU

**Concept :** Barre contextuelle unique qui s'adapte selon la page active.

**Structure :** `[Action gauche] [Contexte centre] [Menu ...] [Avatar]`

**Adapté par page :**

| Page     | Gauche               | Centre                | Menu                         |
| -------- | -------------------- | --------------------- | ---------------------------- |
| Memories | Timeline + Recherche | "Mémoire" + Dé + Jour | Options affichage            |
| Chat     | ← Retour             | Titre session         | Éditer, Supprimer, Fusionner |
| Sessions | + Nouvelle           | "X sessions"          | Tri, Filtres (grisé)         |
| Settings | ⚙️                   | "Réglages"            | Régénérer index              |

**Props importantes :**

javascript

```javascript
{
  currentPage,
  onPageChange,
  // Props MemoriesPage
  isTimelineVisible, setIsTimelineVisible,
  isSearchOpen, setIsSearchOpen,
  currentDay, setCurrentDay,
  jumpToDay, navigateDay,
  displayOptions, setDisplayOptions,
  jumpToRandomMoment,
  // Props ChatPage
  chatSession,
  onEditChatTitle,
  onCloseChatSession
}
```

**Couleur contexte :** Toujours `text-amber-600` pour cohérence.

**Avatar :** Affiche `app.currentUser.emoji` (pas userManager.getUser()).

---

### 3. DataManager.js (v3.5) ✅ MODIFIÉ

**Changement clé : Messages avec photos**

Avant (v3.4) : Photo dans message système "duo"

javascript

```javascript
systemMessage.photoData = { ... }; // ❌ Mauvais
```

Après (v3.5) : Photo dans message utilisateur

javascript

```javascript
if (sourcePhoto) {
  const userPhotoMessage = {
    id: `msg_${baseTimestamp}`,
    author: this.appState.currentUser,
    content: initialText?.trim() || '',
    photoData: {
      filename: sourcePhoto.filename,
      google_drive_id: sourcePhoto.google_drive_id,
      width: sourcePhoto.width,
      height: sourcePhoto.height,
      mime_type: sourcePhoto.mime_type
    }
  };
  newSession.notes.push(userPhotoMessage);
}
```

**Schéma message :**

javascript

```javascript
{
  id: "msg_xxx",
  author: "lambert|tom|duo",
  content: "texte",
  timestamp: "ISO",
  edited: false,
  photoData: {         // ✅ Optionnel
    filename: "...",
    google_drive_id: "...",
    width: 3468,
    height: 4624,
    mime_type: "image/jpeg"
  }
}
```

---

### 4. MemoriesPage.jsx (v6.0) ✅ MODIFIÉ

**Changement clé : Expose fonctions via ref**

javascript

```javascript
function MemoriesPage({ ... }, ref) {
  // Exposer fonctions pour App.jsx
  React.useImperativeHandle(ref, () => ({
    jumpToRandomMoment: () => { ... },
    jumpToDay: (day) => { ... }
  }), [momentsData, setCurrentDay]);

  // ... reste du composant
}

export default React.forwardRef(MemoriesPage);
```

**Pourquoi ?** UnifiedTopBar appelle `jumpToRandomMoment()` mais n'a pas accès direct aux données de MemoriesPage.

**Flow :**

1. User clique dé dans UnifiedTopBar
2. UnifiedTopBar → `jumpToRandomMoment()`
3. App.jsx → `memoriesPageRef.current.jumpToRandomMoment()`
4. MemoriesPage exécute la fonction

---

### 5. ChatPage.jsx (v2.1) ✅ MODIFIÉ

**Changements :**

- ❌ Suppression header local (géré par UnifiedTopBar)
- ✅ Composant `PhotoMessage` pour afficher photos
- ✅ Modal édition titre (déclenchée par UnifiedTopBar)

**Affichage photo :**

jsx

```jsx
{message.photoData && (
  <PhotoMessage 
    photo={message.photoData}
    onPhotoClick={openPhotoViewer}
  />
)}
{message.content && (
  <div className="text-sm whitespace-pre-wrap">
    {message.content}
  </div>
)}
```

**PhotoMessage :**

- Miniature cliquable (max 200px)
- Résolution via `window.photoDataV2.resolveImageUrl()`
- Clic → PhotoViewer fullscreen

---

### 6. SettingsPage.jsx (v3.2) ✅ MODIFIÉ

**Nouveautés :**

- ✅ Sections dépliables (Utilisateur, Connexion, Avatar, Stats, Données)
- ✅ Section Connexion avec email + bouton Se connecter/déconnecter
- ✅ Changement avatar uniquement pour utilisateur actif

**État sections :**

javascript

```javascript
const [openSections, setOpenSections] = useState({
  user: true,
  connection: false,
  avatar: false,
  stats: false,
  data: false
});
```

**Section Connexion :**

jsx

```jsx
{isOnline ? (
  <>
    <div>Connecté en tant que mekongtandem@gmail.com</div>
    <button onClick={() => app.disconnect()}>
      <LogOut /> Se déconnecter
    </button>
  </>
) : (
  <button onClick={() => app.connect()}>
    <LogIn /> Se connecter
  </button>
)}
```

**Section Avatar :**

- Affiche uniquement l'avatar de `app.currentUser`
- Clic → Grille 48 emojis disponibles
- Sauvegarde via `userManager.updateUserEmoji()`

---

### 7. UserManager.js (v2.0) ✅ MODIFIÉ

**Nouveautés :**

- ✅ Chargement avatars depuis localStorage
- ✅ Méthode `updateUserEmoji()`

javascript

```javascript
constructor() {
  this.users = [
    { 
      id: 'lambert', 
      emoji: localStorage.getItem('mekong_avatar_lambert') || '🚴',
      ...
    },
    // ...
  ];
}

updateUserEmoji(userId, newEmoji) {
  const user = this.users.find(u => u.id === userId);
  if (user) {
    user.emoji = newEmoji;
    localStorage.setItem(`mekong_avatar_${userId}`, newEmoji);
  }
}
```

---

## Flux de données

### 1. Création session depuis photo

```
MemoriesPage (PhotoViewer)
  ↓ handleCreateAndOpenSession(photo, moment, { initialText })
DataManager.createSession(gameData, initialText, sourcePhoto)
  ↓ Si sourcePhoto :
  {
    id: "msg_xxx",
    author: currentUser,
    content: initialText,
    photoData: { filename, google_drive_id, ... }
  }
  ↓ DriveSync.saveFile("session_xxx.json")
  ↓ updateState({ sessions: [...] })
  ↓ notify listeners
useAppState
  ↓ Re-render
ChatPage affiche message avec PhotoMessage
```

### 2. Changement avatar

```
SettingsPage
  ↓ handleChangeAvatar(newEmoji)
UserManager.updateUserEmoji(userId, newEmoji)
  ↓ user.emoji = newEmoji
  ↓ localStorage.setItem('mekong_avatar_xxx', newEmoji)
App.jsx
  ↓ Force re-render : setCurrentUser(null) → setCurrentUser(id)
UnifiedTopBar
  ↓ Affiche nouvel emoji dans avatar
```

### 3. Bouton dé (moment au hasard)

```
UnifiedTopBar
  ↓ onClick dé → jumpToRandomMoment()
App.jsx
  ↓ memoriesPageRef.current.jumpToRandomMoment()
MemoriesPage
  ↓ Via useImperativeHandle :
  ↓ 1. Choisit moment aléatoire
  ↓ 2. handleSelectMoment(randomMoment)
  ↓ 3. setCurrentDay(randomMoment.dayStart)
  ↓ 4. Scroll vers moment
```

---

## Messages et sessions

### Structure session complète

javascript

```javascript
{
  id: "sid_1234567890",
  gameId: "photo_xxx" | "post_xxx" | "moment_xxx",
  gameTitle: "Souvenirs de Doi Suthep",
  subtitle: "Conversation sur...",
  createdAt: "2025-01-15T10:30:00Z",
  user: "lambert",
  notes: [
    {
      id: "msg_1234567890",
      author: "lambert",
      content: "Regarde cette photo !",
      timestamp: "2025-01-15T10:30:00Z",
      edited: false,
      photoData: {                    // ✅ Si session créée depuis photo
        filename: "IMG20221022.jpg",
        google_drive_id: "1abc...",
        width: 3468,
        height: 4624,
        mime_type: "image/jpeg"
      }
    },
    {
      id: "msg_1234567891",
      author: "tom",
      content: "Belle vue !",
      timestamp: "2025-01-15T10:32:00Z",
      edited: false
    }
  ]
}
```

### Types de messages

| Type          | Author | Content         | photoData | Usage                      |
| ------------- | ------ | --------------- | --------- | -------------------------- |
| Texte simple  | user   | "..."           | ❌         | Message normal             |
| Photo + texte | user   | "légende"       | ✅         | Session depuis photo       |
| Système       | duo    | "💬 Session..." | ❌         | Session depuis post/moment |

---

## Interface utilisateur

### Layout global

```
┌─────────────────────────────────────┐
│ UnifiedTopBar (fixed top, z-40)    │ 48px
├─────────────────────────────────────┤
│                                     │
│ Page content (pt-12 pb-16)         │ Flexible
│                                     │
├─────────────────────────────────────┤
│ BottomNavigation (fixed bottom)    │ 64px
└─────────────────────────────────────┘
```

### Responsivité

**Mobile (< 640px) :**

- Avatar masqué dans UnifiedTopBar
- "Mémoire" masqué (seulement dé + jour)
- BottomNavigation visible

**Tablet/Desktop (≥ 640px) :**

- Avatar visible
- Texte "Mémoire" visible
- BottomNavigation visible (toujours)

### Couleurs thème

**Utilisateurs :**

- Lambert : `green-*` (🚴)
- Tom : `blue-*` (👨‍💻)
- Duo : `amber-*` (👥)

**Navigation :**

- Active : `amber-600`
- Inactive : `amber-500`
- Contexte : `amber-600` (toujours)

**États :**

- Succès : `green-*`
- Erreur : `red-*`
- Info : `blue-*`
- Neutre : `gray-*`

---

## Bonnes pratiques

### 1. Création nouveaux composants

javascript

```javascript
/**
 * NomComposant.jsx vX.X - Description
 * ✅ Feature 1
 * ✅ Feature 2
 */
import React, { useState } from 'react';
import { IconName } from 'lucide-react';

export default function NomComposant({ prop1, prop2 }) {
  // États locaux
  const [state, setState] = useState(initial);

  // Handlers
  const handleAction = () => { ... };

  // Render
  return (
    <div className="...">
      {/* Contenu */}
    </div>
  );
}
```

### 2. Gestion état

**Local** : `useState` pour UI (modals, menus) **Global** : `useAppState` pour données (sessions, user) **Persisté** : DataManager → DriveSync → Google Drive

### 3. Navigation

**Changement page :**

javascript

```javascript
app.updateCurrentPage('sessions');
```

**Ouverture chat :**

javascript

```javascript
app.openChatSession(session);
```

**Fermeture chat :**

javascript

```javascript
app.closeChatSession(); // Retourne à 'sessions'
```

### 4. Messages photos

**Toujours passer photo comme 3e paramètre :**

javascript

```javascript
await app.createSession(gameData, initialText, sourcePhoto);
```

**Jamais mettre photoData dans message système.**

### 5. Refs et exposer fonctions

**Si UnifiedTopBar/App.jsx doit appeler fonction dans page :**

javascript

```javascript
// Page
function MyPage({ ... }, ref) {
  useImperativeHandle(ref, () => ({
    myFunction: () => { ... }
  }), [dependencies]);
}
export default React.forwardRef(MyPage);

// App.jsx
const pageRef = useRef(null);
pageRef.current?.myFunction();
```

### 6. Tests manuels checklist

Après chaque modification :

- [ ] TopBar visible et fixe sur toutes pages
- [ ] BottomNavigation visible sur tous écrans
- [ ] Avatar utilisateur correct partout
- [ ] Photos s'affichent dans chat
- [ ] Scroll ne fait pas disparaître TopBar
- [ ] Connexion/déconnexion fonctionne
- [ ] Changement avatar persiste

---

## 🔧 Méthodologie de Travail

### **Ce qui fonctionne bien :**

1. **Étapes incrémentales** : Valider chaque feature avant la suivante
2. **Tests immédiats** : Tester en local avant déploiement
3. **Documentation synchrone** : Mettre à jour le guide après chaque session
4. **Git commits fréquents** : Snapshots réguliers de l'état stable
5. **Analyse méthodique des bugs** : Console logs → État système → Hypothèses → Tests

### **Améliorations process :**

- Toujours tester `localStorage.clear()` après modif de structure de données
- Vérifier les scopes OAuth après tout changement d'API
- Penser "mobile first" dès la conception des interactions
- **NOUVEAU** : Vérifier que le code local est bien déployé avant de débugger
- **NOUVEAU** : Pour les problèmes OAuth, toujours révoquer le token programmatiquement

### **Checklist de déploiement :**

- [ ] Tests locaux réussis
- [ ] `localStorage.clear()` + test à froid
- [ ] Git commit avec message descriptif
- [ ] Push vers repository
- [ ] Attendre build Cloudflare (vérifier statut)
- [ ] Test hard refresh (Ctrl+Shift+R)
- [ ] Test navigation privée
- [ ] Test smartphone

---

## 

---

## 🎯 Prochaines étapes

### Phase 13C

- [ ] Performance Timeline (scroll virtuel si besoin)
- [ ] SessionsPage : Liste améliorée (tri, filtres, recherche)

### **Phase 14 : Dashboard Etat Mémoriel**

- [ ] Système nudge interne (inviter à répondre)
- [ ] Statuts session : actif/en attente de/clos
- [ ] Conception dashboard
  - [ ] Notifications : Activité des autres utilisateurs et sessions en attentes
  - [ ] Visualisation ou filtre moments traités/non traités
  - [ ] Notions de thèmes transversaux/tags

### **Phase 15 : Page Jeux**

- [ ] Conception mini-jeux de mémoire
- [ ] Quiz sur les moments
- [ ] Défis photo

### **Phase 16: Tests & Optimisations**

- [ ] Tests approfondis responsive iPhone/Android
- [ ] Optimisation chargement photos
- [ ] Cache intelligent des images

### **Phase 17 : Export & Livre**

- [ ] ChatPage: fonction "Fusionner messages"
- [ ] Export données structurées (JSON, CSV)
- [ ] Génération PDF/livre de souvenirs
- [ ] Templates de mise en page
- [ ] Impression haute qualité

---

## Nice to have (todo non urgent)

- [ ] Themes visuels de l'appli
- [ ] Upload photos externes dans chat
- [ ] Messages audio/vidéo
- [ ] Recherche dans sessions

---

**Version du guide :** 2.0 (Phase 13B) **Dernière révision :** Session de débogage Phase 13B
