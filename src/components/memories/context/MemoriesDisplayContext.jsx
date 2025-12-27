/**
 * MemoriesDisplayContext.jsx v2.31c - Restauration immédiate au montage
 *
 * Architecture centralisée pour gérer TOUT l'affichage de MemoriesPage:
 * - Filtres de contenu (Structure/Textes/Images)
 * - États expansion (moments/posts/photoGrids)
 * - Filtres contextuels (recherche, thème, etc.)
 * - Tri (chronologique, aléatoire, richesse)
 *
 * ⭐ v2.31c : Restauration DÈS getInitialState (évite double render)
 * ⭐ v2.31 : Auto-persistance état dans localStorage
 *            Restauration automatique au montage
 * ⭐ v2.30 : FIX isElementVisible - Logique simplifiée et cohérente
 *            Suppression condition bugguée AP=0 ET DP=1 (post_photos)
 * ✅ v2.19d : Logs debug pour diagnostiquer bouton DM
 * ✅ v2.19c : allMomentsExpanded compte seulement moments visibles
 * ✅ v2.19a : isElementVisible post_photos mode spécial AM=0 AT=0
 * ✅ Zero polling + Single source of truth
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { generatePostKey } from '../../../utils/themeUtils.js';
import { navigationStateManager } from '../../../core/NavigationStateManager.js';  // ⭐ v2.31c

// ========================================
// CONTEXT
// ========================================

const MemoriesDisplayContext = createContext(null);

// ========================================
// ÉTATS INITIAUX
// ========================================

/**
 * États initiaux selon specs v2.14:
 * - Structure=ON, Textes=ON, Images=ON
 * - Déplier Textes=ON (tous posts dépliés par défaut)
 * - Déplier Images=ON (toutes grilles dépliées par défaut)
 * - Déplier Moments=OFF (accordion fermé)
 * - Tri chronologique par défaut
 *
 * ⭐ v2.31c : Restauration DÈS l'initialisation (évite double render)
 */
