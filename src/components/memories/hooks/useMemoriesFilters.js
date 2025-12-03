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

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  generatePostKey,
  generatePhotoMomentKey,
  generatePhotoMastodonKey
} from '../../../utils/themeUtils.js';

export function useMemoriesFilters(momentsData, sessions = []) {

  // ========================================
  // ⭐ v2.11 : FILTRES DE CONTENU ADDITIFS (3 boutons)
  // ========================================

  // Charger depuis localStorage ou utiliser défauts
  const [contentFilters, setContentFilters] = useState(() => {
    const saved = localStorage.getItem('mekong_content_filters');
    return saved ? JSON.parse(saved) : {
      moments: true,   // ✨ En-têtes moments
      posts: true,     // 🗒️ Posts complets (header + texte + photos post)
      photos: true     // 📸 Toutes photos (moment + post, sans decoration)
    };
  });

  // Compteur de clics sur dernier filtre (pour message humoristique)
  const lastFilterClickCount = useRef(0);
  const lastFilterClickTimer = useRef(null);

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    console.log('🔧 [useMemoriesFilters] contentFilters changed:', contentFilters);
    localStorage.setItem('mekong_content_filters', JSON.stringify(contentFilters));
  }, [contentFilters]);

  // Toggle un filtre (avec protection minimum 1)
  const toggleContentFilter = useCallback((filterKey) => {
    console.log('🎯 [useMemoriesFilters] toggleContentFilter called:', filterKey);
    setContentFilters(prev => {
      console.log('📊 [useMemoriesFilters] Previous state:', prev);
      const newState = { ...prev, [filterKey]: !prev[filterKey] };
      console.log('📊 [useMemoriesFilters] New state (before validation):', newState);

      // ⚠️ Empêcher de tout désactiver
      const hasAtLeastOne = Object.values(newState).some(v => v === true);

      if (!hasAtLeastOne) {
        console.warn('⚠️ [useMemoriesFilters] Cannot disable all filters - keeping previous state');
        // Compter les clics rapides
        lastFilterClickCount.current += 1;

        // Reset après 2 secondes
        clearTimeout(lastFilterClickTimer.current);
        lastFilterClickTimer.current = setTimeout(() => {
          lastFilterClickCount.current = 0;
        }, 2000);

        // Message après 3 clics
        if (lastFilterClickCount.current >= 3) {
          console.log('😊 Au moins un filtre doit rester actif pour afficher les souvenirs !');
          lastFilterClickCount.current = 0;
        }

        return prev; // Annuler le changement
      }

      // Reset compteur si changement réussi
      lastFilterClickCount.current = 0;
      console.log('✅ [useMemoriesFilters] Filter toggled successfully:', newState);
      return newState;
    });
  }, []);

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
        // Photos de post visibles si 🗒️ posts OU 📸 photos
        return contentFilters.posts || contentFilters.photos;

      case 'day_photos':
        // 📸 Photos de moment (visible si photos actif)
        return contentFilters.photos;

      default:
        return true;
    }
  }, [contentFilters]);

  // Calculer stats visibles pour un moment selon filtres actifs
  const getVisibleStats = useCallback((moment) => {
    if (!moment) return { posts: 0, dayPhotos: 0, totalVisible: 0 };

    const stats = {
      posts: 0,
      dayPhotos: 0,
      totalVisible: 0
    };

    // 🗒️ Posts complets (si posts actif ET moment a des posts)
    if (contentFilters.posts && moment.posts) {
      stats.posts = moment.posts.length;
    }

    // 📸 Photos moment (si photos actif)
    if (contentFilters.photos) {
      stats.dayPhotos = moment.dayPhotoCount || 0;
      // Ajouter aussi photos de posts si photos actif
      if (moment.posts) {
        stats.dayPhotos += moment.posts.reduce((acc, p) => acc + (p.photos?.length || 0), 0);
      }
    }

    stats.totalVisible = stats.posts + stats.dayPhotos;

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
