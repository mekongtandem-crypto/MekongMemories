# 📋 Phase 17 (v2.5) - Bottom Sheet Memory Explorer
## Spécifications Techniques Finales

---

## 📌 Vue d'Ensemble

### Objectif
Intégrer un **Bottom Sheet** dans ChatPage permettant d'explorer et d'insérer des souvenirs (photos, posts) dans une conversation de manière fluide et ergonomique.

### Décisions Architecturales Validées
- ✅ **Bottom Sheet** (pas Top Sheet) pour ergonomie mobile optimale
- ✅ **Bouton déclencheur à gauche de l'input** (pattern standard messagerie)
- ✅ **3 snap points** : Peek (20%), Half (50%), Full (90%)
- ✅ **Longpress** pour accès rapide aux filtres contextuels
- ✅ **Auto-collapse** quand clavier apparaît

---

## 🎨 Architecture UI Complète

### 1. Placement du Bouton Déclencheur

#### Position Finale : **À Gauche de l'Input Chat**

```
┌─────────────────────────────────────┐
│ ← Chat  Tom & Lambert               │
├─────────────────────────────────────┤
│                                     │
│ Chat messages...                    │
│ Tom: Tu as des photos ?             │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [📸] [💬 Écrire un message...] [➤] │ ← BOUTON ICI (40px)
└─────────────────────────────────────┘
```

**Spécifications Bouton :**
- **Taille :** 40x40px (zone tappable)
- **Icône :** 📸 (24x24px centré)
- **Couleur :** `text-purple-600` par défaut, `text-purple-400` quand disabled
- **Position :** 8px marge gauche, centré verticalement avec l'input
- **État actif :** `bg-purple-100` quand sheet ouvert

**Comportements :**
- **Tap simple** : Ouvre Bottom Sheet en mode Peek (20%)
- **Longpress (500ms)** : Ouvre menu contextuel rapide
- **État disabled** : Si aucun souvenir disponible dans le voyage

---

### 2. Bottom Sheet - 3 Snap Points

#### Snap Point 1 : **Peek (20%)** - Aperçu Rapide

```
┌─────────────────────────────────────┐
│ ← Chat  Tom & Lambert               │
│                                     │
│ Tom: Tu as des photos du temple ?   │
│                                     │
│ Lambert: Oui ! C'était au...        │ 80% écran
│                                     │
│ [📸] [💬 Écrire un message...] [➤] │
├─────────────────────────────────────┤ ━━━━━━━━━━━━━━━━━
│ ═══════════════════════════════════ │ ← Handle (6px hauteur)
│ 🗂️ 15 photos • 3 posts   [+] [✕]   │
│ [▫️][▫️][▫️][▫️]  [Swipe up ↑]      │ 20% écran (~150px)
└─────────────────────────────────────┘
```

**Contenu :**
- Header avec résumé : compteurs photos/posts
- Grid 1 ligne (4 photos) en aperçu
- Boutons [+] (fullscreen) et [✕] (fermer)
- Affordance visuelle "Swipe up pour plus"

**Usage :** Vérification rapide, accès immédiat aux 4 dernières photos du moment

---

#### Snap Point 2 : **Half (50%)** - Navigation Standard

```
┌─────────────────────────────────────┐
│ ← Chat  Tom & Lambert               │
│ Tom: Tu as des photos du temple ?   │
│ Lambert: Oui ! C'était au...        │ 50% écran
│ [📸] [💬 Écrire un message...] [➤] │
├─────────────────────────────────────┤ ━━━━━━━━━━━━━━━━━
│ ═══════════════════════════════════ │ ← Handle
│ 🗂️ Souvenirs • J15    [⚙️] [+] [✕] │
│                                     │
│ [📸 15] [📝 3] [⊡]     Contexte: J15│ ← Ligne filtres
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J15 - Bangkok Temple   15/47 │ │ ← Header sticky
│ └─────────────────────────────────┘ │
│                                     │
│ [▫️][▫️][▫️][▫️]                     │ 50% écran
│ [▫️][▫️][▫️][▫️]                     │ (~370px)
│ [▫️][▫️][▫️][▫️]                     │
│         [Scroll...]                 │
└─────────────────────────────────────┘
```

**Contenu :**
- Header avec titre + boutons [⚙️ Filtres] [+ Fullscreen] [✕ Fermer]
- Ligne filtres : Toggle type + résumé contexte
- Grid photos avec header moment sticky
- Scroll vertical infini

**Usage :** Navigation dans le moment actuel, sélection photos/posts

---

#### Snap Point 3 : **Full (90%)** - Exploration Approfondie