export const getInitialState = (momentsData = []) => {
  // ⭐ v2.31c : Lire état sauvegardé AVANT de créer defaults
  const savedState = navigationStateManager.restorePageState('memories');

  // Collecter tous les IDs de posts et photoGrids pour déplier par défaut
  const allPostIds = [];
  const allPhotoGridIds = [];

  momentsData.forEach(moment => {
    // ⭐ v2.14s : Posts avec generatePostKey pour cohérence
    if (moment.posts) {
      moment.posts.forEach(post => {
        if (post.id) allPostIds.push(generatePostKey(post));  // ✅ Format: post:${post.id}
      });
    }

    // ⭐ v2.14s : Grilles photos - format unifié
    // Photos de moment: moment.id (sans préfixe)
    if (moment.dayPhotos && moment.dayPhotos.length > 0) {
      allPhotoGridIds.push(moment.id);
    }
    // Photos de posts: post_${post.id}
    if (moment.posts) {
      moment.posts.forEach(post => {
        if (post.photos && post.photos.length > 0) {
          allPhotoGridIds.push(`post_${post.id}`);
        }
      });
    }
  });

  // ⭐ v2.31c : Defaults (utilisés si pas d'état sauvegardé)
  const defaults = {
    // ⭐ v2.14 : Filtres de contenu (nomenclature validée)
    contentFilters: {
      structure: true,  // ✨ En-têtes moments (ex "Moments")
      textes: true,     // 🗒️ Posts complets (ex "Posts")
      images: true      // 📸 Photos (ex "Photos")
    },

    // ⭐ v2.17c : Mode spécial PhotoDePost (AM=0 ET AT=0)
    postPhotosOnlyMode: false,  // Si true, affiche SEULEMENT les photos de posts (pas les posts eux-mêmes)

    // ⭐ v2.19g : NOUVEAU - Déploiement GLOBAL (via boutons DM/DT/DP)
    // Ne contient QUE l'état des boutons globaux (pas les IDs individuels)
    globalExpansion: {
      moments: false,    // DM - Tous moments fermés par défaut
      posts: true,       // DT - Tous posts dépliés par défaut
      photoGrids: true   // DP - Toutes grilles dépliées par défaut
    },

    // ⭐ v2.19g : MODIFIÉ - États d'ouverture
    // EN MODE INDIVIDUEL (global=false): Contient les moments/posts/grilles ouverts
    // EN MODE GLOBAL (global=true): Contient les EXCEPTIONS (fermées malgré global)
    expanded: {
      moments: new Set(),      // Mode individuel: ouverts | Mode global: exceptions fermées
      posts: new Set(),        // Posts sélectionnés individuellement (VIDÉ par défaut)
      photoGrids: new Set()    // PhotoGrids sélectionnées individuellement (VIDÉ par défaut)
    },

    // ⭐ v2.19g : NOUVEAU - Sélection visuelle (cadre bleu)
    // Contient l'ID du dernier élément cliqué (un seul à la fois)
    selected: {
      moment: null,      // ID du moment sélectionné (cadre bleu)
      post: null,        // ID du post sélectionné (cadre bleu)
      photoGrid: null    // ID de la photoGrid sélectionnée (cadre bleu)
    },

    // ⭐ v2.14i : Counts ET IDs depuis filtrage
    counts: {
      filteredMomentsCount: 0,
      totalPostsCount: 0,
      momentsWithPhotosCount: 0,
      allMomentIds: [],
      allPostIds: [],
      allPhotoGridIds: []
    },

    // Filtres contextuels
    searchQuery: '',
    selectedTheme: null,
    momentFilter: 'all', // 'all' | 'unexplored' | 'with_posts' | 'with_photos'
    hasLinksFilter: null,
    hasSessionsFilter: null,

    // Tri
    sortOrder: 'chronological', // 'chronological' | 'random' | 'richness'

    // UI states
    lastFilterClickCount: 0,
    shakeFilter: null // Filtre à animer (shake) si tentative désactivation
  };

  // ⭐ v2.31c : Merger avec état sauvegardé si disponible
  if (savedState) {
    // Restaurer filtres
    if (savedState.contentFilters) {
      defaults.contentFilters = savedState.contentFilters;
    }
    if (savedState.globalExpansion) {
      defaults.globalExpansion = savedState.globalExpansion;
    }
    if (savedState.sortOrder) {
      defaults.sortOrder = savedState.sortOrder;
    }

    // Restaurer expanded (convertir arrays → Sets)
    if (savedState.expanded) {
      defaults.expanded = {
        moments: new Set(savedState.expanded.moments || []),
        posts: new Set(savedState.expanded.posts || []),
        photoGrids: new Set(savedState.expanded.photoGrids || [])
      };
    }

    // ⭐ v2.31c : Restaurer selected (le cadre bleu)
    if (savedState.selected) {
      defaults.selected = savedState.selected;
    }
  }

  return defaults;
};

// ========================================
// REDUCER ACTIONS
// ========================================

export const ACTIONS = {
  // Filtres de contenu
  TOGGLE_CONTENT_FILTER: 'TOGGLE_CONTENT_FILTER',
  TOGGLE_POST_PHOTOS_ONLY: 'TOGGLE_POST_PHOTOS_ONLY',  // ⭐ v2.17c

  // Expansion
  TOGGLE_EXPANDED: 'TOGGLE_EXPANDED',
  EXPAND_ALL: 'EXPAND_ALL',
  COLLAPSE_ALL: 'COLLAPSE_ALL',
  RESET_MOMENT_CHILDREN: 'RESET_MOMENT_CHILDREN', // Replie posts/photos quand moment fermé

  // Filtres contextuels
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SELECTED_THEME: 'SET_SELECTED_THEME',
  SET_MOMENT_FILTER: 'SET_MOMENT_FILTER',
  SET_HAS_LINKS_FILTER: 'SET_HAS_LINKS_FILTER',
  SET_HAS_SESSIONS_FILTER: 'SET_HAS_SESSIONS_FILTER',

  // Tri
  SET_SORT_ORDER: 'SET_SORT_ORDER',

  // Counts
  UPDATE_COUNTS: 'UPDATE_COUNTS',

  // UI
  TRIGGER_SHAKE: 'TRIGGER_SHAKE',
  CLEAR_SHAKE: 'CLEAR_SHAKE',

  // Batch updates
  HYDRATE_FROM_STORAGE: 'HYDRATE_FROM_STORAGE',
  RESET_ALL: 'RESET_ALL'
};

