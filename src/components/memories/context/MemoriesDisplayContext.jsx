/**
 * MemoriesDisplayContext.jsx v2.14 - Context + Reducer pour affichage
 *
 * Architecture centralisée pour gérer TOUT l'affichage de MemoriesPage:
 * - Filtres de contenu (Structure/Textes/Images)
 * - États expansion (moments/posts/photoGrids)
 * - Filtres contextuels (recherche, thème, etc.)
 * - Tri (chronologique, aléatoire, richesse)
 *
 * ✅ Zero polling (reactivity native React)
 * ✅ Zero props drilling (useContext)
 * ✅ Single source of truth
 * ✅ Predictable updates (reducer pattern)
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

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
 */
export const getInitialState = (momentsData = []) => {
  // Collecter tous les IDs de posts et photoGrids pour déplier par défaut
  const allPostIds = [];
  const allPhotoGridIds = [];

  momentsData.forEach(moment => {
    // Posts avec ID
    if (moment.posts) {
      moment.posts.forEach(post => {
        if (post.id) allPostIds.push(post.id);
      });
    }

    // Grilles photos (identifiées par moment.id)
    if (moment.dayPhotos && moment.dayPhotos.length > 0) {
      allPhotoGridIds.push(moment.id);
    }
  });

  return {
    // ⭐ v2.14 : Filtres de contenu (nomenclature validée)
    contentFilters: {
      structure: true,  // ✨ En-têtes moments (ex "Moments")
      textes: true,     // 🗒️ Posts complets (ex "Posts")
      images: true      // 📸 Photos (ex "Photos")
    },

    // États expansion
    expanded: {
      moments: new Set(),                    // Moments ouverts (accordion fermé par défaut)
      posts: new Set(allPostIds),            // TOUS posts dépliés par défaut
      photoGrids: new Set(allPhotoGridIds)   // TOUTES grilles dépliées par défaut
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
};

// ========================================
// REDUCER ACTIONS
// ========================================

export const ACTIONS = {
  // Filtres de contenu
  TOGGLE_CONTENT_FILTER: 'TOGGLE_CONTENT_FILTER',

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

  // UI
  TRIGGER_SHAKE: 'TRIGGER_SHAKE',
  CLEAR_SHAKE: 'CLEAR_SHAKE',

  // Batch updates
  HYDRATE_FROM_STORAGE: 'HYDRATE_FROM_STORAGE',
  RESET_ALL: 'RESET_ALL'
};

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

    // ========================================
    // EXPANSION
    // ========================================

    case ACTIONS.TOGGLE_EXPANDED: {
      const { type, id } = action.payload; // type: 'moments' | 'posts' | 'photoGrids'

      const newSet = new Set(state.expanded[type]);

      if (newSet.has(id)) {
        newSet.delete(id);

        // ⭐ Si c'est un moment qui se ferme, replier ses enfants (Q3: Reset volets)
        if (type === 'moments') {
          // On retournera un état avec posts/photoGrids filtrés
          // (voir RESET_MOMENT_CHILDREN pour la logique complète)
          return {
            ...state,
            expanded: {
              ...state.expanded,
              moments: newSet
              // Posts et photoGrids seront nettoyés par RESET_MOMENT_CHILDREN
            }
          };
        }
      } else {
        newSet.add(id);
      }

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [type]: newSet
        }
      };
    }

    case ACTIONS.EXPAND_ALL: {
      const { type, ids } = action.payload; // ids: Array<string>

      console.log('🔧 [Context] EXPAND_ALL:', type, 'IDs count:', ids?.length || 0);

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [type]: new Set(ids)
        }
      };
    }

    case ACTIONS.COLLAPSE_ALL: {
      const { type } = action.payload;

      console.log('🔧 [Context] COLLAPSE_ALL:', type);

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [type]: new Set()
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
  const [state, dispatch] = useReducer(
    displayReducer,
    momentsData,
    getInitialState
  );

  // ========================================
  // ACTION CREATORS (wrapped pour éviter re-création)
  // ========================================

  const actions = useMemo(() => ({

    // Filtres de contenu
    toggleContentFilter: (filterKey) => {
      dispatch({ type: ACTIONS.TOGGLE_CONTENT_FILTER, payload: { filterKey } });
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

    // États "tous dépliés" (pour boutons TopBar)
    allMomentsExpanded: (totalCount) =>
      state.expanded.moments.size === totalCount && totalCount > 0,

    allPostsExpanded: (totalCount) =>
      state.expanded.posts.size >= totalCount && totalCount > 0,

    allPhotoGridsExpanded: (totalCount) =>
      state.expanded.photoGrids.size === totalCount && totalCount > 0,

    // Helpers expansion
    isMomentExpanded: (id) => state.expanded.moments.has(id),
    isPostExpanded: (id) => state.expanded.posts.has(id),
    isPhotoGridExpanded: (id) => state.expanded.photoGrids.has(id),

    // Visibilité éléments (selon filtres) - v2.14 nomenclature
    isElementVisible: (elementType) => {
      switch (elementType) {
        case 'moment_header':
          return state.contentFilters.structure;

        case 'post_header':
        case 'post_text':
          return state.contentFilters.textes;

        case 'post_photos':
          // ⭐ v2.14 : Photos posts visibles UNIQUEMENT si Images ON
          return state.contentFilters.images;

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
