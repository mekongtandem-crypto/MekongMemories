/**
 * useMemoriesFilters.js v7.0
 * Hook pour gérer le filtrage et le tri des moments
 * 
 * Gère :
 * - Filtres globaux TopBar (types, contexte)
 * - Recherche textuelle
 * - Filtre par thème
 * - Tri (chronologique, aléatoire, richesse)
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  generatePostKey, 
  generatePhotoMomentKey, 
  generatePhotoMastodonKey 
} from '../../../utils/themeUtils.js';

export function useMemoriesFilters(momentsData, sessions = []) {
  
  // ========================================
  // ÉTATS FILTRES
  // ========================================
  
  // Filtres par type (TopBar)
  const [showMoments, setShowMoments] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  
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
  
  const shouldShowElement = useCallback((type, momentId = null, hasOverride = false) => {
    // type: 'moment' | 'post' | 'photo'
    
    // Si override local actif, toujours afficher
    if (hasOverride) return true;
    
    // Sinon vérifier filtre global
    switch (type) {
      case 'moment':
        return showMoments;
      case 'post':
        return showPosts;
      case 'photo':
        return showPhotos;
      default:
        return true;
    }
  }, [showMoments, showPosts, showPhotos]);
  
  const isFilterActive = useCallback(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedTheme !== null ||
      momentFilter !== 'all' ||
      hasLinksFilter !== null ||
      hasSessionsFilter !== null ||
      !showMoments ||
      !showPosts ||
      !showPhotos
    );
  }, [
    searchQuery, 
    selectedTheme, 
    momentFilter, 
    hasLinksFilter, 
    hasSessionsFilter,
    showMoments,
    showPosts,
    showPhotos
  ]);
  
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTheme(null);
    setMomentFilter('all');
    setHasLinksFilter(null);
    setHasSessionsFilter(null);
    setShowMoments(true);
    setShowPosts(true);
    setShowPhotos(true);
  }, []);
  
  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Moments filtrés et triés
    moments: sortedMoments,
    
    // États filtres
    showMoments,
    showPosts,
    showPhotos,
    searchQuery,
    selectedTheme,
    momentFilter,
    hasLinksFilter,
    hasSessionsFilter,
    sortOrder,
    
    // Setters
    setShowMoments,
    setShowPosts,
    setShowPhotos,
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
