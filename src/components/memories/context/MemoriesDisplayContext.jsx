/**
 * MemoriesDisplayContext.jsx v2.19d - Debug logs allMomentsExpanded
 *
 * Architecture centralisée pour gérer TOUT l'affichage de MemoriesPage:
 * - Filtres de contenu (Structure/Textes/Images)
 * - États expansion (moments/posts/photoGrids)
 * - Filtres contextuels (recherche, thème, etc.)
 * - Tri (chronologique, aléatoire, richesse)
 *
 * ✅ v2.19d : Logs debug pour diagnostiquer bouton DM
 * ✅ v2.19c : allMomentsExpanded compte seulement moments visibles
 * ✅ v2.19a : isElementVisible post_photos mode spécial AM=0 AT=0
 * ✅ Zero polling + Single source of truth
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { generatePostKey } from '../../../utils/themeUtils.js';

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

  return {
    // ⭐ v2.14 : Filtres de contenu (nomenclature validée)
    contentFilters: {
      structure: true,  // ✨ En-têtes moments (ex "Moments")
      textes: true,     // 🗒️ Posts complets (ex "Posts")
      images: true      // 📸 Photos (ex "Photos")
    },

    // ⭐ v2.17c : Mode spécial PhotoDePost (AM=0 ET AT=0)
    postPhotosOnlyMode: false,  // Si true, affiche SEULEMENT les photos de posts (pas les posts eux-mêmes)

    // États expansion
    expanded: {
      moments: new Set(),                    // Moments ouverts (accordion fermé par défaut)
      posts: new Set(allPostIds),            // TOUS posts dépliés par défaut
      photoGrids: new Set(allPhotoGridIds)   // TOUTES grilles dépliées par défaut
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

      const newSet = new Set(ids);
      console.log('🔧 [Context] EXPAND_ALL:', type, 'IDs count:', ids?.length || 0, '→ Set size:', newSet.size);

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [type]: newSet
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

    // États "tous dépliés" (pour boutons TopBar)
    // ⭐ v2.19d : FIX - Compter seulement les moments visibles (filtrés) + Debug
    allMomentsExpanded: (allMomentIds) => {
      if (!allMomentIds || allMomentIds.length === 0) return false;
      // Compter seulement les moments expanded qui sont aussi dans allMomentIds
      const expandedMomentsList = [...state.expanded.moments];
      const visibleExpandedCount = expandedMomentsList.filter(id =>
        allMomentIds.includes(id)
      ).length;
      const result = visibleExpandedCount === allMomentIds.length;

      console.log('🔍 allMomentsExpanded:', {
        allMomentIds: allMomentIds.slice(0, 3),
        totalMoments: allMomentIds.length,
        expandedAll: expandedMomentsList.slice(0, 3),
        expandedAllSize: state.expanded.moments.size,
        visibleExpandedCount,
        result
      });

      return result;
    },

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
          // ⭐ v2.19a : Mode spécial AM=0 AT=0 → DT contrôle photos de posts
          if (!state.contentFilters.structure && !state.contentFilters.textes) {
            return state.postPhotosOnlyMode;  // DT contrôle en mode photos seulement
          }
          // Cas normal → AP contrôle
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

  // ⭐ v2.15j : Exposer context sur window pour accès global (MomentHeader, etc.)
  useEffect(() => {
    window.memoriesDisplayContext = { state, actions, computed };
    return () => {
      delete window.memoriesDisplayContext;
    };
  }, [state, actions, computed]);

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