```
┌─────────────────────────────────────┐
│ ← J15 Bangkok         [⚙️] [🔍]     │ 10% écran
├─────────────────────────────────────┤
│ [📸 15] [📝 3] [⊡]                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J15 - Bangkok Temple   15/47 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [▫️][▫️][▫️][▫️]                     │
│ [▫️][▫️][▫️][▫️]                     │
│ [▫️][▫️][▫️][▫️]                     │ 90% écran
│ [▫️][▫️][▫️][▫️]                     │ (~670px)
│ [▫️][▫️][▫️][▫️]                     │
│ [▫️][▫️][▫️][▫️]                     │
│         [Scroll...]                 │
│                                     │
└─────────────────────────────────────┘
```

**Contenu :**
- Mini-header avec contexte + boutons filtres/recherche
- Grid photos complet avec scroll infini
- Pagination (50 photos par batch)
- Tous les filtres avancés accessibles

**Usage :** Recherche dans tout le voyage, filtrage complexe, exploration profonde

---

## 🎯 Comportements & Interactions

### Comportement 1 : Ouverture du Bottom Sheet

#### Tap Simple sur [📸]

```javascript
Action : Tap [📸]
↓
État : isSheetOpen = true, snapPoint = 'peek' (20%)
↓
Animation : Slide up depuis bottom (300ms, ease-out)
↓
Résultat : Sheet ouvert en mode Peek
         Bouton [📸] passe en état actif (bg-purple-100)
```

**Détails Animation :**
- Duration : 300ms
- Easing : `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- Transform : `translateY(100%) → translateY(0)`
- Overlay : Aucun (pas de backdrop)

---

#### Longpress (500ms) sur [📸]

```
Longpress détecté (500ms)
↓
Menu contextuel apparaît au-dessus du bouton
┌─────────────────────────────────────┐
│ [📸] [💬 ...] [➤]                   │
│  ↑                                  │
│ ┌─────────────────────────────────┐ │
│ │ 📸 Photos du moment (15)        │ │ ← Tap → Sheet Photos
│ │ 📝 Articles du moment (3)       │ │ ← Tap → Sheet Posts  
│ │ 🔍 Explorer tout le voyage      │ │ ← Tap → Sheet Full + filtres all
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Spécifications Menu Contextuel :**
- Apparition : Fade in 200ms + slide up 10px
- Position : Au-dessus du bouton [📸], aligné à gauche
- Largeur : 280px
- Padding : 8px
- Shadow : `shadow-lg`
- Fermeture : Tap outside OU sélection item

**Actions Menu :**
1. **"Photos du moment (X)"** → Ouvre sheet en Half, filtre Photos, contexte moment actuel
2. **"Articles du moment (X)"** → Ouvre sheet en Half, filtre Posts, contexte moment actuel
3. **"Explorer tout le voyage"** → Ouvre sheet en Full, filtre Tout, contexte voyage complet

---

### Comportement 2 : Navigation Entre Snap Points

#### Swipe Up/Down

```javascript
// Transitions automatiques
Swipe up depuis Peek (20%) → Half (50%)
Swipe up depuis Half (50%) → Full (90%)
Swipe down depuis Full (90%) → Half (50%)
Swipe down depuis Half (50%) → Peek (20%)
Swipe down depuis Peek (20%) → Ferme le sheet
```

**Détails Swipe :**
- Détection : Velocity > 200px/s OU distance > 50px
- Snap automatique au point le plus proche
- Friction : Effet ressort si swipe trop loin
- Animation : 250ms spring animation

#### Boutons Directs

```javascript
// Bouton [+] : Passage direct en Full
Tap [+] → Animation smooth Peek/Half → Full (400ms)

// Bouton [✕] : Fermeture
Tap [✕] → Animation slide down (300ms) → Sheet fermé
```

---

### Comportement 3 : Gestion du Clavier

#### Cas 1 : Sheet Ouvert → Input Focus

```
État initial : Sheet en Half (50%)
↓
User tap dans input
↓
Clavier monte (40% écran)
↓
Action automatique :
  - Sheet se réduit à Peek (20%)
  - Chat se compresse à 40%
  - Total : Chat 40% + Sheet 20% + Clavier 40% = 100%

┌─────────────────────────────────────┐
│ Chat messages (40%)                 │ ← Compressé
│ [📸] [💬 Texte en cours...▊] [➤]   │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │
│ 🗂️ J15        [⚙️] [+] [✕]         │ 20% Sheet
│ [▫️][▫️][▫️][▫️]                     │ (auto-collapsed)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Clavier iOS/Android             │ │ 40% Clavier
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Comportement :**
- Auto-collapse instantané (100ms)
- Sheet reste accessible (boutons [+] [✕] visibles)
- Tap [+] → rouvre en Full (au-dessus du clavier)

---

#### Cas 2 : Input Focus → Ouverture Sheet

```
État initial : Clavier visible (user tape un message)
↓
User tap [📸]
↓
Action :
  - Sheet s'ouvre en mode Peek (20%) seulement
  - Chat reste à 40%
  - Clavier reste ouvert (40%)
  - Message en cours reste visible

