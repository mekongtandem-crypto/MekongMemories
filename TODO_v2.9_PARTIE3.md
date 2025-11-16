# TODO v2.9 - Partie 3 : Intégration UI des modals

## ✅ Déjà fait (v2.9g)

### Bugs corrigés
- ✅ Bug 1: Import `Check` manquant dans SessionsPage.jsx
- ✅ Bug 2: Pastille 'New' au lieu de 'non lue' pour sessions modifiées (ajout `updatedAt` dans getReadState + updateSession)
- ✅ Bug 3: Suppression de session ne mettait pas à jour `currentChatSession`

### Modals créés
- ✅ EditMomentModal.jsx
- ✅ EditPostModal.jsx
- ✅ ConfirmDeleteModal.jsx

### Méthodes CRUD créées
- ✅ dataManager.updateMoment()
- ✅ dataManager.deleteMoment()
- ✅ dataManager.updatePost()
- ✅ dataManager.deletePost()
- ✅ dataManager.deletePhoto()
- ✅ Toutes exposées via useAppState.js

## ⏳ Reste à faire (v2.9h)

### 1. Intégrer les modals dans MemoriesPage.jsx

Ajouter les états pour les modals :

```javascript
// États modals édition (v2.9)
const [editMomentModal, setEditMomentModal] = useState({ isOpen: false, moment: null });
const [editPostModal, setEditPostModal] = useState({ isOpen: false, post: null, momentId: null });
const [confirmDeleteModal, setConfirmDeleteModal] = useState({
  isOpen: false,
  type: null,  // 'moment' | 'post' | 'photo'
  itemName: null,
  onConfirm: null
});
```

Ajouter les handlers :

```javascript
const handleEditMoment = useCallback((moment) => {
  setEditMomentModal({ isOpen: true, moment });
}, []);

const handleSaveMoment = useCallback(async (updatedMoment) => {
  try {
    await app.updateMoment(updatedMoment);
    setEditMomentModal({ isOpen: false, moment: null });
  } catch (error) {
    alert('Erreur lors de la modification : ' + error.message);
  }
}, [app]);

const handleDeleteMoment = useCallback((moment) => {
  setConfirmDeleteModal({
    isOpen: true,
    type: 'moment',
    itemName: moment.title,
    onConfirm: async () => {
      try {
        await app.deleteMoment(moment.id);
      } catch (error) {
        alert('Erreur lors de la suppression : ' + error.message);
      }
    }
  });
}, [app]);

// Même chose pour Post et Photo...
```

Exposer via window :

```javascript
useEffect(() => {
  window.memoriesPageActions = {
    ...window.memoriesPageActions,
    editMoment: handleEditMoment,
    deleteMoment: handleDeleteMoment,
    editPost: handleEditPost,
    deletePost: handleDeletePost,
    deletePhoto: handleDeletePhoto
  };
}, [handleEditMoment, handleDeleteMoment, handleEditPost, handleDeletePost, handleDeletePhoto]);
```

Ajouter les modals JSX :

```javascript
{/* ⭐ v2.9 : Modals édition */}
<EditMomentModal
  isOpen={editMomentModal.isOpen}
  moment={editMomentModal.moment}
  onClose={() => setEditMomentModal({ isOpen: false, moment: null })}
  onSave={handleSaveMoment}
/>

<EditPostModal
  isOpen={editPostModal.isOpen}
  post={editPostModal.post}
  onClose={() => setEditPostModal({ isOpen: false, post: null, momentId: null })}
  onSave={handleSavePost}
/>

<ConfirmDeleteModal
  isOpen={confirmDeleteModal.isOpen}
  onClose={() => setConfirmDeleteModal({ isOpen: false, type: null, itemName: null, onConfirm: null })}
  onConfirm={confirmDeleteModal.onConfirm}
  itemName={confirmDeleteModal.itemName}
  itemType={
    confirmDeleteModal.type === 'moment' ? 'Moment' :
    confirmDeleteModal.type === 'post' ? 'Photo Note' :
    'Photo'
  }
/>
```

### 2. Ajouter boutons dans MomentHeader.jsx

Après le badge sessions (ligne ~201), ajouter :

```javascript
{/* ⭐ v2.9 : Boutons édition (seulement si mode édition + source='imported') */}
{window.appState?.editionMode?.active && moment.source === 'imported' && (
  <>
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.memoriesPageActions?.editMoment(moment);
      }}
      className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
      title="Modifier ce moment"
    >
      <Edit className="w-4 h-4" />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        window.memoriesPageActions?.deleteMoment(moment);
      }}
      className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
      title="Supprimer ce moment"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </>
)}
```

Ajouter les imports :
```javascript
import { Edit, Trash2 } from 'lucide-react';
```

### 3. Ajouter boutons dans PostArticle.jsx

Même pattern que MomentHeader, ajouter après le titre :

```javascript
{window.appState?.editionMode?.active && post.category === 'user_added' && (
  <div className="flex items-center space-x-2 ml-auto">
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.memoriesPageActions?.editPost(post, momentId);
      }}
      className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
      title="Modifier cette Photo Note"
    >
      <Edit className="w-4 h-4" />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        window.memoriesPageActions?.deletePost(momentId, post.id);
      }}
      className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
      title="Supprimer cette Photo Note"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)}
```

### 4. Ajouter bouton dans PhotoThumbnail.jsx

Ajouter un overlay hover avec bouton delete (seulement si source='imported') :

```javascript
{window.appState?.editionMode?.active && photo.source === 'imported' && (
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.memoriesPageActions?.deletePhoto(momentId, photo.google_drive_id);
      }}
      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
      title="Supprimer cette photo"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)}
```

### 5. Exposer editionMode via window dans App.jsx

Après la définition de `handleToggleEditionMode` :

```javascript
// Exposer editionMode globalement
useEffect(() => {
  window.appState = {
    editionMode: editionMode
  };
}, [editionMode]);
```

### 6. Imports nécessaires

**MemoriesPage.jsx :**
```javascript
import EditMomentModal from '../EditMomentModal.jsx';
import EditPostModal from '../EditPostModal.jsx';
import ConfirmDeleteModal from '../ConfirmDeleteModal.jsx';
```

**MomentHeader.jsx, PostArticle.jsx, PhotoThumbnail.jsx :**
```javascript
import { Edit, Trash2 } from 'lucide-react';
```

## Test checklist

- [ ] Mode édition s'active correctement depuis MemoriesTopBar
- [ ] Barre rouge "Mode Édition" s'affiche
- [ ] Boutons 📝/🗑️ apparaissent SEULEMENT sur moments/posts/photos importés
- [ ] Boutons 📝/🗑️ n'apparaissent PAS sur contenus Mastodon
- [ ] Modal EditMomentModal s'ouvre et sauvegarde correctement
- [ ] Modal EditPostModal s'ouvre et sauvegarde correctement
- [ ] ConfirmDeleteModal s'affiche avant suppression
- [ ] Suppressions fonctionnent avec spinner + mise à jour UI
- [ ] Liens ContentLinks sont bien nettoyés lors des suppressions
- [ ] Mode édition se désactive lors du changement de page
- [ ] Dark mode fonctionne sur toutes les modals

## Notes importantes

- Ne PAS permettre l'édition/suppression de contenus Mastodon (source='mastodon')
- Toujours afficher ConfirmDeleteModal avant suppression définitive
- Les méthodes CRUD vérifient déjà les permissions (source/category)
- Penser à désactiver mode édition lors du changement de page (déjà implémenté dans App.jsx)
