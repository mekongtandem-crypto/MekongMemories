# Guide de développement - Mémoire du Mékong v2.3

**Dernière mise à jour : Phase 15 complète - Système de notifications**  
**Date : 6 janvier 2025**

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
9. [Interface utilisateur](#interface-utilisateur)
10. [Bonnes pratiques](#bonnes-pratiques)
11. [Méthodologie de travail](#m%C3%A9thodologie-de-travail)
12. [Phases complétées](#phases-compl%C3%A9t%C3%A9es)
13. [Roadmap : Prochaines phases](#roadmap-prochaines-phases)

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

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée (v2.2)
│   ├── UnifiedTopBar.jsx          # ✅ Barre contextuelle (v1.7)
│   ├── Navigation.jsx             # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx            # (v2.6)
│   ├── SessionCreationModal.jsx   # (v1.1)
│   ├── SessionCreationSpinner.jsx
│   ├── StatsModal.jsx
│   ├── TimelineRule.jsx           # (v3.1)
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ (v6.2 - filtres + icônes)
│       ├── SessionsPage.jsx       # ✅ (v6.2 - groupes + notifications)
│       ├── ChatPage.jsx           # (v2.1 - PhotoMessage)
│       ├── SettingsPage.jsx       # (v3.2 - sections)
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
│   └── NotificationManager.js     # ✅ v1.0 - NOUVEAU (Phase 15)
├── hooks/
│   └── useAppState.js             # ✅ + sendNotification, getUnreadCount
├── utils/
│   └── sessionUtils.js            # ✅ v2.0 - SESSION_STATUS.NOTIFIED
└── main.jsx                       # ✅ + NotificationManager injection
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

### 2. UnifiedTopBar.jsx (v1.7)

**Structure :** `[Action] [Contexte central] [...] [Avatar coloré]`

| Page     | Gauche               | Centre                               | Avatar           |
| -------- | -------------------- | ------------------------------------ | ---------------- |
| Memories | Timeline + Recherche | Dé + J15 + Options + Filtre dropdown | Menu utilisateur |
| Chat     | ← Retour             | Titre session + 🔔 Notifier          | Menu utilisateur |
| Sessions | + Nouvelle           | X Sessions · 🔔 Y · 🟡 Z · 🔵 W      | Menu utilisateur |
| Settings | ⚙️                   | "Réglages"                           | Menu utilisateur |

**Nouveautés Phase 15 :**

**TopBar Sessions :**

```
[12 Sessions] · 🔔 2 · 🟡 5 · 🔵 3 · [Tri ▼]
      ↑          ↑      ↑      ↑
   total    notifiées yours theirs
```

**TopBar Chat :**

- Bouton "🔔 Notifier" (remplace menu notifications global)
- États : gris (pas envoyé) / orange (déjà notifié)
- Confirmation après envoi

**Avatar coloré :**

- 3 utilisateur : Lambert, Tom, Duo (Lambert 🚴)
- Menu déroulant : changement utilisateur direct
- choix de l'avatar et couleur dans settings

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

### 4. SessionsPage.jsx (v6.2)

**Architecture Phase 15 :** Liste groupée automatique par statut avec notifications

**4 groupes auto (ordre d'affichage) :**

1. 🔔 **NOTIFIÉES** (notifications non répondues) - ouvert par défaut
2. 🟡 **À TRAITER** (en attente utilisateur actif) - ouvert par défaut
3. 🔵 **EN ATTENTE** (attente autres utilisateurs) - fermé par défaut
4. ✅ **TERMINÉES** (sessions completed) - fermé par défaut

**En-têtes compacts :**

```
[🔔 2] Notifications non répondues
  ↑
Badge style TopBar
```

**Features :**

- Sections repliables : État mémorisé dans localStorage
- Badge 🔔 sur cards notifiées (coin supérieur gauche)
- Cadres colorés selon statut (border-orange-300, border-amber-300, etc.)
- Menu "..." avec z-index:100 (ne se fait plus couper)

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

### 5. DataManager.js (v3.6)

**Changements Phase 15 :**

**Auto markAsRead :**

javascript

```javascript
openChatSession = (session) => {
  this.updateState({ currentChatSession: session, currentPage: 'chat' });

  // ✅ Marquer notification comme lue à l'ouverture
  const notif = this.notificationManager.getNotificationForSession(
    session.id, 
    this.appState.currentUser.id
  );
  if (notif) {
    this.notificationManager.markAsRead(notif.id);
  }
}

addMessageToSession = async (sessionId, messageContent) => {
  // ... ajout message ...

  // ✅ Marquer notification comme lue après réponse
  const notif = this.notificationManager.getNotificationForSession(
    sessionId, 
    this.appState.currentUser.id
  );
  if (notif) {
    await this.notificationManager.markAsRead(notif.id);
  }
}
```

**Envoi notification :**

javascript

```javascript
sendNotification = async (toUserId, sessionId, sessionTitle) => {
  const result = await this.notificationManager.sendNotification({
    from: this.appState.currentUser.id,
    to: toUserId,
    sessionId,
    sessionTitle
  });
  return result;
}
```

---

### 6. NotificationManager.js (v1.0) - NOUVEAU

**API publique :**

javascript

```javascript
class NotificationManager {
  async init()
  async sendNotification({ from, to, sessionId, sessionTitle })
  getNotifications(userId)
  getUnreadNotifications(userId)
  getUnreadCount(userId)
  async markAsRead(notificationId)
  async markAllAsRead(userId)
  async deleteNotification(notificationId)
  hasUnreadNotificationForSession(sessionId, userId)
  getNotificationForSession(sessionId, userId)
}
```

**Structure fichier Drive :**

json

```json
// MemoireDuMekong-Data/notifications.json
{
  "version": "1.0",
  "notifications": [
    {
      "id": "notif_1234567890",
      "from": "lambert",
      "to": "tom",
      "sessionId": "sid_xxx",
      "sessionTitle": "Bangkok Temple",
      "timestamp": "2025-01-06T10:30:00Z",
      "read": false
    }
  ]
}
```

---

### 7. sessionUtils.js (v2.0)

**Changements Phase 15 :**

javascript

```javascript
export const SESSION_STATUS = {
  NOTIFIED: 'notified',        // ✅ NOUVEAU - Priorité 1
  PENDING_YOU: 'pending_you',  // Priorité 2
  PENDING_OTHER: 'pending_other', // Priorité 3
  ACTIVE: 'active',            // (< 24h, regroupé avec PENDING_OTHER)
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
  // ❌ SUPPRIMÉ : STALE (urgent 7 jours)
};
```

**Logique de calcul :**

javascript

```javascript
export function calculateSessionStatus(session, currentUserId) {
  // États méta (priorité absolue)
  if (session.archived) return SESSION_STATUS.ARCHIVED;
  if (session.completed) return SESSION_STATUS.COMPLETED;

  // ✅ PRIORITÉ 1 : Notification non répondue
  const hasUnreadNotif = window.notificationManager?.hasUnreadNotificationForSession(
    session.id, 
    currentUserId
  );

  if (hasUnreadNotif) {
    return SESSION_STATUS.NOTIFIED;
  }

  // Session vide = active
  if (!session.notes || session.notes.length === 0) {
    return SESSION_STATUS.ACTIVE;
  }

  const lastMessage = session.notes[session.notes.length - 1];
  const daysSinceLastMsg = (Date.now() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60 * 24);

  // ✅ PRIORITÉ 2 : À traiter (dernier msg ≠ currentUser)
  if (lastMessage.author !== currentUserId) {
    return SESSION_STATUS.PENDING_YOU;
  }

  // ✅ PRIORITÉ 3 : En attente (dernier msg = currentUser)
  return daysSinceLastMsg < 1 ? SESSION_STATUS.ACTIVE : SESSION_STATUS.PENDING_OTHER;
}
```

---

## 🎨 Système visuel unifié

### Philosophie (Phase 14.3)

**Couleurs discrètes (cadres/fonds uniquement) + Icônes explicites (concepts)**

### Palette de couleurs

| Usage                   | Couleur   | Classes Tailwind                 | Contexte                          |
| ----------------------- | --------- | -------------------------------- | --------------------------------- |
| **Notifications**       | 🟠 Orange | `bg-orange-50 border-orange-200` | Sessions notifiées (priorité 1)   |
| **Sessions/Chat**       | 🟡 Amber  | `bg-amber-50 border-amber-200`   | Sessions à traiter (priorité 2)   |
| **Moments/Souvenirs**   | 🟣 Purple | `bg-purple-50 border-purple-200` | Exploration, découverte           |
| **Timeline/Navigation** | 🔵 Blue   | `bg-blue-50 border-blue-200`     | Navigation temporelle, en attente |
| **Photos/Galeries**     | 🟢 Green  | `bg-green-50 border-green-200`   | Médias visuels, terminé           |

### Icônes explicites

| Concept       | Icône | Usage                              |
| ------------- | ----- | ---------------------------------- |
| Notifications | 🔔    | Badge priorité 1, bouton notifier  |
| Sessions/Chat | 💬    | Boutons session, compteur messages |
| Moments       | ✨     | Badge moments non explorés         |
| Timeline      | 🗺️   | Bouton timeline                    |
| Recherche     | 🔍    | Bouton search                      |
| Photos        | 📸    | Photos moments                     |
| Articles      | 📄    | Posts Mastodon                     |
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

### Statuts de sessions (Phase 15)

**Table de priorité :**

| Priorité | Statut        | Icône | Condition                  | TopBar       | SessionsPage           |
| -------- | ------------- | ----- | -------------------------- | ------------ | ---------------------- |
| 1        | NOTIFIED      | 🔔    | Notification non répondue  | Badge orange | Groupe "🔔 NOTIFIÉES"  |
| 2        | PENDING_YOU   | 🟡    | Dernier msg ≠ currentUser  | Badge jaune  | Groupe "🟡 À TRAITER"  |
| 3        | PENDING_OTHER | 🔵    | Dernier msg = currentUser  | Badge bleu   | Groupe "🔵 EN ATTENTE" |
| 4        | COMPLETED     | ✅     | session.completed === true | -            | Groupe "✅ TERMINÉES"   |
| -        | ARCHIVED      | 📦    | session.archived === true  | -            | Masqué                 |

**Transitions de statuts :**

```
PENDING_YOU + envoi notification → NOTIFIED
  └─ Notification créée dans Drive

NOTIFIED + ouverture session → NOTIFIED
  └─ Notification reste (pas encore répondue)

NOTIFIED + envoi message → PENDING_OTHER
  └─ Notification marquée read=true

N'importe quel statut + "Marquer terminée" → COMPLETED
```

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
[🗺️ [🔍] [🎲] J15 [📄][🖼️][📸] Filtre ▼ [Avatar]
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

### 5. Déploiement

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
- [ ] Vérifier `currentUser.id` vs `currentUser`

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

### Phase 14.3 : Système visuel unifié

**Date :** 5 janvier 2025

**Réalisations :**

- **Philosophie design clarifiée** : Couleurs discrètes + Icônes explicites
- TopBar MemoriesPage v2.0 :
  - Dropdown filtre (Tous/Non explorés/Avec articles/Avec photos)
  - Options affichage inline [📄] [🖼️] [📸]
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
  - 📄 Articles, 🖼️ Photos posts, 📸 Photos moments

**Impact :**

- UX cohérente avec code couleur global
- Navigation intuitive (1 clic = 1 action)
- Pas de duplication interface
- Communication TopBar ↔ Pages via callbacks

---

### Phase 15 : Système de notifications push 🔔

**Date :** 6 janvier 2025

**Objectif :** Permettre à un utilisateur d'envoyer une notification push à l'autre utilisateur.

**Réalisations :**

**Architecture notifications :**

- `NotificationManager.js` v1.0 : Gestion CRUD notifications
- Stockage : `notifications.json` sur Google Drive
- Structure notification :

json

```json
  {
    "id": "notif_1234567890",
    "from": "lambert",
    "to": "tom",
    "sessionId": "sid_xxx",
    "sessionTitle": "Bangkok Temple",
    "timestamp": "2025-01-06T10:30:00Z",
    "read": false
  }
```

**Système de statuts (4 priorités) :**

| Priorité | Statut        | Icône | Condition                 | TopBar       | SessionsPage           |
| -------- | ------------- | ----- | ------------------------- | ------------ | ---------------------- |
| 1        | NOTIFIED      | 🔔    | Notification non répondue | Badge orange | Groupe "🔔 NOTIFIÉES"  |
| 2        | PENDING_YOU   | 🟡    | Dernier msg ≠ currentUser | Badge jaune  | Groupe "🟡 À TRAITER"  |
| 3        | PENDING_OTHER | 🔵    | Dernier msg = currentUser | Badge bleu   | Groupe "🔵 EN ATTENTE" |
| 4        | COMPLETED     | ✅     | Marqué terminé            | -            | Groupe "✅ TERMINÉES"   |


**Transitions de statuts :**

- PENDING_YOU + envoi notif → NOTIFIED (notification créée)
- NOTIFIED + ouverture session → NOTIFIED (notification reste)
- NOTIFIED + envoi message → PENDING_OTHER (notification marquée lue)
- N'importe quel statut + marqué terminé → COMPLETED

**UI Changes :**

**TopBar Sessions :**

```
[12 Sessions] · 🔔 2 · 🟡 5 · 🔵 3 · [Tri ▼]
      ↑          ↑      ↑      ↑
   total    notifiées yours theirs
```


---

## 🚀 Roadmap : Prochaines phases

### Phase 16 : Ajout de fonctionalités du mode chat 

**Idées :**
- pourvoir naviguer facilement entre chat et souvenir
- ajout de fichiers dans les conversations (d'abord fichiers du drive := photo)
- Mode offline basique
- Badge compteur messages non lus par session

### Phase 17 : Page Jeux de remémoration 🎮

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
| App.jsx                | v2.2    | ✅ Stable | TopBar fixe             |
| UnifiedTopBar.jsx      | v1.7    | ✅ Stable | Notifications + avatar  |
| MemoriesPage.jsx       | v6.2    | ✅ Stable | Filtrage intelligent    |
| SessionsPage.jsx       | v6.2    | ✅ Stable | Groupes + notifications |
| ChatPage.jsx           | v2.1    | ✅ Stable | PhotoMessage            |
| dataManager.js         | v3.6    | ✅ Stable | Auto markAsRead         |
| NotificationManager.js | v1.0    | ✅ Stable | Système notifications   |
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

**Fonctionnalités :**

- [ ] Export sessions PDF
- [ ] Recherche full-text avancée
- [ ] Tags/labels personnalisés
- [ ] Mode sombre

---



---

**Version du guide :** 2.3  
**Dernière révision :** Phase 15 complète  
**Prochaine phase :** 16 - Optimisations UX