// ========================================
// DEBUG LOGGING
// ========================================

/**
 * ⭐ v2.15j : Logger l'état d'affichage pour debug
 * Format : "Etat Affichage : StructureON-TexteON-PhotoON | Déploiement : MomentOFF-TexteON-PhotoON"
 */
function logDisplayState(state, action) {
  if (!localStorage.getItem('debug_mode')) return;

  const { contentFilters, expanded } = state;

  // Affichage (filtres)
  const structureLabel = contentFilters.structure ? 'StructureON' : 'StructureOFF';
  const texteLabel = contentFilters.textes ? 'TexteON' : 'TexteOFF';
  const photoLabel = contentFilters.images ? 'PhotoON' : 'PhotoOFF';

  // Déploiement (expansion)
  const momentLabel = expanded.moments.size > 0 ? `MomentON(${expanded.moments.size})` : 'MomentOFF';
  const texteExpandLabel = expanded.posts.size > 0 ? `TexteON(${expanded.posts.size})` : 'TexteOFF';
  const photoExpandLabel = expanded.photoGrids.size > 0 ? `PhotoON(${expanded.photoGrids.size})` : 'PhotoOFF';

  console.log(
    `%c🎯 État Affichage : ${structureLabel}-${texteLabel}-${photoLabel} | Déploiement : ${momentLabel}-${texteExpandLabel}-${photoExpandLabel}`,
    'color: #10b981; font-weight: bold; font-size: 12px;',
    `[Action: ${action.type}]`
  );
}

// ========================================
// REDUCER
// ========================================

