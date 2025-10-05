# Guide de développement - Mémoire du Mékong v2.2

**Dernière mise à jour : Phase 14.3 complète - Système visuel unifié**  
**Date : 5 janvier 2025**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-g%C3%A9n%C3%A9rale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Système visuel unifié](#syst%C3%A8me-visuel-unifi%C3%A9)
6. [Gestion des photos](#gestion-des-photos)
7. [Messages et sessions](#messages-et-sessions)
8. [Interface utilisateur](#interface-utilisateur)
9. [Bonnes pratiques](#bonnes-pratiques)
10. [Méthodologie de travail](#m%C3%A9thodologie-de-travail)
11. [Phases complétées](#phases-compl%C3%A9t%C3%A9es)
12. [Roadmap : Prochaines phases](#roadmap-prochaines-phases)

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
- **⚙️ Synchronisation Automatique :** Connexion Drive au démarrage

---

## 🏗 Architecture générale

### Stack technique

- **React 18** (hooks, refs, forwardRef)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Google Drive API** (stockage)

### Pattern architectural

- **MVVM-like** : DataManager ↔ useAppState ↔ Components
- **Pub/Sub** : Listeners pour synchronisation
- **Repository** : DriveSync pour abstraction stockage
- **Window Callbacks** : Communication TopBar ↔ Pages

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée (v2.2)
│   ├── UnifiedTopBar.jsx          # ✅ Barre contextuelle (v1.6)
│   ├── Navigation.jsx             # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx            # (v2.6)
│   ├── SessionCreationModal.jsx   # (v1.1)
│   ├── SessionCreationSpinner.jsx
│   ├── StatsModal.jsx
│   ├── TimelineRule.jsx           # (v3.1)
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ (v6.2 - filtres + icônes)
│       ├── SessionsPage.jsx       # ✅ (v6.1 - liste groupée)
│       ├── ChatPage.jsx           # (v2.1 - PhotoMessage)
│       ├── SettingsPage.jsx       # (v3.2 - sections)
│       └── UserSelectionPage.jsx
├── core/
│   ├── dataManager.js             # ✅ v3.5 - Photos utilisateur
│   ├── ConnectionManager.js       # v0.9.0 - Token OAuth
│   ├── DriveSync.js               # Pagination (pageSize: 1000)
│   ├── StateManager.js            # v0.7.0
│   ├── UserManager.js             # ✅ v2.1 - getAllUsers
│   ├── PhotoDataV2.js             # v3.6 - Mobile optimized
│   ├── MastodonData.js            # v0.8
│   └── MasterIndexGenerator.js    # ✅ v4.1 - Mastodon flat
├── hooks/
│   └── useAppState.js             # ✅ regenerateMasterIndex
├── utils/
│   └── sessionUtils.js            # Helpers sessions
└── main.jsx
```

### État déployé

- **CloudFlare Pages** : [https://mekongtandememoire.pages.dev/](https://mekongtandememoire.pages.dev/)
- **Compte** : [mekongtandem@gmail.com](mailto:mekongtandem@gmail.com)
- **Repository** : mekongtandem-crypto (GitHub)

---

## 🧩 Composants principaux

### 1. App.jsx (v2.2)

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

### 2. UnifiedTopBar.jsx (v1.6)

**Structure :** `[Action] [Contexte central] [...] [Avatar]`

| Page     | Gauche               | Centre                               | Menu            |
| -------- | -------------------- | ------------------------------------ | --------------- |
| Memories | Timeline + Recherche | Dé + J15 + Options + Filtre dropdown | (aucun)         |
| Chat     | ← Retour             | Titre session                        | Éditer, Suppr.  |
| Sessions | + Nouvelle           | Badges 🔴🟡🔵✨ + Tri dropdown        | Stats           |
| Settings | ⚙️                   | "Réglages"                           | Régénérer index |

**Communication avec pages :**

javascript

```javascript
// TopBar expose via window.XXXPageFilters
window.memoriesPageFilters?.setMomentFilter(value);
window.sessionPageFilters?.setGroupFilter(value);
```

---

### 3. MemoriesPage.jsx (v6.2)

**Nouveautés Phase 14.3 :**

- Filtrage intelligent (Tous/Non explorés/Avec articles/Avec photos)
- Callbacks exposés pour TopBar
- Scroll automatique vers moments filtrés
- Boutons Session avec icône 💬 (amber)

**Callbacks exposés :**

javascript

```javascript
useEffect(() => {
  window.memoriesPageFilters = {
    setMomentFilter: (filter) => {
      setMomentFilter(filter);
      // Scroll vers premier moment filtré
    }
  };
}, []);
```

---

### 4. SessionsPage.jsx (v6.1)

**Architecture :** Liste groupée automatique par statut

**4 groupes auto :**

1. 🔥 **URGENT** (> 7 jours sans réponse)
2. 🟡 **À TRAITER** (en attente utilisateur actif)
3. 🔵 **EN ATTENTE** (attente autres utilisateurs)
4. ✅ **TERMINÉES** (sessions completed)

**Sections repliables :** État mémorisé dans localStorage

**Callbacks exposés :**

javascript

```javascript
window.sessionPageActions = {
  openStatsModal: () => setShowStatsModal(true)
};
window.sessionPageFilters = {
  setGroupFilter: setGroupFilter,
  setSortBy: setSortBy
};
window.sessionPageState = {
  activeFilter: groupFilter
};
```

---

### 5. DataManager.js (v3.5)

**Changement clé :** Photos dans message utilisateur

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

**Nouvelle méthode :**

javascript

```javascript
regenerateMasterIndex = async () => {
  const result = await window.masterIndexGenerator.generateMomentsStructure();
  const reloadResult = await this.reloadMasterIndex();
  return reloadResult;
}
```

---

### 6. MasterIndexGenerator.js (v4.1)

**Architecture photos Mastodon :**

- **Structure Drive :** `Medias/Mastodon/Mastodon_Photos/` (aplatie)
- **Mapping :** Par nom de fichier (1 requête API)

javascript

```javascript
async buildMastodonPhotoMapping() {
  const folderResponse = await this.driveSync.searchFileByName('Mastodon_Photos');
  const allPhotos = await this.driveSync.listFiles({
    q: `'${folderResponse[0].id}' in parents and mimeType contains 'image/'`,
    fields: 'files(id, name)',
    pageSize: 1000  // ✅ Pagination
  });

  const mapping = {};
  for (const photo of allPhotos) {
    mapping[photo.name] = {
      google_drive_id: photo.id,
      filename: photo.name
    };
  }
  return mapping;
}
```

---

## 🎨 Système visuel unifié

### Philosophie (Phase 14.3)

**Couleurs discrètes (cadres/fonds uniquement) + Icônes explicites (concepts)**

### Palette de couleurs

| Usage                   | Couleur   | Classes Tailwind                 | Contexte                             |
| ----------------------- | --------- | -------------------------------- | ------------------------------------ |
| **Sessions/Chat**       | 🟡 Amber  | `bg-amber-50 border-amber-200`   | Tout ce qui touche aux conversations |
| **Moments/Souvenirs**   | 🟣 Purple | `bg-purple-50 border-purple-200` | Exploration, découverte              |
| **Timeline/Navigation** | 🔵 Blue   | `bg-blue-50 border-blue-200`     | Navigation temporelle                |
| **Photos/Galeries**     | 🟢 Green  | `bg-green-50 border-green-200`   | Médias visuels                       |
| **Urgent/Alertes**      | 🔴 Orange | `bg-orange-50 border-orange-200` | Actions prioritaires                 |

### Icônes explicites

| Concept       | Icône | Usage                              |
| ------------- | ----- | ---------------------------------- |
| Sessions/Chat | 💬    | Boutons session, compteur messages |
| Moments       | ✨     | Badge moments non explorés         |
| Timeline      | 🗺️   | Bouton timeline                    |
| Recherche     | 🔍    | Bouton search                      |
| Photos        | 📸    | Photos moments                     |
| Articles      | 📝    | Posts Mastodon                     |
| Random        | 🎲    | Moment aléatoire                   |
| Réglages      | ⚙️    | Settings                           |

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

### Statuts de sessions

**Enrichissement automatique :**

javascript

```javascript
const lastMsg = session.notes?.[session.notes.length - 1];
const isPendingYou = lastMsg && lastMsg.author !== currentUser;
const daysSince = (Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24);
const isUrgent = isPendingYou && daysSince > 7;
```

**États possibles :**

- 🔥 **URGENT** : `isPendingYou && daysSince > 7`
- 🟡 **PENDING_YOU** : `isPendingYou && !isUrgent`
- 🔵 **PENDING_OTHER** : `lastAuthor === currentUser`
- ✅ **COMPLETED** : `session.completed === true`
- 📦 **ARCHIVED** : `session.archived === true`

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
[🗺️] [🔍] [🎲] J15 [📝][🖼️][📸] Filtre ▼
```

**Sessions :**

```
[+] Sessions · 🔴 2 · 🟡 3 · 🔵 1 · ✨ 12 · Tri ▼ [⋮]
```

**Chat :**

```
[←] Titre session [⋮]
```

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

### 4. Déploiement

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

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement

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

**Décisions clés :**

- Grouping automatique > Dashboard manuel
- Badges TopBar > Barre filtres redondante
- Suggestions via modal > Duplication interface

### Phase 14.3 : Système visuel unifié (ACTUELLE)

**Date :** 5 janvier 2025

**Réalisations :**

- **Philosophie design clarifiée** : Couleurs discrètes + Icônes explicites
- TopBar MemoriesPage v2.0 :
  - Dropdown filtre (Tous/Non explorés/Avec articles/Avec photos)
  - Options affichage inline [📝] [🖼️] [📸]
  - Suppression menu "..." (options désormais visibles)
  - Réorganisation : [🗺️][🔍][🎲]J15[Options]Filtre
- Filtrage intelligent moments :
  - 4 filtres via dropdown TopBar
  - Scroll auto vers premier moment filtré
  - Callbacks exposés pour TopBar
- Badge ✨ redirige vers Memories (suppression SuggestionsModal)
- Icônes unifiées :
  - 💬 Sessions (amber hover)
  - ✨ Moments non explorés (violet)
  - 📝 Articles, 🖼️ Photos posts, 📸 Photos moments

**Impact :**

- UX cohérente avec code couleur global
- Navigation intuitive (1 clic = 1 action)
- Pas de duplication interface
- Communication TopBar ↔ Pages via callbacks

---

## 🚀 Roadmap : Prochaines phases

### Phase 15 : Système de notifications/push 🔔

**Priorité :** HAUTE  

**Objectif :** Permettre à un utilisateur d'envoyer une notification push à l'autre utilisateur.



**Architecture proposée :**

javascript

```javascript
// core/NotificationManager.js
class NotificationManager {
  // Créer notification dans Drive
  async sendNotification(fromUser, toUser, sessionId, message)

  // Polling Drive toutes les 30s
  async checkNotifications(currentUser)

  // Afficher notification navigateur
  async showBrowserNotification(notification)

  // Marquer comme lue
  async markAsRead(notificationId)
}
```

**Structure fichier Drive :**

json

```json
// notifications_lambert.json
{
  "notifications": [
    {
      "id": "notif_1234567890",
      "from": "tom",
      "to": "lambert",
      "sessionId": "sid_xxx",
      "message": "Tom a répondu à 'Bangkok Temple'",
      "timestamp": "2025-01-05T10:30:00Z",
      "read": false
    }
  ]
}
```

**UI Changes :**

1. **Badge TopBar** :

```
[Avatar] → [Avatar 🔴3] (si notifications non lues)
```

2. **Menu notifications** :

```
┌─────────────────────────────────────┐
│ Notifications (3)                   │
├─────────────────────────────────────┤
│ 🟡 Tom a répondu                    │
│    "Bangkok Temple" · Il y a 2h     │
├─────────────────────────────────────┤
│ 🟡 Tom a créé une session           │
│    "Angkor Wat" · Hier              │
└─────────────────────────────────────┘
```

3. **Bouton "Notifier" dans ChatPage** :

javascript

```javascript
// Après envoi message
<button onClick={handleNotifyOtherUser}>
  🔔 Notifier Tom
</button>
```

**Tâches détaillées :**

- [ ] **T15.1** : Créer `NotificationManager.js`
- [ ] **T15.2** : Système polling (30s interval)
- [ ] **T15.3** : Badge TopBar avec compteur
- [ ] **T15.4** : Menu déroulant notifications
- [ ] **T15.5** : Bouton "Notifier" ChatPage
- [ ] **T15.6** : Permissions navigateur
- [ ] **T15.7** : Sons notification (optionnel)
- [ ] **T15.8** : Tests cross-user

**Impact sur statuts sessions :**

- Clarification "En attente" → "Notifié"
- Badge 🔔 sur sessions avec notification non lue

---

### Phase 16 : Clarification statuts sessions et réorganisation page Session 🎯

**Priorité :** HAUTE (dépend de Phase 15)  
**Durée estimée :** 2-3 jours

**Objectif :** Améliorer et clarifier les statuts de sessions avec le système de notifications.

**Nouveaux statuts proposés :**

| Statut            | Icône | Condition                    | Action             |
| ----------------- | ----- | ---------------------------- | ------------------ |
| **URGENT**        | 🔥    | > 7j sans réponse + notifié  | Rappel fort        |
| **NOTIFIED**      | 🔔    | Notification envoyée non lue | Attente réponse    |
| **PENDING_YOU**   | 🟡    | Dernier msg = autre user     | À traiter          |
| **PENDING_OTHER** | 🔵    | Dernier msg = current user   | Patience           |
| **ACTIVE**        | ⚡     | Échanges < 24h               | Session chaude     |
| **COMPLETED**     | ✅     | Marquée terminée             | Archivable         |
| **ARCHIVED**      | 📦    | Archivée                     | Masquée par défaut |

**UI Changes :**

1. **SessionsPage - Groupe NOTIFIED** :

```
🔔 NOTIFIÉES (2)
├─ Bangkok Temple · Tom notifié il y a 3h
└─ Marché flottant · Tom notifié hier
```

2. **Badge session dans MemoriesPage** :

```
// Si session existe avec notification
<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
```

3. **Filtre sessions** :

```
Filtre: [Tous] [🔔 Notifiées] [🟡 À traiter] [⚡ Actives]
```

**Actions automatiques :**

javascript

```javascript
// Auto-marquer "notified" après envoi notification
await notificationManager.sendNotification(...)
await sessionManager.updateSessionStatus(sessionId, 'notified')

// Auto-retirer "notified" après lecture
await notificationManager.markAsRead(notificationId)
await sessionManager.updateSessionStatus(sessionId, 'pending_you')
```

**Tâches détaillées :**

- [ ] **T16.1** : Enrichir `sessionUtils.js` avec nouveaux statuts
- [ ] **T16.2** : Ajouter groupe "NOTIFIÉES" dans SessionsPage
- [ ] **T16.3** : Badge notifications sur cards sessions
- [ ] **T16.4** : Filtre "Notifiées" dans TopBar
- [ ] **T16.5** : Auto-update statut après notification
- [ ] **T16.6** : Indicateur "session chaude" (< 24h)
- [ ] **T16.7** : Tests flux complet notification → statut

---

### Phase 17 : Page Jeux de remémoration 🎮

**Priorité :** MOYENNE  

**Objectif :** Réintroduire une page de mini-jeux pour stimuler la mémoire de façon ludique.

*

#### 

---

## 📊 État actuel du code

### Fichiers principaux et versions

| Fichier                 | Version | État     | Notes                   |
| ----------------------- | ------- | -------- | ----------------------- |
| App.jsx                 | v2.2    | ✅ Stable | TopBar fixe             |
| UnifiedTopBar.jsx       | v1.6    | ✅ Stable | Badges + filtres inline |
| MemoriesPage.jsx        | v6.2    | ✅ Stable | Filtrage intelligent    |
| SessionsPage.jsx        | v6.1    | ✅ Stable | Liste groupée           |
| ChatPage.jsx            | v2.1    | ✅ Stable | PhotoMessage            |
| dataManager.js          | v3.5    | ✅ Stable | Photo user message      |
| MasterIndexGenerator.js | v4.1    | ✅ Stable | Mastodon flat           |
| PhotoDataV2.js          | v3.6    | ✅ Stable | Mobile optimized        |

### Fichiers supprimés (obsolètes)

- ❌ `SessionsDashboard.jsx` (remplacé par liste groupée)
- ❌ `SuggestionsModal.jsx` (redirigé vers Memories)
- ❌ `CompactFilters.jsx` (intégré TopBar)

### Points d'amélioration identifiés

**Technique :**

- [ ] Tests unitaires (actuellement 0%)
- [ ] Gestion erreurs réseau Drive
- [ ] Optimisation images (WebP)
- [ ] Service Worker PWA

**UX :**

- [ ] Transitions page (React Router)
- [ ] Animations micro-interactions
- [ ] Mode offline basique
- [ ] Accessibilité (ARIA labels)

**Fonctionnalités :**

- [ ] Export sessions PDF
- [ ] Recherche full-text avancée
- [ ] Tags/labels personnalisés
- [ ] Mode sombre

---

---

## 📝 Changelog récent

### v2.2 (5 janvier 2025) - Phase 14.3 complète

**Added :**

- Système visuel unifié (couleurs + icônes)
- Filtrage intelligent moments (4 modes)
- TopBar enrichie avec options inline
- Badge ✨ redirige vers Memories

**Changed :**

- TopBar Memories réorganisée (Dé + J15 + Options + Filtre)
- Boutons Session avec icône 💬 (au lieu de lucide-react)
- Suppression badge "✨ Nouveau" dans moments

**Removed :**

- SuggestionsModal (redondant)
- Menu "..." dans TopBar Memories
- Séparateurs visuels inutiles

**Fixed :**

- Communication TopBar ↔ Pages via callbacks
- Scroll auto vers moments filtrés
- Mémorisation états sections SessionsPage

---

**Version du guide :** 2.2  
**Dernière révision :** Phase 14.3 complète  
**Prochaine phase :** 15 - Système notifications
