# Guide de développement - Mémoire du Mékong v2.1

**Dernière mise à jour : Phase 13B complète - Messages riches + TopBar unifiée + Photos Mastodon**

---

## 📋 Table des matières





1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-g%C3%A9n%C3%A9rale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Flux de données](#flux-de-donn%C3%A9es)
6. [Messages et sessions](#messages-et-sessions)
7. [Gestion des photos](#gestion-des-photos)
8. [Interface utilisateur](#interface-utilisateur)
9. [Bonnes pratiques](#bonnes-pratiques)
10. [Méthodologie de travail](#m%C3%A9thodologie-de-travail)
11. [Troubleshooting](#troubleshooting)
12. [Prochaines étapes](#prochaines-%C3%A9tapes)

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

## Architecture générale

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

---

## Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # Point d'entrée (v2.2)
│   ├── UnifiedTopBar.jsx          # ✅ Barre contextuelle (v1.2)
│   ├── Navigation.jsx             # BottomNavigation (v4.1)
│   ├── PhotoViewer.jsx
│   ├── SessionCreationModal.jsx
│   ├── TimelineRule.jsx
│   └── pages/
│       ├── MemoriesPage.jsx       # (v6.0 - forwardRef)
│       ├── SessionsPage.jsx       # (v4.0)
│       ├── ChatPage.jsx           # (v2.1 - PhotoMessage)
│       ├── SettingsPage.jsx       # (v3.2 - sections)
│       └── UserSelectionPage.jsx
├── core/
│   ├── dataManager.js             # ✅ v3.5 - Photos utilisateur
│   ├── ConnectionManager.js
│   ├── DriveSync.js              # ✅ Pagination (pageSize: 1000)
│   ├── StateManager.js
│   ├── UserManager.js            # ✅ v2.0 - Avatars
│   ├── PhotoDataManagerV2.js
│   └── MasterIndexGenerator.js   # ✅ v4.1 - Mastodon flat
├── hooks/
│   └── useAppState.js            # ✅ regenerateMasterIndex
└── main.jsx
```

### État déployé

- **CloudFlare Pages** : [https://mekongtandememoire.pages.dev/](https://mekongtandememoire.pages.dev/)
- **Compte** : [mekongtandem@gmail.com](mailto:mekongtandem@gmail.com)
- **Repository** : mekongtandem-crypto (GitHub)

---

## Composants principaux

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

### 2. UnifiedTopBar.jsx (v1.2)

**Structure :** `[Action] [Contexte] [...] [Avatar]`

| Page     | Gauche               | Centre                | Menu                 |
| -------- | -------------------- | --------------------- | -------------------- |
| Memories | Timeline + Recherche | "Mémoire" + Dé + Jour | Options affichage    |
| Chat     | ← Retour             | Titre session         | Éditer, Supprimer    |
| Sessions | + Nouvelle           | "X sessions"          | Tri, Filtres (grisé) |
| Settings | ⚙️                   | "Réglages"            | Régénérer index      |

**Couleur contexte :** `text-amber-600` (partout)

---

### 3. DataManager.js (v3.5)

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
  // 1. Appelle masterIndexGenerator
  const result = await window.masterIndexGenerator.generateMomentsStructure();
  // 2. Recharge le fichier
  const reloadResult = await this.reloadMasterIndex();
  return reloadResult;
}
```

---

### 4. MasterIndexGenerator.js (v4.1)

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

**Enrichissement posts :**

javascript

```javascript
enrichPostWithPhotoIds(post, mastodonPhotoMapping) {
  const enrichedPhotos = post.photos.map(photo => {
    const filename = this.extractFilenameFromUrl(photo.url);
    const mappingInfo = mastodonPhotoMapping[filename];

    if (mappingInfo) {
      return {
        ...photo,
        google_drive_id: mappingInfo.google_drive_id,
        filename: mappingInfo.filename
      };
    }
    return photo;
  });

  return { ...post, photos: enrichedPhotos };
}
```

---

### 5. SettingsPage.jsx (v3.2)

**Sections dépliables :**

- Utilisateur actif
- Connexion (email + bouton)
- Avatar personnalisable
- Statistiques
- Données (régénération)

**Stats corrigées :**

javascript

```javascript
const stats = {
  moments: app.masterIndex?.metadata?.total_moments || 0,
  posts: app.masterIndex?.metadata?.total_posts || 0,
  photos: app.masterIndex?.metadata?.total_photos || 0,
  sessions: app.sessions?.length || 0
};
```

---

### 6. DriveSync.js

**Pagination obligatoire :**

javascript

```javascript
async listFiles(params) {
  let allFiles = [];
  let pageToken = null;

  do {
    const queryParams = { ...params, pageSize: 1000 };
    if (pageToken) queryParams.pageToken = pageToken;

    const response = await gapi.client.drive.files.list(queryParams);
    allFiles.push(...(response.result.files || []));
    pageToken = response.result.nextPageToken;
  } while (pageToken);

  return allFiles;
}
```

**OU ajouter `pageSize: 1000` dans chaque requête.**

---

## Gestion des photos

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

**2. Normalisation frontend (MemoriesPage) :**

javascript

```javascript
function normalizePhoto(photo) {
  if (photo.google_drive_id) return photo; // Déjà OK

  // Photos post enrichies lors de la génération
  return photo;
}
```

**3. Affichage (PhotoDataManagerV2) :**

javascript

```javascript
async resolveImageUrl(photo, useThumbnail) {
  if (!photo.google_drive_id) {
    return this.generatePlaceholderSVG();
  }
  // Résolution Drive normale
}
```

---

## Messages et sessions

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

---

## Interface utilisateur

### Layout

```
┌─────────────────────────────────┐
│ UnifiedTopBar (48px, fixed)    │
├─────────────────────────────────┤
│ Content (pt-12 pb-16)          │
├─────────────────────────────────┤
│ BottomNavigation (64px, fixed) │
└─────────────────────────────────┘
```

### Responsivité

- **Mobile (< 640px)** : Avatar masqué, "Mémoire" masqué
- **Desktop (≥ 640px)** : Tout visible

### Couleurs

- Utilisateurs : `green-*` (Lambert), `blue-*` (Tom), `amber-*` (Duo)
- Navigation : `amber-600` (active), `amber-500` (inactive)
- États : `green-*` (succès), `red-*` (erreur)

---

## Bonnes pratiques

### 1. Photos Mastodon

**❌ NE PAS** : Créer structure récursive profonde **✅ FAIRE** : Aplatir dans `Mastodon_Photos/` **❌ NE PAS** : Oublier `pageSize: 1000` dans listFiles **✅ FAIRE** : Toujours paginer les requêtes Drive

### 2. Messages

**❌ NE PAS** : `photoData` dans message système **✅ FAIRE** : `photoData` dans message utilisateur **✅ FAIRE** : `app.createSession(gameData, text, sourcePhoto)`

### 3. Stats

**❌ NE PAS** : `app.masterIndex?.metadata?.stats?.postCount` **✅ FAIRE** : `app.masterIndex?.metadata?.total_posts`

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

## Troubleshooting

### Photos posts ne s'affichent pas

**Symptôme** : "Erreur de chargement" dans ChatPage

**Causes possibles :**

1. MasterIndex pas régénéré → Régénérer
2. MasterIndex en mémoire pas à jour → Recharger page (F5)
3. Photos pas dans `Mastodon_Photos/` → Déplacer
4. Pagination manquante → Ajouter `pageSize: 1000`

**Debug :**

javascript

```javascript
// Console
app.masterIndex.moments
  .find(m => m.posts?.some(p => p.photos?.length > 0))
  ?.posts.find(p => p.photos?.length > 0)
  ?.photos[0]
// Doit avoir google_drive_id et filename
```

### Stats à 0 dans SettingsPage

**Cause** : Mauvais chemin (`metadata.stats.X` au lieu de `metadata.total_X`)

**Solution** : Voir section "Stats corrigées" ci-dessus

### Régénération index très lente

**Cause** : Structure Mastodon récursive (6 niveaux)

**Solution** : Aplatir dans `Mastodon_Photos/` (1 requête au lieu de centaines)

### Mapping trouve 0 photos

**Causes :**

1. Dossier mal nommé (`mastodon_photos` ≠ `Mastodon_Photos`)
2. Pas de pagination (`pageSize` manquant)
3. Photos ailleurs que dans `Mastodon_Photos/`

---

## Méthodologie de travail

### Ce qui fonctionne

1. Étapes incrémentales
2. Tests immédiats
3. Documentation synchrone
4. Git commits fréquents
5. Analyse méthodique (logs → hypothèses → tests)

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement

---

## Prochaines étapes

### Phase 13C

- [ ] SessionsPage améliorée (tri, filtres)
  
  Refonte Timeline ()
  
  

### Phase 14 : Dashboard

- [ ] Système nudge
- [ ] Statuts sessions
- [ ] Visualisation moments traités

### Phase 15 : Jeux

- [ ] Mini-jeux mémoire
- [ ] Quiz moments

### Nice to have

- [ ] Thèmes visuels
- [ ] Upload photos externes
- [ ] Messages audio/vidéo
- [ ] Recherche sessions

---

**Version du guide :** 2.0.1 (Phase 13B complète)  
**Dernière révision :** Finalisation Phase 13B - Photos Mastodon + Stats  
**Date :** 4 janvier 2025
