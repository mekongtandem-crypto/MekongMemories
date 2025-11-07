###Medias/

# Guide de développement - Mémoire du Mékong v2.6.5

**Dernière mise à jour : Phase 22 Logger configurable (fourni)
Storage sécurisé (fourni)
**Date : 1 novembre 2025**

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme une application de remémoration autour d'un carnet d'expériences de voyage interactif**L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs.

### ### **Fonctionnalités Clés**

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

L’appli s’articule autour de data  appelés Souvenirs = data brutes s qui sont sauvegardés sur le drive. Elles sont actuellement de 2 type

- post issus de Mastodon : textes et photo associés 

- Photo répartis dans des répertoires (issus d’album de Google photos)

Ces data apriori non modifiables accessible depuis un GoogleDrive sont compilées dans un fichier **MasterIndex** qui introduit la notion de **Moment**

La **page Mémoire=Souvenirs** permet d’accéder a l’ensemble des Souvenirs et d’interagir avec

### ✨Les Moments

Moment : un moment est un contenant regroupant plusieurs souvenirs. 

Un moment représente une unité de temps/lieux.  Par exemple : les post et photo du jour 23 m sont regroupés dans un Moment

Au parsing des données brutes du drive 

### 💬les Sessions

L’appli permet d’avoir des **Causerie=Chat=session** qui sont des dialogues entre plusieurs User autour d’un souvenir.

Chaque Session est sauvegardé dans Drive

Une session est édité dans la page Chat; elle a 4 état/priorités :

1. **NOTIFIED** 🔔 : Notification non répondue
2. **PENDING_YOU** : Dernier msg ≠ currentUser
3. **PENDING_OTHER** : Dernier msg = currentUser
4. **COMPLETED** ✅ : Marquée terminée**

### liens  entre  Sessions-Souvenir

La base de l’utilisation de l’appli est de faire des aller retours entre Chat et Mémoire

La réciprocité des interactions et le fluidité de la navigation sont essentielles

#### 🔗Systemes de liens

Il est possible d’insérer des Souvenirs ( ou plutôt exactement des liens vers souvenirs )(photo, liens vers post, liens vers moments) dans les Chats. Les souvenirs sont alors étiquetés comme "linké"
ContentLinks.js
Dans une session, on a accès à l'ensemblre des liens grâce à un modal (dans le menu de la top bar du Chat) : 
  SessionInfoPanel.jsx

❓SessionListModal.jsx est il toujours utile ?
Sur le drive **content-links.json***; structuration des données  : 
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
    },

#### 🏷️Système de Tag=Thèmes :

Il est possible d’associé des **Thèmes=Tag** a des souvenirs ou des Chats. 
**ThemeAssignments.js** et **ThemeModal.jsx**

Les Tag permettent un autre regroupement transversal des souvenirs (différent de celui que celui des moment attaché a un temps/lieu)

Les liens et thèmes qui sont géré avec consignés LinkedContent.jsx et consignés dans le drive dans 

---

## Navigation et design

La page de l’appli est divisée en 3 :

- top bar (gérée dans **UnifiedTopBar.jsx**)

- Page centrale

- Bottom/Nav bar 

### les pages de l’appli

Une page par 

- **startup** : démarrage avec en fonction des cas : connection + chargement + sélect user; **StartupPage.jsx**

- **SessionPage**: liste des discussions en cours regroupés en volets en fonctions de leur statut.;  **SessionsPage.jsx**

La **page Session** permet d’avoir une vue d’ensemble des sessions et de leur état, d’accéder aux différentes sessions et d’interagir avec.