function displayReducer(state, action) {
  switch (action.type) {

    // ========================================
    // FILTRES DE CONTENU
    // ========================================

    case ACTIONS.TOGGLE_CONTENT_FILTER: {
      const { filterKey } = action.payload;
      const newFilters = {
        ...state.contentFilters,
        [filterKey]: !state.contentFilters[filterKey]
      };

      // ⚠️ Protection: Au moins 1 filtre doit rester actif
      const hasAtLeastOne = Object.values(newFilters).some(v => v === true);

      if (!hasAtLeastOne) {
        // Trigger shake animation
        return {
          ...state,
          lastFilterClickCount: state.lastFilterClickCount + 1,
          shakeFilter: filterKey
        };
      }

      return {
        ...state,
        contentFilters: newFilters,
        lastFilterClickCount: 0,
        shakeFilter: null
      };
    }

    // ⭐ v2.17c : Toggle mode PhotoDePost (AM=0 ET AT=0)
    case ACTIONS.TOGGLE_POST_PHOTOS_ONLY: {
      return {
        ...state,
        postPhotosOnlyMode: !state.postPhotosOnlyMode
      };
    }

    // ========================================
    // EXPANSION
    // ========================================

    case ACTIONS.TOGGLE_EXPANDED: {
      const { type, id } = action.payload; // type: 'moments' | 'posts' | 'photoGrids'

      const newSet = new Set(state.expanded[type]);
      const newSelected = { ...state.selected };

      // ⭐ v2.19g : Mettre à jour la sélection (cadre bleu)
      if (type === 'moments') {
        newSelected.moment = id;  // Toujours sélectionner le moment cliqué
      } else if (type === 'posts') {
        newSelected.post = id;
      } else if (type === 'photoGrids') {
        newSelected.photoGrid = id;
      }

      // ⭐ v2.19g : Toggle dans expanded (ouverture/exception)
      if (newSet.has(id)) {
        newSet.delete(id);

        // ⭐ Si c'est un moment qui se ferme, replier ses enfants (Q3: Reset volets)
        if (type === 'moments') {
          return {
            ...state,
            expanded: {
              ...state.expanded,
              moments: newSet
            },
            selected: newSelected
          };
        }
      } else {
        // ⭐ v2.21b4 : SUPPRIMÉ clear() - Permet plusieurs volets fermés simultanément
        // En mode global, on peut fermer plusieurs posts/photoGrids individuellement
        // Ils restent fermés (exceptions) jusqu'à ce qu'on les rouvre individuellement
        newSet.add(id);
      }

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [type]: newSet
        },
        selected: newSelected
      };
    }

    case ACTIONS.EXPAND_ALL: {
      const { type } = action.payload;  // ⭐ v2.19g : Plus besoin de ids

      console.log('🔧 [Context] EXPAND_ALL:', type);

      // ⭐ v2.19g : Activer déploiement GLOBAL + Vider sélection INDIVIDUELLE
      return {
        ...state,
        globalExpansion: {
          ...state.globalExpansion,
          [type]: true  // Déployer globalement
        },
        expanded: {
          ...state.expanded,
          [type]: new Set()  // Vider sélection individuelle
        }
      };
    }

    case ACTIONS.COLLAPSE_ALL: {
      const { type } = action.payload;

      console.log('🔧 [Context] COLLAPSE_ALL:', type);

      // ⭐ v2.19g : Désactiver déploiement GLOBAL + Vider sélection INDIVIDUELLE
      return {
        ...state,
        globalExpansion: {
          ...state.globalExpansion,
          [type]: false  // Replier globalement
        },
        expanded: {
          ...state.expanded,
          [type]: new Set()  // Vider sélection individuelle
        }
      };
    }

    case ACTIONS.RESET_MOMENT_CHILDREN: {
      const { momentId, childPostIds = [], childPhotoGridIds = [] } = action.payload;

      // Retirer tous les posts/photoGrids de ce moment
      const newPosts = new Set(state.expanded.posts);
      const newPhotoGrids = new Set(state.expanded.photoGrids);

      childPostIds.forEach(id => newPosts.delete(id));
      childPhotoGridIds.forEach(id => newPhotoGrids.delete(id));

      return {
        ...state,
        expanded: {
          ...state.expanded,
          posts: newPosts,
          photoGrids: newPhotoGrids
        }
      };
    }

    // ========================================
    // FILTRES CONTEXTUELS
    // ========================================

    case ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    case ACTIONS.SET_SELECTED_THEME:
      return { ...state, selectedTheme: action.payload };

    case ACTIONS.SET_MOMENT_FILTER:
      return { ...state, momentFilter: action.payload };

    case ACTIONS.SET_HAS_LINKS_FILTER:
      return { ...state, hasLinksFilter: action.payload };

    case ACTIONS.SET_HAS_SESSIONS_FILTER:
      return { ...state, hasSessionsFilter: action.payload };

    // ========================================
    // TRI
    // ========================================

    case ACTIONS.SET_SORT_ORDER:
      return { ...state, sortOrder: action.payload };

    // ========================================
    // COUNTS
    // ========================================

    case ACTIONS.UPDATE_COUNTS: {
      const newCounts = action.payload;

      // ⭐ v2.15k : Safety check pour éviter React #310
      if (!newCounts || typeof newCounts !== 'object') {
        console.warn('⚠️ [Context] UPDATE_COUNTS avec payload invalide:', newCounts);
        return state;
      }

      console.log('🔧 [Context] UPDATE_COUNTS:', {
        allPostIds: newCounts.allPostIds?.length || 0,
        currentExpandedPosts: state.expanded.posts.size
      });

      // ⭐ v2.15m : FIX React #310 - NE PLUS auto-expand sur changement de filtre !
      // UPDATE_COUNTS ne fait que mettre à jour les counts
      // L'expansion initiale est gérée UNIQUEMENT par getInitialState()
      // Problème avant : AT=0 (allPostIds=[]) → AT=1 (allPostIds=[276]) déclenchait isFirstInit
      return { ...state, counts: newCounts };
    }

    // ========================================
    // UI
    // ========================================

    case ACTIONS.TRIGGER_SHAKE:
      return { ...state, shakeFilter: action.payload };

    case ACTIONS.CLEAR_SHAKE:
      return { ...state, shakeFilter: null };

    // ========================================
    // BATCH UPDATES
    // ========================================

    case ACTIONS.HYDRATE_FROM_STORAGE: {
      const { contentFilters, expanded, sortOrder } = action.payload;

      return {
        ...state,
        ...(contentFilters && { contentFilters }),
        ...(expanded && {
          expanded: {
            moments: new Set(expanded.moments || []),
            posts: new Set(expanded.posts || []),
            photoGrids: new Set(expanded.photoGrids || [])
          }
        }),
        ...(sortOrder && { sortOrder })
      };
    }

    case ACTIONS.RESET_ALL:
      return getInitialState(action.payload?.momentsData || []);

    default:
      return state;
  }
}

