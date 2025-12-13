/**
 * useMemoriesScroll.js v7.0
 * Hook pour gérer le scroll et la navigation dans MemoriesPage
 * 
 * Gère :
 * - Scroll automatique vers moment/post/photo
 * - Navigation depuis contexte externe (ChatPage, notification)
 * - Header sticky show/hide
 * - Refs vers éléments DOM
 */

import { useRef, useCallback, useEffect } from 'react';

export function useMemoriesScroll(navigationContext, onNavigateBack) {
  
  // ========================================
  // REFS
  // ========================================
  
  const scrollContainerRef = useRef(null);
  const momentRefs = useRef({});
  const navigationProcessedRef = useRef(null);
  
  // ========================================
  // SCROLL UTILITIES
  // ========================================
  
  const executeScrollToElement = useCallback((element) => {
    const topBarElement = document.querySelector('.fixed.top-0.z-40');
    const scrollContainer = scrollContainerRef.current;

    if (element && topBarElement && scrollContainer) {
      const topBarHeight = topBarElement.offsetHeight;
      const offsetPosition = element.offsetTop - topBarHeight - 64;

      // ⭐ v2.14s : Scroll sans smooth pour éviter conflits
      scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: 'auto',  // Changé de 'smooth' à 'auto'
      });
    }
  }, []);
  
  const scrollToMoment = useCallback((momentId) => {
    console.log('🎲 [scrollToMoment] Recherche moment:', momentId);
    const element = momentRefs.current[momentId];
    console.log('🎲 [scrollToMoment] Element trouvé dans refs?', !!element);
    console.log('🎲 [scrollToMoment] Refs disponibles:', Object.keys(momentRefs.current));
    if (element) {
      executeScrollToElement(element);
      console.log('🎲 [scrollToMoment] Scroll exécuté!');
    } else {
      console.error('❌ [scrollToMoment] Aucun element pour momentId:', momentId);
    }
  }, [executeScrollToElement]);
  
  const scrollToTop = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, []);
  
  // ========================================
  // REGISTER/UNREGISTER REFS
  // ========================================
  
  const registerMomentRef = useCallback((momentId, element) => {
    if (element) {
      momentRefs.current[momentId] = element;
    } else {
      delete momentRefs.current[momentId];
    }
  }, []);
  
  // ========================================
  // NAVIGATION CONTEXT HANDLER
  // ========================================
  
  useEffect(() => {
  if (!navigationContext) return;
  
  // Éviter traitement multiple
  const contextKey = JSON.stringify(navigationContext);
  if (navigationProcessedRef.current === contextKey) return;
  
  navigationProcessedRef.current = contextKey;
  
  // Traiter selon type de navigation
  if (navigationContext.type === 'moment') {
    // Navigation vers un moment spécifique
    setTimeout(() => {
      scrollToMoment(navigationContext.momentId);
    }, 300);
  } else if (navigationContext.type === 'photo') {
    // Navigation vers une photo (via moment parent)
    if (navigationContext.momentId) {
      setTimeout(() => {
        scrollToMoment(navigationContext.momentId);
      }, 300);
    }
  }
  
  // Pas de cleanup automatique - évite le retour arrière involontaire
}, [navigationContext, scrollToMoment, onNavigateBack]);
  
  // ========================================
  // HEADER STICKY SHOW/HIDE
  // ========================================
  
  // Note: Cette fonctionnalité est optionnelle
  // À implémenter si nécessaire pour masquer header au scroll
  const handleScroll = useCallback((e) => {
    // const currentScrollY = e.target.scrollTop;
    // Logique show/hide header si besoin
  }, []);
  
  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Refs
    scrollContainerRef,
    momentRefs,
    
    // Scroll functions
    scrollToMoment,
    scrollToTop,
    executeScrollToElement,
    
    // Ref management
    registerMomentRef,
    
    // Scroll handler
    handleScroll
  };
}