┌─────────────────────────────────────┐
│ Chat (40%)                          │
│ [📸] [💬 C'était au temple de...▊][➤]│
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │
│ 🗂️ 15 photos   [+] [✕]             │ 20% Sheet
│ [▫️][▫️][▫️][▫️]                     │
├─────────────────────────────────────┤
│ Clavier (40%)                       │
└─────────────────────────────────────┘
```

**Logique :** L'utilisateur est en train d'écrire, on ne masque pas son texte

---

### Comportement 4 : Sélection de Contenus

#### Sélection Photo(s)

```
1. User tap photo dans le grid
   ↓
2. Coche ✓ apparaît en overlay (top-right de la vignette)
   ↓
3. Footer sticky apparaît en bas du sheet :

┌─────────────────────────────────────┐
│ Sheet content...                    │
│ [▫️✓][▫️][▫️✓][▫️]                  │ ← Photos cochées
├─────────────────────────────────────┤
│ 2 photos sélectionnées  [Insérer ✓]│ ← Footer sticky
└─────────────────────────────────────┘

4. User tap [Insérer ✓]
   ↓
5. Sheet se ferme (slide down 300ms)
   ↓
6. Photos insérées dans zone de message :

┌─────────────────────────────────────┐
│ [📸] [💬 C'était ce temple !] [➤]   │
│      [🖼️ IMG_2847] [🖼️ IMG_2848] ✕  │ ← Preview inline
└─────────────────────────────────────┘
```

**Footer Sticky Specs :**
- Position : `position: sticky; bottom: 0;`
- Background : `bg-purple-600`
- Texte : `text-white`
- Height : 56px
- Animation apparition : Slide up 200ms

**Preview Photos Inline :**
- Thumbnails 60x60px
- Max 3 photos visibles, si + : "+2 autres"
- Tap sur ✕ global → retire toutes les photos
- Tap sur ✕ individuel → retire cette photo

---

#### Sélection Post (Extrait ou Référence)

```
1. User change toggle vers [📝 Posts]
   ↓
2. Liste posts s'affiche
   ↓
3. User tap sur card post
   ↓
4. Vue complète post s'ouvre (fullscreen dans le sheet)

┌─────────────────────────────────────┐
│ ← Retour                        ✓   │ ← Header
├─────────────────────────────────────┤
│ 📝 Bangkok temples et moines        │
│ J15                                 │
│                                     │
│ [Texte complet scrollable...]       │
│                                     │
│ [Photos du post si toggle ON]       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SÉLECTIONNER UN EXTRAIT         │ │
│ │ [Mode sélection activé]         │ │
│ │ ou                              │ │
│ │ [Insérer référence complète]    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

5. User sélectionne texte (surlignage natif)
   ↓
6. Bouton [Insérer cet extrait] apparaît
   ↓
7. Tap → Sheet ferme → Extrait inséré comme message
```

---

## 🎨 Wireframes Détaillés - Workflow Complet

### Workflow 1 : Insertion Photo Rapide (Cas d'Usage Principal)

```
┌─────────────────────────────────────┐
│ ÉTAPE 1 : État Initial              │
├─────────────────────────────────────┤
│ ← Chat  Tom & Lambert               │
│                                     │
│ Tom: Tu as des photos du temple ?   │
│                                     │
│ Lambert: [typing...]                │
│                                     │
│ [📸] [💬 Écrire un message...] [➤] │
└─────────────────────────────────────┘
         ↓ Tap [📸]
         
┌─────────────────────────────────────┐
│ ÉTAPE 2 : Sheet Peek (20%)          │
├─────────────────────────────────────┤
│ Tom: Tu as des photos du temple ?   │
│ Lambert: [typing...]                │
│ [📸] [💬 Écrire un message...] [➤] │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │
│ 🗂️ 15 photos • 3 posts   [+] [✕]   │
│ [▫️][▫️][▫️][▫️]  [Swipe up ↑]      │
└─────────────────────────────────────┘
         ↓ Swipe up
         
┌─────────────────────────────────────┐
│ ÉTAPE 3 : Sheet Half (50%)          │
├─────────────────────────────────────┤
│ Tom: Tu as des photos ?             │
│ [📸] [💬 Écrire...] [➤]            │
├─────────────────────────────────────┤
│ ═══════════════════════════════════ │
│ 🗂️ Souvenirs • J15    [⚙️] [+] [✕] │
│ [📸 15] [📝 3] [⊡]                  │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J15 - Bangkok Temple   15/47 │ │
│ └─────────────────────────────────┘ │
│ [▫️][▫️][▫️][▫️]                     │
│ [▫️][▫️][▫️][▫️]                     │
│ [▫️][▫️][▫️][▫️]                     │
└─────────────────────────────────────┘
         ↓ Tap photo
         
┌─────────────────────────────────────┐
│ ÉTAPE 4 : Photo Sélectionnée        │
├─────────────────────────────────────┤
│ [📸] [💬 Écrire...] [➤]            │
├─────────────────────────────────────┤
│ 🗂️ Souvenirs • J15    [⚙️] [+] [✕] │
│ [📸 15] [📝 3] [⊡]                  │
│ [▫️✓][▫️][▫️][▫️]                    │ ← Coche visible
│ [▫️][▫️][▫️][▫️]                     │
├─────────────────────────────────────┤
│ 1 photo sélectionnée  [Insérer ✓]  │ ← Footer
└─────────────────────────────────────┘
         ↓ Tap [Insérer]
         
┌─────────────────────────────────────┐
│ ÉTAPE 5 : Photo Insérée             │
├─────────────────────────────────────┤
│ Tom: Tu as des photos du temple ?   │
│                                     │
│ [📸] [💬 C'était ce temple !] [➤]   │
│      [🖼️ IMG_2847.jpg] ✕            │ ← Preview
└─────────────────────────────────────┘
         ↓ Tap [➤] Envoyer
         
┌─────────────────────────────────────┐
│ ÉTAPE 6 : Message Posté             │
├─────────────────────────────────────┤
│ Tom: Tu as des photos du temple ?   │
│                                     │
│ Lambert: C'était ce temple !        │
│ ┌─────────────────────────────────┐ │
│ │ [PHOTO PREVIEW]                 │ │
│ └─────────────────────────────────┘ │
│ 📸 IMG_2847.jpg • J15 Bangkok       │
│ 🏷️ temple • architecture            │
│                                     │
│ [📸] [💬 Écrire un message...] [➤] │
└─────────────────────────────────────┘
```

**Durée totale workflow : ~10 secondes**

---

### Workflow 2 : Recherche Avancée (Tout le Voyage)

```
┌─────────────────────────────────────┐
│ ÉTAPE 1 : Longpress [📸]            │
├─────────────────────────────────────┤
│ [📸] [💬 ...] [➤]                   │
│  ↑                                  │
│ ┌─────────────────────────────────┐ │
│ │ 📸 Photos du moment (15)        │ │
│ │ 📝 Articles du moment (3)       │ │
│ │ 🔍 Explorer tout le voyage      │ │ ← Tap ici
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
         ↓ Tap "Explorer tout le voyage"
         
┌─────────────────────────────────────┐
│ ÉTAPE 2 : Sheet Full + Filtres All  │
├─────────────────────────────────────┤
│ ← Tout le voyage    [⚙️] [🔍]       │
├─────────────────────────────────────┤
│ [📸 247] [📝 12] [⊡]                │
│ Contexte: Tout le voyage [Modifier] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J1 - Arrivée Bangkok    23   │ │
│ └─────────────────────────────────┘ │
│ [▫️][▫️][▫️][▫️]                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J2 - Marché Chatuchak    18  │ │
│ └─────────────────────────────────┘ │
│ [▫️][▫️][▫️][▫️]                     │
│         [Scroll...]                 │
└─────────────────────────────────────┘
         ↓ Tap [🔍] Recherche
         
┌─────────────────────────────────────┐
│ ÉTAPE 3 : Panneau Recherche         │
├─────────────────────────────────────┤
│ ← Recherche                    [✕] │
├─────────────────────────────────────┤
│ 🔍 [lanterne......................]  │ ← Input recherche
│ Dans: [✓] Titres [✓] Contenus      │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 📅 PÉRIODE                          │
│ ○ Moment actuel                     │
│ ○ Jours adjacents                  │
│ ○ Plage personnalisée              │
│ ⦿ Tout le voyage                    │
│                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│ 🏷️ THÈMES                           │
│ [ ] temple [ ] marché [✓] lanternes│
│                                     │
│       [Réinitialiser] [Appliquer]  │
└─────────────────────────────────────┘
         ↓ Type "lanterne" + [Appliquer]
         
┌─────────────────────────────────────┐
│ ÉTAPE 4 : Résultats Filtrés         │
├─────────────────────────────────────┤
│ ← "lanterne"          [⚙️] [🔍]     │
├─────────────────────────────────────┤
│ [📸 8] [📝 2] [⊡]                   │
│ 🔍 8 photos trouvées                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J23 - Hoi An Vieille V.  3/15│ │
│ └─────────────────────────────────┘ │
│ [▫️][▫️][▫️]                         │
│ ┌─────────────────────────────────┐ │
│ │ 📍 J24 - Soirée lanternes   5/23│ │
│ └─────────────────────────────────┘ │
│ [▫️][▫️][▫️][▫️][▫️]                 │
└─────────────────────────────────────┘
         ↓ Sélection + Insertion
```

---

## 🔧 Spécifications Techniques

### 1. Structure Composants React

```
ChatPage.jsx
│
├─ MessageList.jsx
│
├─ MessageInputBar.jsx
│  ├─ [📸] MemoryButton.jsx ← Bouton déclencheur
│  ├─ [💬] TextInput.jsx
│  └─ [➤] SendButton.jsx
│
└─ MemoryBottomSheet.jsx ← Nouveau composant principal
   │
   ├─ SheetHeader.jsx
   │  ├─ Title + Context
   │  ├─ [⚙️] FiltersButton
   │  ├─ [+] FullscreenButton
   │  └─ [✕] CloseButton
   │
   ├─ SheetContent.jsx
   │  ├─ FilterBar.jsx
   │  │  ├─ [📸][📝][⊡] ContentTypeToggle
   │  │  └─ ContextSummary
   │  │
   │  ├─ PhotoGrid.jsx
   │  │  ├─ MomentHeader.jsx (sticky)
   │  │  └─ PhotoThumbnail.jsx (lazy load)
   │  │
   │  └─ PostList.jsx
   │     ├─ PostCard.jsx
   │     └─ PostDetailView.jsx
   │
   └─ SheetFooter.jsx (sticky si sélection)
      └─ SelectionBar (compteur + [Insérer])
```

---

### 2. États du Bottom Sheet

```typescript
interface MemoryBottomSheetState {
  // Ouverture & Taille
  isOpen: boolean;
  snapPoint: 'peek' | 'half' | 'full'; // 20%, 50%, 90%
  
  // Filtres
  filters: {
    contentType: 'photos' | 'posts' | 'all';
    periodMode: 'current' | 'adjacent' | 'custom' | 'all';
    customDateRange?: { start: string; end: string };
    selectedTags: string[];
    searchQuery: string;
  };
  
  // Contexte initial (pré-filtrage)
  initialContext: {
    momentId?: string;
    momentTitle?: string;
    dayRange?: string;
    tags?: string[];
  };
  
  // Sélection
  selectedPhotos: Photo[];
  selectedPostExcerpt?: {
    postId: string;
    text: string;
    startPosition: number;
    endPosition: number;
  };
  
  // UI
  currentView: 'grid' | 'post_detail';
  currentPostId?: string;
  
  // Keyboard
  keyboardVisible: boolean;
  autoCollapsed: boolean; // true si auto-collapsed par clavier
}
```

---

### 3. Props Composant Principal

```typescript
interface MemoryBottomSheetProps {
  // Contrôle externe
  isOpen: boolean;
  onClose: () => void;
  
  // Callbacks
  onInsertPhotos: (photos: Photo[], caption?: string) => void;
  onInsertTextExcerpt: (excerpt: TextExcerpt, intro?: string) => void;
  onInsertPostReference: (postRef: PostReference, intro?: string) => void;
  
  // Contexte initial
  sessionId: string;
  momentId?: string;
  
  // Données
  allMoments: Moment[];
  allPhotos: Photo[];
  allPosts: Post[];
}
```

---

### 4. Méthodes DataManager

#### Insertion Photo(s) dans Session

```javascript
/**
 * Insère un ou plusieurs photos dans une session de chat
 * @param {string} sessionId
 * @param {Photo[]} photos
 * @param {string} caption - Texte accompagnant
 */
async addPhotoMessageToSession(sessionId, photos, caption = '') {
  const session = this.appState.sessions.find(s => s.id === sessionId);
  if (!session) throw new Error('Session not found');
  
  const photoMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'photo_message',
    author: this.appState.currentUser.id,
    timestamp: new Date().toISOString(),
    content: caption,
    photos: photos.map(photo => ({
      filename: photo.filename,
      google_drive_id: photo.google_drive_id,
      source_moment_id: photo.momentId,
      source_moment_title: photo.momentTitle,
      day_range: photo.dayRange,
      tags: photo.tags || [],
      width: photo.width,
      height: photo.height,
      mime_type: photo.mime_type
    })),
    edited: false
  };
  
  const updatedSession = {
    ...session,
    notes: [...session.notes, photoMessage],
    lastUpdate: new Date().toISOString()
  };
  
  await this.updateSession(updatedSession);
  return photoMessage;
}
```

#### Récupération Données Filtrées

```javascript
/**
 * Récupère les souvenirs selon les filtres actifs
 * @param {Object} filters
 * @returns {Object} {photos: Photo[], posts: Post[], moments: Moment[]}
 */
getFilteredMemories(filters) {
  const { 
    contentType, 
    periodMode, 
    customDateRange, 
    selectedTags, 
    searchQuery 
  } = filters;
  
  let moments = [...this.appState.gameData];
  
  // 1. Filtrage période
  if (periodMode === 'current' && filters.momentId) {
    moments = moments.filter(m => m.id === filters.momentId);
  } else if (periodMode === 'adjacent' && filters.currentDay) {
    const currentDayNum = parseInt(filters.currentDay.replace('J', ''));
    moments = moments.filter(m => {
      const dayNum = parseInt(m.dayRange.split('-')[0].replace('J', ''));
      return dayNum >= currentDayNum - 1 && dayNum <= currentDayNum + 1;
    });
  } else if (periodMode === 'custom' && customDateRange) {
    const startNum = parseInt(customDateRange.start.replace('J', ''));
    const endNum = parseInt(customDateRange.end.replace('J', ''));
    moments = moments.filter(m => {
      const dayNum = parseInt(m.dayRange.split('-')[0].replace('J', ''));
      return dayNum >= startNum && dayNum <= endNum;
    });
  }
  // 'all' = pas de filtre
  
  // 2. Filtrage tags (AND logic)
  if (selectedTags.length > 0) {
    moments = moments.filter(m => 
      selectedTags.every(tag => m.tags?.includes(tag))
    );
  }
  
  // 3. Extraction photos et posts
  let photos = [];
  let posts = [];
  
  moments.forEach(moment => {
    if (contentType === 'photos' || contentType === 'all') {
      const momentPhotos = (moment.dayPhotos || []).map(photo => ({
        ...photo,
        momentId: moment.id,
        momentTitle: moment.title,
        dayRange: moment.dayRange
      }));
      photos = photos.concat(momentPhotos);
    }
    
    if (contentType === 'posts' || contentType === 'all') {
      const momentPosts = (moment.posts || []).map(post => ({
        ...post,
        momentId: moment.id,
        momentTitle: moment.title,
        dayRange: moment.dayRange
      }));
      posts = posts.concat(momentPosts);
    }
  });
  
  // 4. Recherche textuelle
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    
    // Filtrer moments
    moments = moments.filter(m => 
      m.title?.toLowerCase().includes(query)
    );
    
    // Filtrer posts
    posts = posts.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.content?.toLowerCase().includes(query)
    );
    
    // Re-extraire photos des moments filtrés
    if (contentType === 'photos' || contentType === 'all') {
      photos = [];
      moments.forEach(moment => {
        const momentPhotos = (moment.dayPhotos || []).map(photo => ({
          ...photo,
          momentId: moment.id,
          momentTitle: moment.title,
          dayRange: moment.dayRange
        }));
        photos = photos.concat(momentPhotos);
      });
    }
  }
  
  return { photos, posts, moments };
}
```

---

### 5. Gestion Clavier (Hook Custom)

```javascript
/**
 * Hook pour détecter l'état du clavier et auto-collapse sheet
 */