// ========================================
// PROVIDER
// ========================================

export function MemoriesDisplayProvider({ children, momentsData = [] }) {
  const lastActionRef = useRef(null);

  // Wrapper du dispatch pour capturer l'action
  const [state, baseDispatch] = useReducer(
    displayReducer,
    momentsData,
    getInitialState
  );

  const dispatch = useCallback((action) => {
    lastActionRef.current = action;
    baseDispatch(action);
  }, []);

  // ⭐ v2.15j : Logger après chaque changement d'état
  useEffect(() => {
    if (lastActionRef.current) {
      logDisplayState(state, lastActionRef.current);
    }
  }, [state]);

  // ========================================
  // ACTION CREATORS (wrapped pour éviter re-création)
  // ========================================

  const actions = useMemo(() => ({

    // Filtres de contenu
    toggleContentFilter: (filterKey) => {
      dispatch({ type: ACTIONS.TOGGLE_CONTENT_FILTER, payload: { filterKey } });
    },

    // ⭐ v2.17c : Toggle mode PhotoDePost
    togglePostPhotosOnly: () => {
      dispatch({ type: ACTIONS.TOGGLE_POST_PHOTOS_ONLY });
    },

    updateCounts: (counts) => {
      dispatch({ type: ACTIONS.UPDATE_COUNTS, payload: counts });
    },

    // Expansion
    toggleExpanded: (type, id) => {
      dispatch({ type: ACTIONS.TOGGLE_EXPANDED, payload: { type, id } });
    },

    expandAll: (type, ids) => {
      dispatch({ type: ACTIONS.EXPAND_ALL, payload: { type, ids } });
    },

    collapseAll: (type) => {
      dispatch({ type: ACTIONS.COLLAPSE_ALL, payload: { type } });
    },

    resetMomentChildren: (momentId, childPostIds, childPhotoGridIds) => {
      dispatch({
        type: ACTIONS.RESET_MOMENT_CHILDREN,
        payload: { momentId, childPostIds, childPhotoGridIds }
      });
    },

    // Filtres contextuels
    setSearchQuery: (query) => {
      dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query });
    },

    setSelectedTheme: (theme) => {
      dispatch({ type: ACTIONS.SET_SELECTED_THEME, payload: theme });
    },

    setMomentFilter: (filter) => {
      dispatch({ type: ACTIONS.SET_MOMENT_FILTER, payload: filter });
    },

    setHasLinksFilter: (value) => {
      dispatch({ type: ACTIONS.SET_HAS_LINKS_FILTER, payload: value });
    },

    setHasSessionsFilter: (value) => {
      dispatch({ type: ACTIONS.SET_HAS_SESSIONS_FILTER, payload: value });
    },

    // Tri
    setSortOrder: (order) => {
      dispatch({ type: ACTIONS.SET_SORT_ORDER, payload: order });
    },

    // UI
    triggerShake: (filterKey) => {
      dispatch({ type: ACTIONS.TRIGGER_SHAKE, payload: filterKey });
      // Auto-clear après 500ms
      setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_SHAKE });
      }, 500);
    },

    // Batch
    hydrateFromStorage: (data) => {
      dispatch({ type: ACTIONS.HYDRATE_FROM_STORAGE, payload: data });
    },

    resetAll: (momentsData) => {
      dispatch({ type: ACTIONS.RESET_ALL, payload: { momentsData } });
    }

  }), []);

  // ========================================
  // COMPUTED VALUES (mémoïsés)
  // ========================================

  const computed = useMemo(() => ({

    // Mode d'affichage
    isStructureMode: state.contentFilters.structure,
    isFlatMode: !state.contentFilters.structure,

    // ⭐ v2.19g : États "tous dépliés" (pour boutons TopBar)
    // Retournent l'état du déploiement GLOBAL (pas des sélections individuelles)
    allMomentsExpanded: () => state.globalExpansion.moments,
    allPostsExpanded: () => state.globalExpansion.posts,
    allPhotoGridsExpanded: () => state.globalExpansion.photoGrids,

    // ⭐ v2.19g : Helpers expansion (contenu visible)
    // MODE GLOBAL: Ouvert SAUF si exception (dans expanded)
    // MODE INDIVIDUEL: Ouvert SI dans expanded
    isMomentExpanded: (id) => {
      if (state.globalExpansion.moments) {
        // Mode global : Tous ouverts SAUF exceptions
        return !state.expanded.moments.has(id);
      } else {
        // Mode individuel : Ouverts SI dans set
        return state.expanded.moments.has(id);
      }
    },
    // ⭐ v2.21b3 : FIX - Même logique que moments (permet repli individuel en mode global)
    isPostExpanded: (id) => {
      if (state.globalExpansion.posts) {
        // Mode global (DT=1) : Tous ouverts SAUF exceptions
        return !state.expanded.posts.has(id);
      } else {
        // Mode individuel (DT=0) : Ouverts SI dans set
        return state.expanded.posts.has(id);
      }
    },
    isPhotoGridExpanded: (id) => {
      if (state.globalExpansion.photoGrids) {
        // Mode global (DP=1) : Tous ouverts SAUF exceptions
        return !state.expanded.photoGrids.has(id);
      } else {
        // Mode individuel (DP=0) : Ouverts SI dans set
        return state.expanded.photoGrids.has(id);
      }
    },

    // ⭐ v2.19g : NOUVEAU - Helpers sélection (cadre bleu)
    // Retourne true si l'élément est le dernier cliqué (sélection visuelle)
    isMomentSelected: (id) => state.selected.moment === id,
    isPostSelected: (id) => state.selected.post === id,
    isPhotoGridSelected: (id) => state.selected.photoGrid === id,

    // Visibilité éléments (selon filtres) - v2.14 nomenclature
    isElementVisible: (elementType) => {
      switch (elementType) {
        case 'moment_header':
          return state.contentFilters.structure;

        case 'post_header':
        case 'post_text':
          return state.contentFilters.textes;

        case 'post_photos':
          // ⭐ v2.30 : FIX - Logique simplifiée et cohérente
          // Photos de post visibles si :
          // - Textes actif (posts visibles, donc leurs photos aussi)
          // - OU Images actif (photos visibles)
          // - OU mode PhotoDePost actif (mode spécial AM=0 ET AT=0)
          return state.contentFilters.textes || state.contentFilters.images || state.postPhotosOnlyMode;

        case 'day_photos':
          return state.contentFilters.images;

        default:
          return true;
      }
    },

    // Filtres actifs - v2.14
    hasActiveFilters: () => {
      return (
        state.searchQuery.trim() !== '' ||
        state.selectedTheme !== null ||
        state.momentFilter !== 'all' ||
        state.hasLinksFilter !== null ||
        state.hasSessionsFilter !== null ||
        !state.contentFilters.structure ||
        !state.contentFilters.textes ||
        !state.contentFilters.images
      );
    }

  }), [state]);

  // Context value
  const value = useMemo(() => ({
    state,
    actions,
    computed
  }), [state, actions, computed]);

  // ⭐ v2.15j : Exposer context sur window pour accès global (MomentHeader, etc.)
  useEffect(() => {
    window.memoriesDisplayContext = { state, actions, computed };
    return () => {
      delete window.memoriesDisplayContext;
    };
  }, [state, actions, computed]);

  // ⭐ v2.31b : Auto-save/restore déplacé vers MemoriesPage.jsx
  // (via NavigationStateManager pour coordination avec scroll)

  return (
    <MemoriesDisplayContext.Provider value={value}>
      {children}
    </MemoriesDisplayContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useMemoriesDisplay() {
  const context = useContext(MemoriesDisplayContext);

  if (!context) {
    throw new Error('useMemoriesDisplay must be used within MemoriesDisplayProvider');
  }

  return context;
}

// ========================================
// EXPORT
// ========================================

export default MemoriesDisplayContext;
