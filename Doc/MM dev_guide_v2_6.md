# Guide de développement - Mémoire du Mékong v2.6

**Dernière mise à jour : Phase 18 - Navigation & Système de liens**  
**Date : 20 octobre 2025**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-générale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Système visuel unifié](#système-visuel-unifié)
6. [Gestion des photos](#gestion-des-photos)
7. [Messages et sessions](#messages-et-sessions)
8. [Système de notifications](#système-de-notifications)
9. [Système de thèmes](#système-de-thèmes)
10. [**Navigation et liens internes** ⭐](#navigation-et-liens-internes)
11. [Interface utilisateur](#interface-utilisateur)
12. [Bonnes pratiques](#bonnes-pratiques)
13. [Méthodologie de travail](#méthodologie-de-travail)
14. [Phases complétées](#phases-complétées)
15. [Roadmap : Phase 18](#roadmap-phase-18)

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme un **carnet d'expériences de voyage interactif**. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs avec un **système conversationnel** permettant de relier et d'enrichir les contenus.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Stockage sur Google Drive
- **✨ Navigation par Moments :** Unités thématiques (1+ jours)
- **⏱️ Timeline Interactive :** Frise chronologique visuelle
- **📰 Contenu Riche :** Articles Mastodon + galeries photos
- **💬 Sessions conversationnelles :** Dialogues autour des souvenirs
- **🔗 Liens internes :** Références entre chats et souvenirs
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
- **Window Callbacks** : Communication TopBar ↔ Pages (⚠️ À refactorer Phase 18e)
- **Notification System** : NotificationManager + polling Drive
- **Theme System** : ThemeAssignments (Map-based) + theme-assignments.json
- **Link System** : ContentLinks (Map bidirectionnelle) + content-links.json ⭐ NEW

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # ✅ v2.5 (Phase 18a - Bottom contextuelle)
│   ├── Navigation.jsx             # ✅ v5.0 (Phase 18a - Bouton dynamique)
│   ├── UnifiedTopBar.jsx          # ✅ v2.8 (Phase 18a - Settings dropdown)
│   ├── PhotoViewer.jsx            # v2.7
│   ├── ThemeModal.jsx             # v1.0
│   ├── SessionCreationModal.jsx   # v1.1
│   ├── LinkedContent.jsx          # ⭐ NEW Phase 18b
│   ├── SessionListModal.jsx       # ⭐ NEW Phase 18c
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ v7.1 (Phase 18b - Mode sélection)
│       ├── SessionsPage.jsx       # ✅ v6.3 (Phase 18d - Nouveaux messages)
│       ├── ChatPage.jsx           # ✅ v2.5 (Phase 18b - Liens + input)
│       └── SettingsPage.jsx       # v4.2
├── core/
│   ├── dataManager.js             # ✅ v3.7 (Phase 18b - Support liens)
│   ├── ContentLinks.js            # ⭐ NEW Phase 18b/c
│   ├── ConnectionManager.js       # v0.9.0
│   ├── DriveSync.js               # Pagination (pageSize: 1000)
│   ├── NotificationManager.js     # v1.0
│   └── ThemeAssignments.js        # v1.0
├── hooks/
│   └── useAppState.js             # ✅ v2.1 (Phase 18b - addLink, getLinkedSessions)
└── utils/
    ├── sessionUtils.js            # v2.0
    ├── themeUtils.js              # v1.0
    └── linkUtils.js               # ⭐ NEW Phase 18b
```

---

## 🧩 Composants principaux

### 1. App.jsx (v2.5) - Phase 18a

**Nouveautés Phase 18a :**

**État `selectionMode` :**
```javascript
const [selectionMode, setSelectionMode] = useState({
  active: false,
  type: null,        // 'link' | 'attach'
  callback: null     // Fonction appelée à la sélection
});
```

**Handler mode sélection :**
```javascript
const handleStartSelection = (type, callback) => {
  setSelectionMode({ active: true, type, callback });
  setCurrentPage('memories');  // Navigation auto vers Memories
};

const handleCancelSelection = () => {
  setSelectionMode({ active: false, type: null, callback: null });
};

const handleContentSelected = (contentData) => {
  if (selectionMode.callback) {
    selectionMode.callback(contentData);
  }
  setSelectionMode({ active: false, type: null, callback: null });
  setCurrentPage('chat');  // Retour auto vers Chat
};
```

---

### 2. Navigation.jsx (v5.0) - Phase 18a ⭐

**Bottom Bar dynamique selon contexte :**

```jsx
function Navigation({ currentPage, onPageChange, isInChat }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex justify-around items-center h-16">
        
        {/* Sessions */}
        <button onClick={() => onPageChange('sessions')}>
          <MessageSquare className={currentPage === 'sessions' ? 'text-amber-600' : 'text-gray-400'} />
          <span>Sessions</span>
        </button>

        {/* Souvenirs */}
        <button onClick={() => onPageChange('memories')}>
          <Sparkles className={currentPage === 'memories' ? 'text-purple-600' : 'text-gray-400'} />
          <span>Souvenirs</span>
        </button>

        {/* Bouton contextuel */}
        {isInChat ? (
          <button onClick={() => onPageChange('sessions')}>
            <ArrowLeft className="text-gray-600" />
            <span>Retour</span>
          </button>
        ) : (
          <button disabled className="opacity-40">
            <Gamepad2 className="text-gray-400" />
            <span>Jeux</span>
          </button>
        )}
        
      </div>
    </nav>
  );
}
```

**Logique dans App.jsx :**
```javascript
<Navigation 
  currentPage={app.currentPage}
  onPageChange={handlePageChange}
  isInChat={app.currentPage === 'chat'}  // ⭐ Détermine bouton contextuel
/>
```

---

### 3. UnifiedTopBar.jsx (v2.8) - Phase 18a ⭐

**Settings dans dropdown Avatar :**

```jsx
{/* Avatar + Menu dropdown */}
<div className="relative">
  <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getUserColor()}`}>
      {getUserInitials()}
    </div>
  </button>

  {isMenuOpen && (
    <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg w-48 z-50">
      
      {/* Changement utilisateur */}
      <div className="p-2 border-b">
        <p className="text-xs text-gray-500 px-2 pb-1">Utilisateur</p>
        {users.map(user => (
          <button 
            key={user.id}
            onClick={() => handleUserChange(user.id)}
            className={`w-full text-left px-3 py-2 rounded ${
              user.id === currentUserId ? 'bg-purple-50' : 'hover:bg-gray-50'
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>

      {/* Menu principal */}
      <div className="p-2">
        <button 
          onClick={handleOpenSettings}
          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded"
        >
          <Settings className="w-4 h-4" />
          <span>Réglages</span>
        </button>
        
        <button 
          onClick={handleOpenStats}
          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistiques</span>
        </button>
      </div>
      
    </div>
  )}
</div>
```

**TopBar Memories en mode sélection :**
```jsx
{selectionMode?.active && (
  <div className="flex items-center space-x-3">
    <Link className="w-5 h-5 text-purple-600" />
    <span className="text-purple-600 font-medium">
      Sélectionner un souvenir
    </span>
    <button 
      onClick={onCancelSelection}
      className="ml-auto p-1.5 hover:bg-gray-100 rounded"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
)}
```

---

## 🔗 Navigation et liens internes

### Architecture (Phase 18b/c)

**3 composants clés :**

1. **ContentLinks.js** : Manager liens bidirectionnels
2. **content-links.json** : Stockage Drive
3. **LinkedContent.jsx** : Composant affichage lien

---

### 1. content-links.json

**Structure :**
```json
{
  "version": "1.0",
  "links": [
    {
      "id": "link_1234567890",
      "sessionId": "session_abc123",
      "messageId": "msg_456789",
      "contentType": "moment",
      "contentId": "moment_8_9",
      "contentTitle": "Jour 8-9 : Chiang Mai",
      "linkedAt": "2025-10-20T14:30:00Z",
      "linkedBy": "lambert"
    },
    {
      "id": "link_1234567891",
      "sessionId": "session_abc123",
      "messageId": "msg_456790",
      "contentType": "post",
      "contentId": "post_12345",
      "contentTitle": "Visite Wat Phra Singh",
      "linkedAt": "2025-10-20T14:32:00Z",
      "linkedBy": "tom"
    },
    {
      "id": "link_1234567892",
      "sessionId": "session_abc123",
      "messageId": "msg_456791",
      "contentType": "photo",
      "contentId": "IMG20221022.jpg",
      "contentTitle": "IMG20221022.jpg",
      "linkedAt": "2025-10-20T14:35:00Z",
      "linkedBy": "lambert"
    }
  ]
}
```

**Types de contenu supportés :**
- `moment` : Moment du voyage
- `post` : Article Mastodon
- `photo` : Photo (moment ou post)

---

### 2. ContentLinks.js (v1.0) ⭐

**Manager de liens** avec index bidirectionnel.

**API publique :**
```javascript
class ContentLinks {
  async init()

  // Création lien
  async addLink({
    sessionId,
    messageId,
    contentType,
    contentId,
    contentTitle,
    linkedBy
  })

  // Lecture
  getLinksForSession(sessionId)
  getLinksForContent(contentType, contentId)
  getSessionsForContent(contentType, contentId)  // Compteur bulles
  getLinkInMessage(messageId)

  // Suppression
  async removeLink(linkId)
  async removeLinksForSession(sessionId)
  async removeLinksForMessage(messageId)

  // Stats
  getLinkStats(sessionId)
  // → { momentCount, postCount, photoCount, totalCount }
}
```

**Architecture interne (Maps pour performance) :**
```javascript
constructor() {
  this.links = new Map();              // linkId → link
  this.sessionIndex = new Map();       // sessionId → Set<linkId>
  this.contentIndex = new Map();       // contentKey → Set<linkId>
  this.messageIndex = new Map();       // messageId → linkId
}
```

**Exemple usage :**
```javascript
// Ajouter lien moment → session
await window.contentLinks.addLink({
  sessionId: 'session_abc',
  messageId: 'msg_123',
  contentType: 'moment',
  contentId: 'moment_8_9',
  contentTitle: 'Jour 8-9 : Chiang Mai',
  linkedBy: 'lambert'
});

// Récupérer sessions liées à un moment
const sessions = window.contentLinks.getSessionsForContent('moment', 'moment_8_9');
// → ['session_abc', 'session_def']

// Compteur pour badge 💬
const count = sessions.length;
```

---

### 3. Structure message avec lien

```javascript
{
  id: "msg_1234567890",
  author: "lambert",
  content: "Regarde ce temple ! ",  // Texte avant lien
  timestamp: "2025-10-20T14:30:00Z",
  linkedContent: {
    type: "moment",           // 'moment' | 'post' | 'photo'
    id: "moment_8_9",
    title: "Jour 8-9 : Chiang Mai",
    linkId: "link_1234567890" // Référence dans content-links.json
  },
  // Optionnel : photoData si message avec photo
  photoData: null
}
```

**Types de messages étendus :**

| Type             | Author | linkedContent | photoData | Usage                   |
|------------------|--------|---------------|-----------|-------------------------|
| Texte seul       | user   | ❌            | ❌        | Message normal          |
| Texte + lien     | user   | ✅            | ❌        | Référence souvenir      |
| Photo + texte    | user   | ❌            | ✅        | Photo existante         |
| Lien photo       | user   | ✅            | ✅        | Lien vers photo souvenir|
| Système          | duo    | ❌            | ❌        | Session post/moment     |

---

### 4. LinkedContent.jsx (v1.0) ⭐

**Composant d'affichage lien cliquable.**

**Props :**
```javascript
{
  linkedContent: {
    type: 'moment' | 'post' | 'photo',
    id: string,
    title: string
  },
  onNavigate: function  // Callback navigation vers Memories
}
```

**Rendu :**
```jsx
<button 
  onClick={handleNavigate}
  onMouseEnter={loadPreview}
  onMouseLeave={hidePreview}
  className="inline-flex items-center space-x-1 bg-purple-50 border border-purple-200 rounded px-2 py-1 hover:bg-purple-100"
>
  {getIcon(type)}  {/* 📍 📄 📸 */}
  <span className="text-purple-700 font-medium underline">
    {title}
  </span>
</button>

{/* Preview hover */}
{showPreview && (
  <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-3 w-64">
    {renderPreview()}
  </div>
)}
```

**Preview selon type :**
- **Moment** : Photo couverture + "X articles • Y photos"
- **Post** : Titre + première phrase (max 2 lignes)
- **Photo** : Thumbnail 200x200px

---

### 5. Flow complet ajout lien

**1. User dans Chat clique [📎 Liens/Photos] :**
```jsx
<div className="flex items-center justify-between border-t border-gray-200 p-2">
  <button 
    onClick={handleOpenLinkPicker}
    className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded"
  >
    <Link className="w-5 h-5" />
    <span>Liens/Photos</span>
  </button>
</div>
```

**2. Navigation vers Memories (mode sélection) :**
```javascript
const handleOpenLinkPicker = () => {
  app.startSelectionMode('link', handleContentSelected);
  // → Navigation automatique vers Memories
};
```

**3. Memories affiche badges de sélection :**
```jsx
{/* Badge sur volet moment */}
{selectionMode?.active && (
  <div className="absolute top-2 right-2">
    <span className="bg-purple-500 text-white rounded-full px-2 py-1 text-xs flex items-center">
      <Link className="w-3 h-3 mr-1" />
      Lier
    </span>
  </div>
)}
```

**4. User fait appui long sur moment/post/photo :**
```javascript
const handleLongPress = (content) => {
  if (!selectionMode?.active) return;
  
  const contentData = {
    type: content.type,        // 'moment' | 'post' | 'photo'
    id: content.id,
    title: content.title || content.filename
  };
  
  app.onContentSelected(contentData);
  // → Retour automatique vers Chat avec contenu sélectionné
};
```

**5. Chat affiche preview avant envoi :**
```jsx
{pendingLink && (
  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {getIcon(pendingLink.type)}
        <span className="font-medium">{pendingLink.title}</span>
      </div>
      <button onClick={clearPendingLink}>
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  </div>
)}
```

**6. Envoi message avec lien :**
```javascript
const handleSendMessage = async () => {
  const messageData = {
    content: inputText,
    linkedContent: pendingLink ? {
      type: pendingLink.type,
      id: pendingLink.id,
      title: pendingLink.title
    } : null
  };
  
  await app.addMessageToSession(sessionId, messageData);
  
  // Créer entrée dans content-links.json
  if (pendingLink) {
    await window.contentLinks.addLink({
      sessionId: sessionId,
      messageId: messageData.id,
      contentType: pendingLink.type,
      contentId: pendingLink.id,
      contentTitle: pendingLink.title,
      linkedBy: app.currentUser.id
    });
  }
  
  setPendingLink(null);
  setInputText('');
};
```

**7. Affichage dans conversation :**
```jsx
{message.linkedContent && (
  <LinkedContent 
    linkedContent={message.linkedContent}
    onNavigate={handleNavigateToContent}
  />
)}
```

---

### 6. Compteurs bulles 💬 (Phase 18c)

**Badge dans MemoriesPage :**

```jsx
const getLinkedSessionsCount = (contentType, contentId) => {
  if (!window.contentLinks) return 0;
  const sessions = window.contentLinks.getSessionsForContent(contentType, contentId);
  return sessions.length;
};

// Dans MomentHeader
const sessionCount = getLinkedSessionsCount('moment', moment.id);

{sessionCount > 0 && (
  <button 
    onClick={() => handleShowLinkedSessions(moment)}
    className="flex items-center space-x-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700"
  >
    <MessageSquare className="w-4 h-4" />
    <span>{sessionCount}</span>
  </button>
)}
```

**Modal liste sessions (SessionListModal.jsx) :**

```jsx
function SessionListModal({ isOpen, onClose, content, sessions }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">
        Sessions liées à "{content.title}"
      </h2>
      
      <div className="space-y-2">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => handleOpenSession(session.id)}
            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-gray-500">
                  {session.notes.length} messages
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
```

---

### 7. Navigation clic sur lien

**Handler dans ChatPage :**
```javascript
const handleNavigateToContent = (linkedContent) => {
  // Préparer contexte navigation
  const navigationContext = {
    previousPage: 'chat',
    sessionId: app.currentChatSession.id,
    targetContent: {
      type: linkedContent.type,
      id: linkedContent.id
    }
  };
  
  // Navigation vers Memories avec contexte
  app.navigateToMemories(navigationContext);
};
```

**Auto-ouverture dans MemoriesPage :**
```javascript
useEffect(() => {
  if (navigationContext?.targetContent) {
    const { type, id } = navigationContext.targetContent;
    
    // Trouver et ouvrir le contenu
    if (type === 'moment') {
      const moment = momentsData.find(m => m.id === id);
      if (moment) {
        setSelectedMoments([moment]);
        scrollToElement(moment.id);
      }
    } else if (type === 'post') {
      // Trouver moment contenant le post
      const moment = momentsData.find(m => 
        m.posts?.some(p => p.id === id)
      );
      if (moment) {
        setSelectedMoments([moment]);
        scrollToElement(`post-${id}`);
      }
    } else if (type === 'photo') {
      // Ouvrir PhotoViewer directement
      const photo = findPhotoById(id);
      if (photo) {
        openPhotoViewer(photo);
      }
    }
  }
}, [navigationContext?.targetContent]);
```

---

## 📊 Sessions → Souvenirs conversationnels (Phase 18d)

### Conversion session archivée

**Bouton dans SessionsPage :**
```jsx
{session.archived && (
  <button
    onClick={() => handleConvertToMemory(session)}
    className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
  >
    <Sparkles className="w-4 h-4" />
    <span>Convertir en souvenir</span>
  </button>
)}
```

**Fonction conversion :**
```javascript
const handleConvertToMemory = async (session) => {
  // Créer snapshot de la session
  const conversationMemory = {
    type: "conversation",
    id: `conv_${session.id}`,
    title: session.title,
    date: session.createdAt,
    archived: true,
    messageCount: session.notes.length,
    messages: session.notes.map(msg => ({
      author: msg.author,
      content: msg.content,
      timestamp: msg.timestamp,
      photoData: msg.photoData,
      linkedContent: msg.linkedContent
    })),
    participants: [session.user1, session.user2],
    linkedContents: extractLinkedContents(session),
    themes: [] // Possibilité de taguer avec thèmes
  };
  
  // Ajouter dans masterIndex
  await app.addConversationMemory(conversationMemory);
  
  // Marquer session comme convertie
  session.convertedToMemory = true;
  await app.updateSession(session);
};
```

### Affichage dans MemoriesPage

**Filtre étendu :**
```jsx
<select value={momentFilter} onChange={e => setMomentFilter(e.target.value)}>
  <option value="all">Tous</option>
  <option value="text">Texte (articles)</option>
  <option value="postImages">Images de posts</option>
  <option value="momentPhotos">Photos de moment</option>
  <option value="conversations">💬 Chats/Souvenirs</option>
  <option value="unexplored">Non explorés</option>
</select>
```

**Composant ConversationMemoryCard :**
```jsx
function ConversationMemoryCard({ conversation, onOpen }) {
  return (
    <div className="bg-white border border-amber-200 rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-amber-900">{conversation.title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(conversation.date)}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        {conversation.messageCount} messages • {conversation.participants.join(' & ')}
      </div>
      
      {/* Preview premiers messages */}
      <div className="bg-gray-50 rounded p-2 mb-3 space-y-2">
        {conversation.messages.slice(0, 3).map(msg => (
          <div key={msg.timestamp} className="text-sm">
            <span className="font-medium">{msg.author}:</span> {msg.content.slice(0, 60)}...
          </div>
        ))}
      </div>
      
      {/* Photos échangées */}
      {conversation.messages.some(m => m.photoData) && (
        <div className="flex space-x-2 mb-3">
          {conversation.messages
            .filter(m => m.photoData)
            .slice(0, 4)
            .map((msg, i) => (
              <img 
                key={i}
                src={getPhotoThumbnail(msg.photoData)}
                className="w-16 h-16 object-cover rounded"
              />
            ))}
        </div>
      )}
      
      <button 
        onClick={() => onOpen(conversation)}
        className="w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
      >
        Ouvrir la conversation
      </button>
    </div>
  );
}
```

---

## 💬 Messages lus/nouveaux (Phase 18d - priorité moyenne)

### Section "Nouveaux messages"

**TopBar SessionsPage enrichie :**
```jsx
<div className="flex items-center space-x-4">
  <div className="flex items-center space-x-2">
    <span className="text-gray-600">{totalSessions} Sessions</span>
    
    {newMessagesCount > 0 && (
      <span className="flex items-center space-x-1 text-blue-600">
        <Inbox className="w-4 h-4" />
        <span>{newMessagesCount}</span>
      </span>
    )}
    
    {/* Compteurs existants */}
    {notifiedCount > 0 && <Badge color="orange">{notifiedCount}</Badge>}
    {pendingCount > 0 && <Badge color="amber">{pendingCount}</Badge>}
    {waitingCount > 0 && <Badge color="blue">{waitingCount}</Badge>}
  </div>
</div>
```

**Groupe en haut de page :**
```jsx
{newMessagesSessions.length > 0 && (
  <SessionGroup
    title="📬 NOUVEAUX MESSAGES"
    count={newMessagesSessions.length}
    sessions={newMessagesSessions}
    defaultOpen={true}
    color="blue"
  />
)}
```

**Logique détection nouveaux messages :**
```javascript
const getNewMessagesSessions = () => {
  return app.sessions.filter(session => {
    // Dernier message pas de moi
    const lastMessage = session.notes[session.notes.length - 1];
    if (lastMessage.author === app.currentUser.id) return false;
    
    // Je n'ai pas ouvert depuis ce message
    const lastVisit = session.lastVisitedBy?.[app.currentUser.id];
    if (!lastVisit) return true;
    
    return new Date(lastMessage.timestamp) > new Date(lastVisit);
  });
};
```

**Marquage "visité" à l'ouverture :**
```javascript
const openSession = async (sessionId) => {
  const session = app.sessions.find(s => s.id === sessionId);
  
  // Marquer visite
  session.lastVisitedBy = session.lastVisitedBy || {};
  session.lastVisitedBy[app.currentUser.id] = new Date().toISOString();
  
  await app.updateSession(session);
  
  // Ouvrir chat
  app.openChatSession(sessionId);
};
```

**Différence avec notifications :**
- **Notification** : Action explicite "🔔 Notifier" (priorité haute)
- **Nouveau message** : Détection passive (priorité moyenne)
- Notification → disparaît **seulement si je réponds**
- Nouveau message → disparaît **dès que j'ouvre**

---

## ✅ Bonnes pratiques Phase 18

### 1. Liens internes

**✅ FAIRE** : Toujours créer entrée ContentLinks lors de l'envoi
```javascript
// BON
await app.addMessageToSession(sessionId, messageData);
await window.contentLinks.addLink({...});
```

**❌ NE PAS** : Oublier de nettoyer liens à la suppression
```javascript
// Supprimer message → supprimer lien
await window.contentLinks.removeLinksForMessage(messageId);
```

### 2. Mode sélection

**✅ FAIRE** : Nettoyer état si navigation interrompue
```javascript
useEffect(() => {
  return () => {
    if (selectionMode?.active) {
      app.cancelSelectionMode();
    }
  };
}, []);
```

**✅ FAIRE** : Feedback visuel clair
```jsx
{selectionMode?.active && (
  <div className="bg-purple-100 border-b border-purple-300 p-2">
    <p className="text-purple-700 text-center text-sm">
      👉 Appui long sur un élément pour le sélectionner
    </p>
  </div>
)}
```

### 3. Compteurs bulles

**✅ FAIRE** : Utiliser useMemo pour éviter recalculs
```javascript
const sessionCounts = useMemo(() => {
  if (!window.contentLinks) return new Map();
  
  return momentsData.reduce((acc, moment) => {
    const count = window.contentLinks.getSessionsForContent('moment', moment.id).length;
    acc.set(moment.id, count);
    return acc;
  }, new Map());
}, [momentsData, window.contentLinks?.links.size]);
```

### 4. Preview hover

**✅ FAIRE** : Debounce pour éviter flickering
```javascript
let previewTimeout;

const handleMouseEnter = () => {
  previewTimeout = setTimeout(() => {
    setShowPreview(true);
  }, 300);
};

const handleMouseLeave = () => {
  clearTimeout(previewTimeout);
  setShowPreview(false);
};
```

---

## 🚀 Roadmap Phase 18

### Phase 18a : Navigation contextuelle ⭐ PRIORITÉ HAUTE (2 jours)

**Objectif :** Simplifier navigation Bottom Bar + Settings accessible

**Fichiers modifiés :**
1. `Navigation.jsx` v5.0 - Bouton contextuel (← Retour | 🎮 Jeux)
2. `UnifiedTopBar.jsx` v2.8 - Dropdown Avatar avec Settings
3. `App.jsx` v2.5 - État `isInChat`, handlers

**Livrables :**
- ✅ Bottom Bar : [💬][✨][← ou 🎮]
- ✅ Settings dans menu Avatar
- ✅ Bouton "Retour" intelligent dans Chat

---

### Phase 18b : Système de liens souvenirs ⭐ PRIORITÉ MOYENNE+ (5 jours)

**Objectif :** Lier contenus Memories → Sessions

**Sous-étapes :**

**Jour 1-2 : Architecture données**
- `ContentLinks.js` v1.0 - Manager + Maps
- `content-links.json` - Structure Drive
- `linkUtils.js` - Utilitaires
- `dataManager.js` v3.7 - Support liens messages

**Jour 3 : Mode sélection Memories**
- `App.jsx` - État `selectionMode`
- `MemoriesPage.jsx` v7.1 - Badges + appui long généralisé
- `UnifiedTopBar.jsx` - Badge "Sélectionner un souvenir"

**Jour 4 : Input Chat + affichage**
- `ChatPage.jsx` v2.5 - Bouton [📎], `pendingLink`, preview
- `LinkedContent.jsx` v1.0 - Composant lien cliquable
- Structure message étendue (`linkedContent`)

**Jour 5 : Preview + navigation**
- `LinkedContent.jsx` - Tooltip hover avec preview
- Navigation clic lien → Memories (auto-open)

**Livrables :**
- ✅ Workflow complet : Chat → 🔗 → Memories → sélection → envoi
- ✅ Affichage liens dans messages : 📍 Jour 8-9 : Chiang Mai
- ✅ Preview hover (photo/texte selon type)
- ✅ Navigation clic → ouvre dans Memories

---

### Phase 18c : Compteurs bulles sessions ⭐ PRIORITÉ MOYENNE+ (2 jours)

**Objectif :** Afficher nb sessions liées à chaque contenu

**Fichiers modifiés :**
1. `MemoriesPage.jsx` v7.2 - Badge 💬 sur moments/posts/photos
2. `SessionListModal.jsx` v1.0 - Modal liste sessions
3. `ContentLinks.js` - Méthode `getSessionsForContent()`

**Livrables :**
- ✅ Badge 💬 3 sur moments (cliquable)
- ✅ Modal avec liste sessions liées
- ✅ Navigation vers ChatPage depuis modal

---

### Phase 18d : Messages lus + Conversations souvenirs - PRIORITÉ MOYENNE (4 jours)

**Sous-étapes :**

**Jour 1-2 : Nouveaux messages**
- `SessionsPage.jsx` v6.3 - Section "📬 NOUVEAUX MESSAGES"
- `dataManager.js` - Tracking `lastVisitedBy`
- Logique détection nouveaux (depuis dernière visite)

**Jour 3-4 : Sessions → Souvenirs**
- `SessionsPage.jsx` - Bouton "✨ Convertir en souvenir"
- `MasterIndexGenerator.js` v4.2 - Support type "conversation"
- `MemoriesPage.jsx` v7.3 - Filtre + `ConversationMemoryCard`

**Livrables :**
- ✅ Section "Nouveaux messages" en haut Sessions
- ✅ Badge 📬 disparaît à l'ouverture (pas besoin réponse)
- ✅ Conversion session → souvenir conversationnel
- ✅ Affichage dans Memories avec filtre dédié

---

### Phase 18e : Audit architecture - PRIORITÉ MOYENNE (3 jours)

**Objectif :** Préparer centralisation données v3.0

**Tâches :**
1. **Audit complet** : Documenter tous accès données actuels
2. **Identifier redondances** : Maps vs Arrays, indexes multiples
3. **Proposer architecture unifiée** : Store normalisé
4. **Plan migration** : Étapes sans casser l'existant

**Livrables :**
- 📄 Document audit (ajout au Dev Guide)
- 🏗️ Architecture v3.0 proposée
- 📋 Roadmap migration (Phase 19+)

---

## 📋 Ordre d'exécution proposé

**IMMÉDIAT (Semaine 1) :**
1. ✅ Phase 18a : Navigation (2j) → Fondation pour le reste
2. ✅ Phase 18c : Compteurs bulles (2j) → Si dev facile, sinon après 18b

**COURT TERME (Semaine 2) :**
3. Phase 18b : Système liens (5j) → Fonctionnalité clé

**MOYEN TERME (Semaine 3) :**
4. Phase 18d : Messages lus + Conversations (4j)
5. Phase 18e : Audit architecture (3j)

---

## 📝 Checklist validation Phase 18

### Phase 18a
- [ ] Bottom Bar : bouton contextuel fonctionnel (← | 🎮)
- [ ] Settings dans dropdown Avatar
- [ ] Menu Avatar : changement user + réglages + stats
- [ ] Bouton 🎮 grisé (disabled)

### Phase 18b
- [ ] ContentLinks.js opérationnel
- [ ] content-links.json créé sur Drive
- [ ] Mode sélection : TopBar badge + badges contenus
- [ ] Appui long généralisé (moment/post/photo)
- [ ] Input Chat : bouton [📎 Liens/Photos]
- [ ] Preview avant envoi (pendingLink)
- [ ] Affichage lien dans message (📍 surligné)
- [ ] Preview hover (photo + titre)
- [ ] Navigation clic lien → Memories + auto-open
- [ ] Bouton "← Retour au chat" présent

### Phase 18c
- [ ] Badge 💬 sur moments avec compteur
- [ ] Badge 💬 sur posts avec compteur
- [ ] Badge 💬 sur photos avec compteur
- [ ] Modal SessionListModal opérationnel
- [ ] Navigation vers ChatPage depuis modal
- [ ] Performance OK (useMemo)

### Phase 18d
- [ ] Section "📬 NOUVEAUX MESSAGES" fonctionnelle
- [ ] Badge disparaît à l'ouverture (pas réponse nécessaire)
- [ ] Bouton "✨ Convertir en souvenir" sur sessions archivées
- [ ] Filtre "Conversations" dans Memories
- [ ] ConversationMemoryCard affiche correctement
- [ ] Différence claire notifications vs nouveaux messages

---

**Version du guide :** 2.6  
**Dernière révision :** Phase 18 spécifiée - Navigation & Liens  
**Prochaine implémentation :** Phase 18a (Navigation contextuelle)
