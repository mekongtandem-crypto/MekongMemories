# SPÉCIFICATIONS FONCTIONNELLES - Affichage Page Mémoires v2.14

> **Date:** 6 décembre 2025
> **Version cible:** 2.14 (Refactoring complet)
> **Statut:** 🟡 EN VALIDATION

---

## 🎯 Objectif

Définir clairement les comportements attendus de l'affichage de la page Mémoires AVANT le refactoring technique, pour garantir une interface claire, cohérente et prévisible pour l'utilisateur.

---

## 📋 TABLE DES MATIÈRES

1. [Contrôles d'Affichage](#1-contrôles-daffichage)
2. [Filtrage du Contenu](#2-filtrage-du-contenu)
3. [Tri et Ordre](#3-tri-et-ordre)
4. [Comportements Attendus](#4-comportements-attendus)
5. [Questions Ouvertes](#5-questions-ouvertes)
6. [Vision Future](#6-vision-future)

---

## 1. CONTRÔLES D'AFFICHAGE

### 1.1 Filtres de Contenu (TopBar Centre)

**3 boutons principaux** contrôlant la VISIBILITÉ du contenu :

| Bouton | Icône | Fonction Actuelle | État Visuel |
|--------|-------|-------------------|-------------|
| **Moments** | ✨ Sparkles | Afficher/masquer **en-têtes moments**<br>Si désactivé → Mode "en vrac" (FlatContentList) | Violet si actif<br>Gris si inactif |
| **Posts** | 🗒️ FileText | Afficher/masquer **posts complets**<br>(header + texte + photos post) | Bleu si actif<br>Gris si inactif |
| **Photos** | 📸 Camera | Afficher/masquer **toutes les photos**<br>(photos moment + photos post) | Vert si actif<br>Gris si inactif |

**Protection:** Au moins 1 filtre doit rester actif (empêche page vide)

**Comportement actuel:**
```
✨ désactivé → FlatContentList (contenu en vrac sans structure moment)
✨ activé → MomentsList (structure avec en-têtes moments)
```

---

### 1.2 Toggles Volets (TopBar Centre - Mini-boutons)

**3 mini-boutons** sous chaque filtre, contrôlant l'EXPANSION du contenu :

| Mini-bouton | Icône | Fonction | État Visuel | Désactivé si |
|-------------|-------|----------|-------------|--------------|
| **Moments volet** | Layers/ChevronDown | Déplier/replier TOUS les moments | Vert si tous ouverts<br>Gris sinon | ✨ Moments désactivé |
| **Posts volet** | Layers/ChevronDown | Déplier/replier TOUS les posts | Vert si tous ouverts<br>Gris sinon | 🗒️ Posts désactivé |
| **Photos volet** | Layers/ChevronDown | Déplier/replier TOUTES les grilles photos | Vert si tous ouverts<br>Gris sinon | 📸 Photos désactivé |

**Comportement actuel:**
- Clic → Appelle `window.memoriesPageActions.expandAll*()` ou `collapseAll*()`
- État calculé depuis `window.memoriesPageState` (polling 200ms)

---

### 1.3 Autres Contrôles (TopBar Gauche & Menu)

| Contrôle | Icône | Fonction |
|----------|-------|----------|
| **Random** | 🎲 Dices | Sauter vers moment aléatoire |
| **Recherche** | 🔍 Search | Recherche textuelle (titre + contenu posts) |
| **Thèmes** | 🏷️ Tag | Afficher barre thèmes → Filtrage par thème |
| **Photo Souvenir** | ✨ Sparkles | Ajouter photo importée avec création moment |
| **Mode Édition** | ✏️ Edit2 | Activer/désactiver mode édition (CRUD) |

---

## 2. FILTRAGE DU CONTENU

### 2.1 Hiérarchie des Filtres

**Ordre d'application** (pipeline de filtrage) :

```
1. Filtres de contenu (moments/posts/photos)
   ↓ Élimine moments sans contenu visible

2. Recherche textuelle
   ↓ Filtre par titre moment ou contenu post

3. Filtre type de moment
   ↓ all | unexplored | with_posts | with_photos

4. Filtre par thème (si barre thèmes active)
   ↓ Masquage RADICAL (moment disparaît si aucun contenu taggé)

5. Filtre par sessions (si actif)
   ↓ Moments avec/sans sessions associées

6. Filtre par liens (future)
   ↓ Moments avec/sans content links
```

### 2.2 Filtres Détaillés

#### Filtres de Contenu (✨🗒️📸)

**Logique actuelle dans `isElementVisible()`:**

| Élément | Visible si |
|---------|-----------|
| `moment_header` | ✨ Moments = ON |
| `post_header` | 🗒️ Posts = ON |
| `post_text` | 🗒️ Posts = ON |
| `post_photos` | 🗒️ Posts = ON **OU** 📸 Photos = ON |
| `day_photos` | 📸 Photos = ON |

**Question:** Les photos de posts doivent-elles être visibles si SEULEMENT 📸 Photos actif (sans 🗒️ Posts) ?
- ✅ **OUI** (actuel) → Toutes photos visibles si 📸 ON
- ❌ **NON** → Photos post visibles SEULEMENT si 🗒️ Posts ON

#### Filtre Type de Moment

```javascript
momentFilter = 'all'        // Tous les moments (défaut)
momentFilter = 'unexplored' // Moments sans session associée
momentFilter = 'with_posts' // Moments avec au moins 1 post
momentFilter = 'with_photos'// Moments avec dayPhotos
```

**Emplacement actuel:** Dans menu overflow (ArrowUpDown) - Peu visible

#### Filtre par Thème

**Comportement:** Masquage RADICAL
- Moment visible seulement si AU MOINS 1 contenu (post/photo) est taggé avec le thème
- Vérifie posts, dayPhotos, et photos Mastodon

**Source:** `window.themeAssignments.getThemesForContent(key)`

#### Recherche Textuelle

**Cible:**
- Titre du moment (`displayTitle`)
- Contenu des posts (`post.content`)

**Type:** Recherche insensible à la casse, substring matching

---

## 3. TRI ET ORDRE

### 3.1 Modes de Tri Actuels

```javascript
sortOrder = 'chronological' // Ordre du masterIndex (défaut)
sortOrder = 'random'        // Aléatoire (avec seed date pour stabilité)
sortOrder = 'richness'      // Par richesse (posts*3 + photos + sessions*5)
```

**Emplacement actuel:** Dans menu overflow (ArrowUpDown)

### 3.2 Ordre d'Affichage (Future)

**Questions ouvertes:**

1. **Persistance de l'ordre:**
   - Doit-on sauvegarder `sortOrder` dans localStorage ?
   - Réinitialiser à 'chronological' à chaque visite ou conserver ?

2. **Tri aléatoire:**
   - Seed fixe par jour → même ordre toute la journée ?
   - Bouton "Re-mélanger" pour changer le seed ?

3. **Tri par richesse:**
   - Formule actuelle : `posts*3 + photos + sessions*5 + liens*?`
   - Ajuster poids ? (ex: photos plus importantes que posts ?)

4. **Autres tris possibles:**
   - Par date de dernière activité (dernière session)
   - Par nombre de sessions (moments les plus discutés)
   - Par nombre de photos (moments les plus visuels)
   - Par géolocalisation (si données GPS ajoutées)

---

## 4. COMPORTEMENTS ATTENDUS

### 4.1 Scénarios d'Utilisation

#### Scénario A: Voir SEULEMENT les photos

**Actions utilisateur:**
1. Désactive ✨ Moments
2. Désactive 🗒️ Posts
3. Active 📸 Photos

**Résultat attendu:**
- FlatContentList (mode en vrac)
- Toutes les photos affichées en grille continue
- Pas d'en-têtes moments
- Pas de posts

**Question:** Les photos doivent-elles être groupées par moment ou vraiment "en vrac" ?

---

#### Scénario B: Déplier tous les posts

**Action:** Clic mini-bouton Posts volet

**Comportement attendu:**
1. TOUS les posts s'ouvrent immédiatement
2. Feedback visuel instantané (< 50ms)
3. État persisté dans localStorage
4. Si scroll → conserver position relative
5. Mini-bouton devient vert (état "tous ouverts")

**Comportement actuel:** Latence 200ms (polling)

---

#### Scénario C: Fermer moment avec posts ouverts

**Actions:**
1. Ouvre moment M1
2. Déplie plusieurs posts
3. Ferme moment M1
4. Réouvre moment M1

**Résultat attendu (à valider):**
- Option A: Posts restent dépliés (état global conservé)
- Option B: Posts se replient (reset local au moment)

**Question:** Quelle option préférez-vous ?

---

#### Scénario D: Protection "au moins 1 filtre"

**Action:** Utilisateur tente de désactiver le dernier filtre actif

**Comportement attendu:**
1. Clic ignoré (pas de changement)
2. Feedback visuel immédiat (ex: shake animation ?)
3. Toast après 3 tentatives : "Au moins un filtre doit rester actif"

**Comportement actuel:** Console.log uniquement (invisible)

---

### 4.2 États Initiaux (Premier Chargement)

**À la première visite de MemoriesPage:**

| État | Valeur par défaut |
|------|-------------------|
| ✨ Moments | ON |
| 🗒️ Posts | ON |
| 📸 Photos | ON |
| Tous moments dépliés ? | NON (accordion fermé) |
| Tous posts dépliés ? | NON |
| Toutes grilles photos dépliées ? | NON |
| sortOrder | 'chronological' |
| searchQuery | '' (vide) |
| selectedTheme | null (tous) |
| momentFilter | 'all' |

**Persistance:**
- Filtres de contenu (✨🗒️📸) → localStorage `mekong_content_filters`
- États volets → localStorage `mekong_volets_state_{userId}`
- Tri → **Non persisté actuellement** (réinitialise à 'chronological')

**Question:** Doit-on persister `sortOrder` ?

---

### 4.3 Retour depuis ChatPage

**Contexte:** Utilisateur ouvre session depuis MemoriesPage, puis revient

**Comportement attendu:**
1. Scroll automatique vers moment lié (`navigationContext.sessionMomentId`)
2. Moment auto-ouvert
3. Filtres/tri conservés (pas de reset)
4. États volets conservés

**Comportement actuel:** ✅ Implémenté via `useMemoriesScroll`

---

## 5. QUESTIONS OUVERTES

### ❓ Q1: Photos de Posts (Visibilité)

**Situation:** Utilisateur active 📸 Photos mais désactive 🗒️ Posts

**Doit-on afficher les photos des posts ?**
- ✅ OUI (actuel) → `post_photos` visible si `posts OR photos`
- ❌ NON → `post_photos` visible SEULEMENT si `posts`

**Votre choix :** _____________

---

### ❓ Q2: Persistance Tri

**Doit-on sauvegarder `sortOrder` dans localStorage ?**
- ✅ OUI → L'utilisateur retrouve son tri préféré à chaque visite
- ❌ NON → Toujours 'chronological' par défaut

**Votre choix :** _____________

---

### ❓ Q3: Reset États Volets par Moment

**Quand l'utilisateur ferme un moment avec posts/photos ouverts:**
- ✅ CONSERVER → État global, posts restent dépliés
- ❌ RESET → Replier automatiquement à la fermeture

**Votre choix :** _____________

---

### ❓ Q4: Feedback Protection "1 filtre minimum"

**Quand clic sur dernier filtre actif:**
- Animation shake sur bouton ?
- Toast immédiat ou après 3 tentatives ?
- Autre feedback visuel ?

**Votre proposition :** _____________

---

### ❓ Q5: Nomenclature Boutons

**Vocabulaire cohérent pour l'utilisateur:**

Actuellement :
- "Moments" (en-têtes)
- "Posts" (textes complets)
- "Photos" (images)

Alternatives possibles :
- "Structure" au lieu de "Moments" ?
- "Textes" au lieu de "Posts" ?
- "Images" au lieu de "Photos" ?

**Vos préférences :** _____________

---

### ❓ Q6: Emplacement Tri

**Actuellement:** Tri dans menu overflow (peu visible)

**Doit-on déplacer le tri dans la TopBar ?**
- ✅ OUI → Bouton tri entre thèmes et filtres contenu
- ❌ NON → Garder dans menu overflow

**Votre choix :** _____________

---

### ❓ Q7: Affichage "En Vrac" (✨ Moments désactivé)

**Quand ✨ Moments est OFF:**

FlatContentList affiche actuellement :
```
Photo
Photo
Post (avec header mini)
Photo
Post
...
```

**Doit-on :**
- A. Garder mini-headers posts (actuel)
- B. Supprimer tous headers (vraiment "en vrac")
- C. Grouper par type (toutes photos, puis tous posts)

**Votre choix :** _____________

---

## 6. VISION FUTURE

### 6.1 Fonctionnalités Planifiées

**Phase 2.15+ (Post-refactoring):**

1. **Tri avancé**
   - Par activité récente (dernière session)
   - Par popularité (nombre sessions)
   - Par densité visuelle (ratio photos/posts)
   - Par géolocalisation (si données GPS)

2. **Filtres combinés**
   - UI pour combiner plusieurs filtres
   - Sauvegarde de "vues" personnalisées
   - Ex: "Moments non explorés avec photos" en 1 clic

3. **Affichage personnalisé**
   - Taille vignettes photos (S/M/L)
   - Densité affichage (compact/confortable/spacieux)
   - Colonnes grille photos (2/3/4 colonnes)

4. **Statistiques visuelles**
   - Heatmap timeline (richesse par période)
   - Graphique répartition thèmes
   - Nuage de tags

5. **Synchronisation état**
   - Sync multi-device via Google Drive
   - Partage de "vues" entre utilisateurs

---

### 6.2 Améliorations UX Mineures

**Quick wins post-refactoring:**

1. **Transitions fluides**
   - Animation expand/collapse (150ms)
   - Fade in/out pour filtrage

2. **Feedback immédiat**
   - Spinner léger pendant filtrage (si > 100ms)
   - Compteur "X résultats trouvés"

3. **Raccourcis clavier**
   - `m` → Toggle Moments
   - `p` → Toggle Posts
   - `f` → Toggle Photos
   - `r` → Random moment
   - `Ctrl+F` → Focus recherche

4. **Tooltips améliorés**
   - Explication complète de chaque filtre
   - Nombre d'éléments concernés

5. **Mode compact mobile**
   - Boutons TopBar plus petits sur < 375px
   - Swipe horizontal pour filtres

---

## 7. DÉCISIONS ARCHITECTURALES

### 7.1 Architecture Cible (Refactoring v2.14)

**Pattern:** Context + Reducer (single source of truth)

```javascript
MemoriesDisplayContext {
  state: {
    // Filtres de contenu
    contentFilters: {
      moments: boolean,
      posts: boolean,
      photos: boolean
    },

    // États expansion
    expanded: {
      moments: Set<string>,      // IDs moments ouverts
      posts: Set<string>,        // IDs posts dépliés
      photoGrids: Set<string>    // IDs grilles photos ouvertes
    },

    // Filtres contextuels
    searchQuery: string,
    selectedTheme: string | null,
    momentFilter: 'all' | 'unexplored' | ...,

    // Tri
    sortOrder: 'chronological' | 'random' | 'richness'
  },

  actions: {
    toggleContentFilter(type),
    toggleExpanded(type, id),
    expandAll(type),
    collapseAll(type),
    setSearchQuery(query),
    setSortOrder(order),
    // ...
  }
}
```

**Avantages:**
- ✅ Zero polling (reactivity native React)
- ✅ Zero props drilling (useContext)
- ✅ Single source of truth
- ✅ Predictable updates (reducer)
- ✅ Testable (pure functions)
- ✅ Performance optimale (useMemo + React.memo)

---

### 7.2 Persistance localStorage

**Stratégie:**

1. **Hook dédié** `useDisplayPersistence()`
   - Écoute changements dans Context
   - Debounce writes (300ms)
   - Batching des updates
   - Hydratation initiale au mount

2. **Clés localStorage:**
   - `mekong_display_filters_{userId}` → contentFilters
   - `mekong_display_expanded_{userId}` → expanded (Sets → Arrays)
   - `mekong_display_sort_{userId}` → sortOrder (si persisté)

3. **Migration depuis ancien format:**
   - Lecture `mekong_volets_state_{userId}` (ancien)
   - Conversion vers nouveau format
   - Cleanup ancienne clé

---

## 8. VALIDATION

### Checklist de Validation

Avant de commencer le refactoring, valider :

- [ ] Comportement filtres de contenu (✨🗒️📸) clair
- [ ] Comportement toggles volets clair
- [ ] Réponses aux 7 questions ouvertes
- [ ] Accord sur nomenclature (Moments/Posts/Photos OK ?)
- [ ] Accord sur architecture Context + Reducer
- [ ] Accord sur stratégie persistance
- [ ] Priorisation fonctionnalités futures (Phase 2.15+)

---

## 9. ROADMAP

### Phase 2.14 - Refactoring (Cette session)

**Durée estimée:** 3-4 sessions

**Livrables:**
1. ✅ Context `MemoriesDisplayContext` créé
2. ✅ Reducer avec toutes actions
3. ✅ Hook `useDisplayPersistence()` pour localStorage
4. ✅ Migration TopBar (supprimer polling)
5. ✅ Migration MomentCard, PostArticle, PhotoGrid
6. ✅ Cleanup window.state + anciens états
7. ✅ Tests validation comportements
8. ✅ Performance check (re-renders count)

**Critères succès:**
- Zero polling intervals
- < 10 re-renders par action utilisateur
- Feedback instantané (< 50ms)
- localStorage sync stable
- Code réduit de 30%+

---

### Phase 2.15 - Tri Avancé (Future)

**Livrables:**
1. UI tri visible dans TopBar
2. Persistance tri dans localStorage
3. Nouveaux modes : activité, popularité, densité
4. Animations transitions tri

---

### Phase 2.16 - Filtres Avancés (Future)

**Livrables:**
1. UI combinaison filtres
2. Vues sauvegardées
3. Presets ("Moments riches", "Photos seulement", etc.)
4. Statistiques visuelles

---

## 📝 NOTES DE VALIDATION

**À remplir par le concepteur/utilisateur :**

```
Date validation : ___________
Validé par : ___________

Réponses questions ouvertes :
Q1 (Photos posts): ___________
Q2 (Persistance tri): ___________
Q3 (Reset volets): ___________
Q4 (Feedback protection): ___________
Q5 (Nomenclature): ___________
Q6 (Emplacement tri): ___________
Q7 (Affichage en vrac): ___________

Commentaires additionnels :
_________________________________
_________________________________
_________________________________

Accord pour démarrer refactoring : ☐ OUI  ☐ NON (ajustements requis)
```

---

**Version:** 1.0
**Auteur:** Claude Code (AI Assistant)
**Dernière mise à jour:** 6 décembre 2025