import { useEffect, useState } from 'react';

function useKeyboardAwareSheet(sheetRef, snapPoint, setSnapPoint) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      // Détection clavier (heuristique)
      const viewportHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || viewportHeight;
      const diff = viewportHeight - visualViewportHeight;
      
      if (diff > 100) {
        // Clavier ouvert
        setKeyboardHeight(diff);
        
        // Auto-collapse si sheet en Half ou Full
        if (snapPoint === 'half' || snapPoint === 'full') {
          setSnapPoint('peek');
        }
      } else {
        // Clavier fermé
        setKeyboardHeight(0);
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [snapPoint, setSnapPoint]);
  
  return { keyboardHeight, keyboardVisible: keyboardHeight > 0 };
}

export default useKeyboardAwareSheet;
```

---

## 📚 Librairies Recommandées

### 1. Bottom Sheet

**Option A : `react-spring-bottom-sheet`** (Recommandé)
```bash
npm install react-spring-bottom-sheet
```

**Avantages :**
- ✅ Gestion snap points native
- ✅ Animations fluides (spring physics)
- ✅ Swipe gestures built-in
- ✅ Accessible (ARIA)

**Usage :**
```jsx
import { BottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';

<BottomSheet
  open={isOpen}
  onDismiss={onClose}
  snapPoints={({ maxHeight }) => [
    maxHeight * 0.2,  // Peek
    maxHeight * 0.5,  // Half
    maxHeight * 0.9   // Full
  ]}
  defaultSnap={({ snapPoints }) => snapPoints[0]}
>
  {/* Contenu */}
</BottomSheet>
```

---

### 2. Lazy Loading Images

**`react-intersection-observer`**
```bash
npm install react-intersection-observer
```

**Usage :**
```jsx
import { useInView } from 'react-intersection-observer';

function PhotoThumbnail({ photo }) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  return (
    <div ref={ref} className="photo-thumbnail">
      {inView ? (
        <img src={photo.lh3_url} alt={photo.filename} />
      ) : (
        <div className="placeholder" />
      )}
    </div>
  );
}
```

---

### 3. Longpress Detection

**`use-long-press`**
```bash
npm install use-long-press
```

**Usage :**
```jsx
import { useLongPress } from 'use-long-press';