Les notifications sont sauvegardées dans un fichier notifications.json sur le drive ; avec la strucutre suivante
{
  "version": "1.0",
  "notifications": [
    {
      "id": "notif_1759702578503",
      "from": "lambert",
      "to": "tom",
      "sessionId": "sid_1759702403854",
      "sessionTitle": "Session de test",
      "timestamp": "2025-10-05T22:16:18.503Z",
      "read": true
    },

- **Souvenirs=Memoire** : liste des souvenirs. (**MemoriesPage.jsx**)

Regroupés en « poupées russes " sur 3 niveaux " :
**Hiérarchie des niveaux**

```
Moment (🗺️)
├── Posts (📄)
│   └── Photos des posts (📸)
└── Photos du moment (📸)
```

- **Chat**: discussions : sous forme de dialogue d’appli de messagerie (Signal)

accessible depuis session et souvenir; **ChatPage.jsx**

Exemple de ficher de sauvegarde de session  : session_sid_1761869186269.json
javascript

```javascript
{
  "id": "sid_1761869186269",
  "momentId": "1zMtiV8h8QuprCCaCPaKQCizkANb1EIJH",
  "originContent": {
    "type": "photo",
    "id": "1zMtiV8h8QuprCCaCPaKQCizkANb1EIJH",
    "title": "IMG_1795.HEIC",
    "filename": "IMG_1795.HEIC",
    "isMastodonPhoto": false
  },
  "themeIds": [],
  "gameId": "1zMtiV8h8QuprCCaCPaKQCizkANb1EIJH",
  "gameTitle": "_test Photo",
  "subtitle": "Conversation sur _test Photo",
  "createdAt": "2025-10-31T00:06:26.269Z",
  "user": "lambert",
  "notes": [
    {
      "id": "msg_1761869186269",
      "author": "lambert",
      "content": "",
      "timestamp": "2025-10-31T00:06:26.269Z",
      "edited": false,
      "photoData": {
        "filename": "IMG_1795.HEIC",
        "google_drive_id": "1zMtiV8h8QuprCCaCPaKQCizkANb1EIJH",
        "width": 4032,
        "height": 3024,
        "mime_type": "image/heif",
        "isMastodonPhoto": false
      }
    },
    {
      "id": "msg_1761872812473",
      "author": "lambert",
      "content": "",
      "timestamp": "2025-10-31T01:06:52.473Z",
      "edited": false,
      "linkedContent": {
        "type": "moment",
        "id": "moment_2_2_2",
        "title": "Chang Maï"
      }
    },
    {
      "id": "msg_1761873242904",
      "author": "lambert",
      "content": "photo de post",
      "timestamp": "2025-10-31T01:14:02.904Z",
      "edited": false,
      "linkedContent": {
        "type": "photo",
        "id": "19bf7df704c40f64.jpg",
        "title": "19bf7df704c40f64.jpg"
      }
    }
  ],
  "status": "active",
  "statusInfo": {
    "status": "active"
  },
  "statusConfig": {
    "label": "Active",
    "icon": "🟢",
    "color": "green",
    "bgClass": "bg-green-100",
    "textClass": "text-green-700",
    "borderClass": "border-green-300",
    "priority": 4
  },
  "completed": true
}
```

- page **Settings** : réglages utilisateurs, statistiques, régénérations, : **SettingsPage.jsx**

- Page **jeux** : selection et édition de jeux re remémorations . A developper ultérieurement

- home : la HomePage est actuellement la page session 

### les barres

Les bar sont contextuelles par rapport aux Pages

- BottomBar : sert pour la navigation

- Top bar pour les actions et filtre d’affichage et ordonancent

---

## Principe de UX design

- intuitive et sobre : minimum essentiel d’informtion visible affiché sans explication textuelles

- simple et fluide : navigation fluide et rapine en un toucher pour l’essentiel. Tout doit être accessible en 3 clic max pour atteindre un éléments 

- Hiérarchique : l’essentiel accessible en un clic. Mais pour ceux qui veulent aller plus loin ou plus précisément, 2 niveaux de profondeur géré avec des sytèmes de ****volets*** (ouverture/fermeture) et **modals** nécessaire

- Responsive : l’appli est utilisée essentiellement en version smartphone (portait) 
  
  Elle doit être utilisable aussi en Desktop et tablette (paysage)

### Utilisation des couleurs

Chaque élément interactif a une couleur et icône associé pour identification rapide et éviter d’avoir recours à du texte explicatif

L’identification se fait par :

- Type d’élément de souvenirs

ex : liens (violet), thème (jaune/ambre), post-text )bleu, message (violet aussi ?)

- statuts  de Session  : notifié/alerte (orange), en attente de réponse (jaune), envoyés (verts), clos (bleu), archivés=souvenirs 

- couleur user définies  : chaque User et chaque Thème a une couleur associé (user définies) 

=> à developper : prévoir une version clair/sombre avec fond qui change et si possible code couleurs qui demeure

### Gestion des couches

Par couche, j'entends couches visuelles/superpositions. Nous avons actuellement 2 niveaux :

1) couche principale

2) modal ( équivalent à menu ou fenêtre) et PhotoViewer

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

## 

#### 

---

## 🧩 Structure Drive

Sur le Drive, 2 dossiers : 

- "Medias" pour les données brutes issues du voyage

- "MemoireDuMekong-Data" : données crées via l'appli

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

## 

---

## 🔧 Méthodologie de travail

1. **Étapes incrémentales** : Petites modifications testables
2. **Tests immédiats** : Vérifier après chaque changement
3. **Documentation synchrone** : Mettre à jour le guide à chaque grande étape achevée
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

### Phase 18 : Navigation Chat ↔ Memories avec attachements photos et liens internes

### Phase 19 : Structure session enrichie

#### **19 A : Fondations données** (prioritaire)

#### **19 B : Thèmes sessions**

#### **19 C : Affichage origine enrichi**

#### **19 D : Compteurs 💬 dans Memories**

#### **19 E :création de ContentLinks est un INDEX DE RECHERCHE INVERSÉ

#### 📊 Schéma du flux

┌─────────────────────────────────────┐
│ USER ACTION │
│ "Créer session depuis photo X" │
└───────────────┬──────────────────────┘
 ↓
┌─────────────────────────────────────┐
│ dataManager.createSession() │
│ 1. Créer session.json │
│ 2. ⭐ contentLinks.addLink() │
└───────────────┬─────────────────────┘
 ↓
 ┌───────┴────────┐
 ↓ ↓
┌──────────────┐ ┌──────────────────┐
│ session.json │ │ content-links.json│
│ (SOURCE) │ │ (INDEX CACHE) │
└──────────────┘ └──────────────────┘
 ↑ ↓
 │ ┌──────────────────────┐
 │ │ getSessionsForContent│
 │ │ O(1) lookup rapide │
 │ └──────────────────────┘
 │ ↓
 │ ┌──────────────────────┐
 └─────│ Pastilles 💬 affichées│
 │ avec compteurs corrects│
 └──────────────────────┘



Phase 21 : Revision de la page Startup

Phase 22 : Logger configurable + Storage sécurisé 

---

**Version du guide :** 2.6.4  
**Dernière révision :** Phase 20


---

## 

---

## 