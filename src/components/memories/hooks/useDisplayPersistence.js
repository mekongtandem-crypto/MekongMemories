/**
 * useDisplayPersistence.js v2.14 - Persistance localStorage
 *
 * Hook pour synchroniser automatiquement l'état d'affichage avec localStorage
 *
 * ✅ Hydratation initiale au mount
 * ✅ Sauvegarde automatique avec debounce (300ms)
 * ✅ Migration depuis ancien format (mekong_volets_state)
 * ✅ Batching des updates
 */

import { useEffect, useRef } from 'react';

// ========================================
// CLÉS LOCALSTORAGE
// ========================================

const STORAGE_KEYS = {
  FILTERS: (userId) => `mekong_display_filters_${userId}`,
  EXPANDED: (userId) => `mekong_display_expanded_${userId}`,
  SORT: (userId) => `mekong_display_sort_${userId}`,

  // Anciennes clés (pour migration)
  LEGACY_VOLETS: (userId) => `mekong_volets_state_${userId}`,
  LEGACY_CONTENT_FILTERS: 'mekong_content_filters'
};

// ========================================
// HELPERS PERSISTANCE
// ========================================

/**
 * Convertir Sets en Arrays pour JSON.stringify
 */
function serializeExpanded(expanded) {
  return {
    moments: Array.from(expanded.moments),
    posts: Array.from(expanded.posts),
    photoGrids: Array.from(expanded.photoGrids)
  };
}

/**
 * Convertir Arrays en Sets depuis JSON.parse
 */
function deserializeExpanded(data) {
  if (!data) return null;

  return {
    moments: new Set(data.moments || []),
    posts: new Set(data.posts || []),
    photoGrids: new Set(data.photoGrids || [])
  };
}

/**
 * Migrer depuis ancien format (v2.13) vers nouveau (v2.14)
 */
function migrateFromLegacy(userId) {
  const migrated = {};

  // 1. Migrer filtres de contenu
  try {
    const oldFilters = localStorage.getItem(STORAGE_KEYS.LEGACY_CONTENT_FILTERS);
    if (oldFilters) {
      const parsed = JSON.parse(oldFilters);

      // Ancien format: { moments, posts, photos }
      // Nouveau format: { structure, textes, images }
      migrated.contentFilters = {
        structure: parsed.moments ?? true,
        textes: parsed.posts ?? true,
        images: parsed.photos ?? true
      };

      console.log('✅ Migrated content filters from legacy format');
    }
  } catch (e) {
    console.error('❌ Error migrating content filters:', e);
  }

  // 2. Migrer états volets
  try {
    const oldVolets = localStorage.getItem(STORAGE_KEYS.LEGACY_VOLETS(userId));
    if (oldVolets) {
      const parsed = JSON.parse(oldVolets);

      // Ancien format: { selectedMomentIds, expandedPostIds, expandedPhotoGridIds }
      // Nouveau format: { moments, posts, photoGrids }
      migrated.expanded = {
        moments: parsed.selectedMomentIds || [],
        posts: parsed.expandedPostIds || [],
        photoGrids: parsed.expandedPhotoGridIds || []
      };

      console.log('✅ Migrated volets state from legacy format');
    }
  } catch (e) {
    console.error('❌ Error migrating volets state:', e);
  }

  return Object.keys(migrated).length > 0 ? migrated : null;
}

/**
 * Charger état depuis localStorage
 */
function loadFromStorage(userId) {
  if (!userId) return null;

  try {
    // 1. Tenter migration depuis ancien format
    const migrated = migrateFromLegacy(userId);
    if (migrated) {
      // Sauvegarder dans nouveau format
      if (migrated.contentFilters) {
        localStorage.setItem(
          STORAGE_KEYS.FILTERS(userId),
          JSON.stringify(migrated.contentFilters)
        );
      }
      if (migrated.expanded) {
        localStorage.setItem(
          STORAGE_KEYS.EXPANDED(userId),
          JSON.stringify(migrated.expanded)
        );
      }

      // Cleanup anciennes clés
      localStorage.removeItem(STORAGE_KEYS.LEGACY_CONTENT_FILTERS);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_VOLETS(userId));

      return migrated;
    }

    // 2. Charger depuis nouveau format
    const data = {};

    const filtersStr = localStorage.getItem(STORAGE_KEYS.FILTERS(userId));
    if (filtersStr) {
      data.contentFilters = JSON.parse(filtersStr);
    }

    const expandedStr = localStorage.getItem(STORAGE_KEYS.EXPANDED(userId));
    if (expandedStr) {
      data.expanded = JSON.parse(expandedStr);
    }

    const sortStr = localStorage.getItem(STORAGE_KEYS.SORT(userId));
    if (sortStr) {
      data.sortOrder = sortStr;
    }

    return Object.keys(data).length > 0 ? data : null;

  } catch (e) {
    console.error('❌ Error loading from storage:', e);
    return null;
  }
}

/**
 * Sauvegarder état dans localStorage
 */
function saveToStorage(userId, state) {
  if (!userId) return;

  try {
    // Sauvegarder filtres
    localStorage.setItem(
      STORAGE_KEYS.FILTERS(userId),
      JSON.stringify(state.contentFilters)
    );

    // Sauvegarder expansion (convertir Sets → Arrays)
    localStorage.setItem(
      STORAGE_KEYS.EXPANDED(userId),
      JSON.stringify(serializeExpanded(state.expanded))
    );

    // Sauvegarder tri (Q2: Persistance tri = OUI)
    localStorage.setItem(
      STORAGE_KEYS.SORT(userId),
      state.sortOrder
    );

  } catch (e) {
    console.error('❌ Error saving to storage:', e);
  }
}

// ========================================
// HOOK
// ========================================

export function useDisplayPersistence(state, actions, userId) {
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef(null);

  // ========================================
  // HYDRATATION INITIALE
  // ========================================

  useEffect(() => {
    if (!userId) return;

    const stored = loadFromStorage(userId);
    if (stored) {
      console.log('🔄 Hydrating display state from localStorage:', stored);
      actions.hydrateFromStorage(stored);
    } else {
      console.log('📭 No stored display state found, using defaults');
    }

    isInitialMount.current = false;
  }, [userId, actions]);

  // ========================================
  // SAUVEGARDE AUTOMATIQUE (DEBOUNCED)
  // ========================================

  useEffect(() => {
    // Skip premier render (hydratation)
    if (isInitialMount.current) return;
    if (!userId) return;

    // Debounce: attendre 300ms après dernier changement avant sauvegarder
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log('💾 Saving display state to localStorage');
      saveToStorage(userId, state);
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    state.contentFilters,
    state.expanded,
    state.sortOrder,
    userId
  ]);

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    return () => {
      // Force save on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (userId) {
          saveToStorage(userId, state);
        }
      }
    };
  }, [userId, state]);
}

export default useDisplayPersistence;