function MemoryButton({ onOpen, onLongPress }) {
  const bind = useLongPress(
    () => onLongPress(), // Callback longpress
    {
      onStart: () => console.log('Press started'),
      onFinish: () => console.log('Press finished'),
      onCancel: () => console.log('Press cancelled'),
      threshold: 500, // 500ms
      captureEvent: true,
      cancelOnMovement: true
    }
  );
  
  return (
    <button 
      {...bind()}
      onClick={onOpen}
      className="memory-button"
    >
      📸
    </button>
  );
}
```

---

## ✅ Checklist Développeur

### Phase 1 : Structure & Bouton (2-3 jours)

- [ ] Créer composant `MemoryButton.jsx` (icône + états)
- [ ] Intégrer bouton dans `MessageInputBar` à gauche de l'input
- [ ] Calculer dimensions layout (40px bouton + input flexible + 50px send)
- [ ] Implémenter état actif (bg-purple-100) quand sheet ouvert
- [ ] Tester responsive (320px → 768px)

### Phase 2 : Bottom Sheet Base (3-4 jours)

- [ ] Installer `react-spring-bottom-sheet`
- [ ] Créer composant `MemoryBottomSheet.jsx`
- [ ] Configurer 3 snap points (20%, 50%, 90%)
- [ ] Implémenter ouverture/fermeture avec animations
- [ ] Gérer état `isOpen` + `snapPoint` dans ChatPage
- [ ] Tester swipe up/down entre snap points

### Phase 3 : Contenu Sheet - Peek & Half (4-5 jours)

- [ ] Créer `SheetHeader.jsx` (titre, compteurs, boutons)
- [ ] Créer `FilterBar.jsx` (toggle type + résumé contexte)
- [ ] Créer `PhotoGrid.jsx` avec grid 4 colonnes
- [ ] Créer `MomentHeader.jsx` (sticky header avec compteur X/Y)
- [ ] Implémenter lazy loading images (intersection observer)
- [ ] Implémenter pagination (batch 50 photos)
- [ ] Créer `PostList.jsx` avec cards compactes

### Phase 4 : Longpress Menu (2 jours)

- [ ] Installer `use-long-press`
- [ ] Créer composant `ContextMenu.jsx`
- [ ] Implémenter détection longpress (500ms)
- [ ] 3 items menu : Photos / Articles / Explorer tout
- [ ] Gestion ouverture sheet avec filtres pré-appliqués
- [ ] Fermeture menu (tap outside)

### Phase 5 : Sélection & Insertion (4-5 jours)

- [ ] Implémenter sélection photo (tap → coche overlay)
- [ ] Créer `SelectionFooter.jsx` (sticky footer compteur)
- [ ] Multi-sélection photos
- [ ] Méthode `addPhotoMessageToSession()` dans DataManager
- [ ] Preview photos inline dans input chat
- [ ] Bouton remove (✕) global et individuel
- [ ] Gestion insertion dans message en cours

### Phase 6 : Gestion Clavier (3-4 jours)

- [ ] Créer hook `useKeyboardAwareSheet`
- [ ] Détection clavier ouvert (viewport height)
- [ ] Auto-collapse sheet → Peek quand clavier monte
- [ ] Test cas : Sheet ouvert → input focus
- [ ] Test cas : Input focus → ouverture sheet
- [ ] Vérifier sur iOS et Android

### Phase 7 : Filtres Avancés (4-5 jours)

- [ ] Créer panneau `FiltersPanel.jsx`
- [ ] Slide-in depuis right (ou modal)
- [ ] Filtres période (4 modes radio)
- [ ] Filtres tags (multi-sélection chips)
- [ ] Recherche textuelle avec debounce (300ms)
- [ ] Méthode `getFilteredMemories()` dans DataManager
- [ ] Affichage résumé filtres actifs dans barre contexte

### Phase 8 : Mode Full (90%) (3-4 jours)

- [ ] Adapter layout pour 90% écran
- [ ] Mini-header avec contexte + boutons
- [ ] Grid photos scroll infini
- [ ] Gestion états vides (aucun résultat)
- [ ] Message si >200 photos (inviter à affiner)
- [ ] Transitions smooth Peek/Half → Full

### Phase 9 : Posts Détails (3-4 jours)

- [ ] Créer `PostDetailView.jsx`
- [ ] Affichage texte complet scrollable
- [ ] Affichage photos du post (conditionnel au toggle)
- [ ] Sélection extrait texte (native selection)
- [ ] Bouton insertion extrait
- [ ] Bouton insertion référence complète
- [ ] Navigation retour vers liste

### Phase 10 : Messages Chat Enrichis (3-4 jours)

- [ ] Enrichir `PhotoMessage.jsx` (métadonnées cliquables)
- [ ] Créer `TextExcerptMessage.jsx`
- [ ] Créer `PostReferenceMessage.jsx`
- [ ] Navigation depuis message → MemoriesPage
- [ ] Carousel multi-photos dans message
- [ ] Tests rendu différents types messages

### Phase 11 : Polish & UX (3-4 jours)

- [ ] Animations fluides (sheet, filtres, sélection)
- [ ] Loading states (spinners, skeletons)
- [ ] Messages feedback utilisateur
- [ ] Gestion erreurs (photos manquantes, Drive offline)
- [ ] Accessibilité (ARIA labels, focus management)
- [ ] Tests responsive (iPhone SE → iPad)

### Phase 12 : Tests & Déploiement (2-3 jours)

- [ ] Tests unitaires composants
- [ ] Tests intégration workflows complets
- [ ] Tests sur devices réels (iOS/Android)
- [ ] Tests performance (grandes listes)
- [ ] Optimisations finales
- [ ] Documentation code (JSDoc)
- [ ] Mise à jour Dev Guide

---

## 📊 Estimation Globale

**Durée totale :** 38-47 jours développeur (7-9 semaines)

**Répartition :**
- Structure & UI : 35%
- Logique métier : 30%
- Interactions & UX : 25%
- Tests & Polish : 10%

---

## ⚠️ Points d'Attention & Risques

### 1. Performance avec Nombreuses Photos

**Risque :** Scroll lent avec 450+ photos chargées

**Mitigation :**
- Lazy loading obligatoire (intersection observer)
- Virtualisation si >200 photos (react-window)
- Pagination par batch de 50
- Cache images thumbnails

### 2. Gestion Clavier Multi-Plateforme

**Risque :** Comportements différents iOS vs Android

**Mitigation :**
- Tester sur devices réels dès Phase 6
- Utiliser `window.visualViewport` API
- Fallback sur `window.innerHeight`
- Prévoir tweaks spécifiques par OS

### 3. Sélection Texte Mobile

**Risque :** Sélection native peut être buggy/complexe

**Mitigation :**
- Privilégier sélection par paragraphe (boutons)
- Alternative : insertion post complet uniquement
- Tester UX sur différents navigateurs

### 4. Taille Bundle

**Risque :** `react-spring-bottom-sheet` + autres libs = bundle lourd

**Mitigation :**
- Code splitting : charger Bottom Sheet à la demande
- Tree shaking (imports nommés)
- Analyser bundle (webpack-bundle-analyzer)

---

## 🔄 Évolutions Futures (Post-Phase 17)

### Phase 18 : Assistant Contextuel
- Suggestions automatiques photos basées sur contenu chat
- "Vous parlez de temple → 3 photos suggérées"

### Phase 19 : Recherche Avancée
- Recherche par couleur dominante
- Recherche géographique (carte)
- OCR sur texte dans photos

### Phase 20 : Édition Légère
- Recadrage/rotation photo avant insertion
- Ajout légende rapide
- Filtres photo basiques

---

## 📞 Support & Questions

**Contact Concepteur :**
Pour clarifications sur specs UX/UI

**Revues de Code :**
Point sync recommandé tous les 5 jours

**Documentation :**
Maintenir le Dev Guide à jour

---

## ✅ Validation Finale

**Document validé le :** [Date]  
**Par :** Concepteur/Intégrateur  
**Version :** 2.5 - Phase 17 - Bottom Sheet  
**Statut :** Prêt pour développement

---

*Fin des Spécifications*