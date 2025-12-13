/**
 * useMemoriesFilters.js v7.1 - Filtres de contenu additifs
 * Hook pour gérer le filtrage et le tri des moments
 *
 * Gère :
 * - ⭐ v2.11 : Filtres de contenu additifs (✨📷🗒️🖼️)
 * - Filtres globaux TopBar (types, contexte)
 * - Recherche textuelle
 * - Filtre par thème
 * - Tri (chronologique, aléatoire, richesse)
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  generatePostKey,
  generatePhotoMomentKey,
  generatePhotoMastodonKey
} from '../../../utils/themeUtils.js';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.14

export function useMemoriesFilters(momentsData, sessions = []) {

  // ========================================
  // ⭐ v2.14 : FILTRES DEPUIS CONTEXT (plus de useState local)
  // ========================================

  const { state, actions } = useMemoriesDisplay();

  // ⭐ v2.14 : Mapper nouvelles clés Context → anciennes clés pour compatibilité
  const contentFilters = {
    moments: state.contentFilters.structure,  // Structure → moments
    posts: state.contentFilters.textes,       // Textes → posts
    photos: state.contentFilters.images       // Images → photos
  };

  // ⭐ v2.14 : Wrapper pour compatibilité (appelle Context actions)
  const toggleContentFilter = useCallback((filterKey) => {
    const contextKey = {
      moments: 'structure',
      posts: 'textes',
      photos: 'images'
    }[filterKey];

    if (contextKey) {
      actions.toggleContentFilter(contextKey);
    }
  }, [actions]);

  // Compteur de clics sur dernier filtre (pour message humoristique)
  const lastFilterClickCount = useRef(0);
  const lastFilterClickTimer = useRef(null);

  // Déterminer si un élément est visible selon filtres
  const isElementVisible = useCallback((elementType) => {
    switch (elementType) {

      case 'moment_header':
        // ✨ En-têtes moments
        return contentFilters.moments;

      case 'moment_expandable':
        // Moment expandable seulement si ✨ actif
        return contentFilters.moments;

      case 'post_header':
        // 🗒️ Header du post (visible si posts actif)
        return contentFilters.posts;

      case 'post_text':
        // 🗒️ Texte du post (visible si posts actif)
        return contentFilters.posts;

      case 'post_photos':
        // ⭐ v2.17c : Photos de post visibles si :
        // - 🗒️ posts OU 📸 photos (logique normale)
        // - OU mode PhotoDePost actif (AM=0 ET AT=0, DT gère cet affichage)
        return contentFilters.posts || contentFilters.photos || state.postPhotosOnlyMode;

      case 'day_photos':
        // 📸 Photos de moment (visible si photos actif)
        return contentFilters.photos;

      default:
        return true;
    }
  }, [contentFilters, state.postPhotosOnlyMode]);

  // Calculer stats visibles pour un moment selon filtres actifs
  const getVisibleStats = useCallback((moment) => {
    if (!moment) return { posts: 0, dayPhotos: 0, momentHeader: 0, totalVisible: 0 };

    const stats = {
      posts: 0,
      dayPhotos: 0,
      momentHeader: 0,
      totalVisible: 0
    };

    // ⭐ v2.14o : Compatibilité nomenclature ancienne (moments/posts/photos) ET nouvelle (structure/textes/images)
    const structureOn = contentFilters.structure || contentFilters.moments;
    const textesOn = contentFilters.textes || contentFilters.posts;
    const imagesOn = contentFilters.images || contentFilters.photos;

    // ✨ Headers moments (si structure actif)
    // ⚠️ v2.14c : FIX - Le header compte comme contenu visible!
    if (structureOn) {
      stats.momentHeader = 1;
    }

    // 🗒️ Posts complets (si textes actif ET moment a des posts)
    if (textesOn && moment.posts) {
      stats.posts = moment.posts.length;
    }

    // 📸 Photos moment (si images actif)
    if (imagesOn) {
      stats.dayPhotos = moment.dayPhotoCount || 0;
      // Ajouter aussi photos de posts si images actif
      if (moment.posts) {
        stats.dayPhotos += moment.posts.reduce((acc, p) => acc + (p.photos?.length || 0), 0);
      }
    }

    stats.totalVisible = stats.momentHeader + stats.posts + stats.dayPhotos;

    return stats;
  }, [contentFilters]);

  // Vérifier si un moment a du contenu visible
  const hasVisibleContent = useCallback((moment) => {
    const stats = getVisibleStats(moment);
    return stats.totalVisible > 0;
  }, [getVisibleStats]);

  // ========================================
  // ÉTATS FILTRES (existants)
  // ========================================

  // Filtres contextuels
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [momentFilter, setMomentFilter] = useState('all'); 
  // 'all' | 'unexplored' | 'with_posts' | 'with_photos'
  
  const [hasLinksFilter, setHasLinksFilter] = useState(null); 
  // null | true | false
  
  const [hasSessionsFilter, setHasSessionsFilter] = useState(null);
  // null | true | false
  
  // Tri
  const [sortOrder, setSortOrder] = useState('chronological');
  // 'chronological' | 'random' | 'richness'
  
  // ========================================
  // LOGIQUE FILTRAGE
  // ========================================
  
  const filteredMoments = useMemo(() => {
    if (!momentsData || momentsData.length === 0) return [];

    let filtered = [...momentsData];

    // ⭐ v2.11 : 0. Filtre par contenu visible
    // NOTE: On ne filtre JAMAIS complètement les moments selon le toggle ✨
    // Le toggle ✨ contrôle uniquement l'affichage des HEADERS dans MomentsList
    // Quand ✨ désactivé → FlatContentList affiche le contenu en vrac
    // La vérification hasVisibleContent() reste nécessaire pour éliminer moments vides
    filtered = filtered.filter(m => hasVisibleContent(m));

    // 1. Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.displayTitle.toLowerCase().includes(query) ||
        m.posts?.some(p => p.content && p.content.toLowerCase().includes(query))
      );
    }

    // 2. Filtre par type de moment
    if (momentFilter !== 'all') {
      const exploredIds = new Set(sessions?.map(s => s.gameId) || []);

      switch (momentFilter) {
        case 'unexplored':
          filtered = filtered.filter(m => !exploredIds.has(m.id));
          break;
        case 'with_posts':
          filtered = filtered.filter(m => m.posts?.length > 0);
          break;
        case 'with_photos':
          filtered = filtered.filter(m => m.dayPhotoCount > 0);
          break;
      }
    }

    // 3. Filtre par thème (radical = masquage complet)
    if (selectedTheme) {
      filtered = filtered.filter(moment => {
        // Vérifier posts
        const hasTaggedPost = moment.posts?.some(post => {
          const key = generatePostKey(post);
          const themes = window.themeAssignments?.getThemesForContent(key) || [];
          return themes.includes(selectedTheme);
        });
        
        // Vérifier photos moment
        const hasTaggedDayPhoto = moment.dayPhotos?.some(photo => {
          const key = generatePhotoMomentKey(photo);
          if (!key) return false;
          const themes = window.themeAssignments?.getThemesForContent(key) || [];
          return themes.includes(selectedTheme);
        });
        
        // Vérifier photos Mastodon
        const hasTaggedMastodonPhoto = moment.posts?.some(post => 
          post.photos?.some(photo => {
            const key = generatePhotoMastodonKey(photo);
            if (!key) return false;
            const themes = window.themeAssignments?.getThemesForContent(key) || [];
            return themes.includes(selectedTheme);
          })
        );
        
        return hasTaggedPost || hasTaggedDayPhoto || hasTaggedMastodonPhoto;
      });
    }
    
    // 4. Filtre par présence liens (à implémenter avec contentLinks)
    if (hasLinksFilter !== null) {
      // TODO: implémenter quand contentLinks sera intégré
      // filtered = filtered.filter(m => hasContentLinks(m) === hasLinksFilter);
    }
    
    // 5. Filtre par présence sessions
    if (hasSessionsFilter !== null) {
      const momentIdsWithSessions = new Set(
        sessions?.map(s => s.gameId) || []
      );
      filtered = filtered.filter(m =>
        momentIdsWithSessions.has(m.id) === hasSessionsFilter
      );
    }

    return filtered;
  }, [
    momentsData,
    hasVisibleContent,
    contentFilters,  // ⭐ v2.14g : FIX - Ajout dépendance manquante!
    searchQuery,
    momentFilter,
    selectedTheme,
    hasLinksFilter,
    hasSessionsFilter,
    sessions
  ]);

  // ========================================
  // LOGIQUE TRI
  // ========================================

  const sortedMoments = useMemo(() => {
    const moments = [...filteredMoments];
    
    switch (sortOrder) {
      case 'chronological':
        // Tri par défaut (déjà dans l'ordre du masterIndex)
        return moments;
        
      case 'random':
        // Tri aléatoire (avec seed basé sur la date pour stabilité)
        return moments.sort(() => Math.random() - 0.5);
        
      case 'richness':
        // Tri par richesse (nb posts + photos + sessions + liens)
        return moments.sort((a, b) => {
          const richnessA = calculateRichness(a, sessions);
          const richnessB = calculateRichness(b, sessions);
          return richnessB - richnessA;
        });
        
      default:
        return moments;
    }
  }, [filteredMoments, sortOrder, sessions]);

  // ⭐ v2.14i : Calculer counts ET IDs, les mettre à jour dans Context
  const counts = useMemo(() => {
    // Collecter tous les IDs depuis sortedMoments
    const allMomentIds = sortedMoments.map(m => m.id);
    const allPostIds = [];
    const allPhotoGridIds = [];

    sortedMoments.forEach(moment => {
      // Posts IDs
      moment.posts?.forEach(post => {
        if (post.id) allPostIds.push(generatePostKey(post));  // ✅ FIX: Passer post object, pas (moment.id, post.id)
      });

      // Photo grid IDs (grilles de photos, pas photos individuelles)
      // ⭐ v2.14s : Format unifié - moment.id pour photos de moment
      if (moment.dayPhotos?.length > 0) {
        allPhotoGridIds.push(moment.id);  // ✅ Même format que MomentCard (pas de préfixe)
      }
      // ⭐ v2.14s : post_${post.id} pour photos de post (match gridId dans PostArticle)
      moment.posts?.forEach(post => {
        if (post.photos?.length > 0) {
          allPhotoGridIds.push(`post_${post.id}`);  // ✅ Match gridId PostArticle
        }
      });
    });

    // ⭐ v2.15 : DÉDUPLIQUER les IDs pour éviter comptage erroné
    // (certains posts peuvent avoir des IDs dupliqués dans les données)
    const uniquePostIds = [...new Set(allPostIds)];
    const uniquePhotoGridIds = [...new Set(allPhotoGridIds)];

    return {
      filteredMomentsCount: sortedMoments.length,
      totalPostsCount: uniquePostIds.length,  // ✅ Compter seulement les IDs uniques
      momentsWithPhotosCount: sortedMoments.filter(m => m.dayPhotos?.length > 0).length,
      // ⭐ Ajout des IDs pour expandAll/collapseAll
      allMomentIds,
      allPostIds: uniquePostIds,  // ✅ Tableau dédupliqué
      allPhotoGridIds: uniquePhotoGridIds  // ✅ Tableau dédupliqué
    };
  }, [sortedMoments]);

  // Mettre à jour les counts dans le Context
  // ⚠️ v2.14m : Utiliser dépendances primitives pour éviter boucle infinie
  const {
    filteredMomentsCount,
    totalPostsCount,
    momentsWithPhotosCount,
    allMomentIds,
    allPostIds,
    allPhotoGridIds
  } = counts;

  useEffect(() => {
    actions.updateCounts({
      filteredMomentsCount,
      totalPostsCount,
      momentsWithPhotosCount,
      allMomentIds,
      allPostIds,
      allPhotoGridIds
    });
  }, [
    filteredMomentsCount,
    totalPostsCount,
    momentsWithPhotosCount,
    allMomentIds.length,
    allPostIds.length,
    allPhotoGridIds.length
  ]);

  // ========================================
  // HELPERS
  // ========================================
  
  const calculateRichness = (moment, sessions) => {
    const postCount = moment.posts?.length || 0;
    const photoCount = moment.photoCount || 0;
    const sessionCount = sessions?.filter(s => s.gameId === moment.id).length || 0;
    // TODO: ajouter contentLinks count
    
    return postCount * 3 + photoCount + sessionCount * 5;
  };
  
  // ========================================
  // HELPERS POUR COMPOSANTS
  // ========================================

  // ⭐ v2.11 : Fonction legacy maintenue pour compatibilité
  // Redirige vers isElementVisible avec mapping des types
  const shouldShowElement = useCallback((type) => {
    // type: 'moment' | 'post' | 'photo'

    // Mapping ancien système → nouveau
    switch (type) {
      case 'moment':
        return contentFilters.moments;
      case 'post':
        return contentFilters.textes || contentFilters.images;
      case 'photo':
        return contentFilters.photos || contentFilters.images;
      default:
        return true;
    }
  }, [contentFilters]);
  
  const isFilterActive = useCallback(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedTheme !== null ||
      momentFilter !== 'all' ||
      hasLinksFilter !== null ||
      hasSessionsFilter !== null ||
      !contentFilters.moments ||
      !contentFilters.posts ||
      !contentFilters.photos
    );
  }, [
    searchQuery,
    selectedTheme,
    momentFilter,
    hasLinksFilter,
    hasSessionsFilter,
    contentFilters
  ]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTheme(null);
    setMomentFilter('all');
    setHasLinksFilter(null);
    setHasSessionsFilter(null);
    setContentFilters({
      moments: true,
      posts: true,
      photos: true
    });
  }, []);

  // ========================================
  // RETURN
  // ========================================

  return {
    // Moments filtrés et triés
    moments: sortedMoments,

    // ⭐ v2.11 : Filtres de contenu additifs
    contentFilters,
    toggleContentFilter,
    isElementVisible,
    getVisibleStats,
    hasVisibleContent,

    // États filtres (legacy, conservés pour compatibilité)
    searchQuery,
    selectedTheme,
    momentFilter,
    hasLinksFilter,
    hasSessionsFilter,
    sortOrder,

    // Setters
    setSearchQuery,
    setSelectedTheme,
    setMomentFilter,
    setHasLinksFilter,
    setHasSessionsFilter,
    setSortOrder,

    // Helpers
    shouldShowElement,
    isFilterActive,
    clearAllFilters,

    // Stats
    totalMoments: momentsData?.length || 0,
    filteredCount: sortedMoments.length
  };
}
