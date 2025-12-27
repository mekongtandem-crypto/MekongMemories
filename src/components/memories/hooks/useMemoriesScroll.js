/**
 * useMemoriesScroll.js v7.1 - Navigation State Management
 * Hook pour gérer le scroll et la navigation dans MemoriesPage
 *
 * Gère :
 * - Scroll automatique vers moment/post/photo
 * - Navigation depuis contexte externe (ChatPage, notification)
 * - Header sticky show/hide
 * - Refs vers éléments DOM
 * ⭐ v2.31 : Sauvegarde/restauration scroll position
 */

import { useRef, useCallback, useEffect } from 'react';
import { navigationStateManager } from '../../../core/NavigationStateManager.js';

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
    const element = momentRefs.current[momentId];
    if (element) {
      executeScrollToElement(element);
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
  // ⭐ v2.31 : SAVE/RESTORE SCROLL POSITION
  // ========================================

  /**
   * Sauvegarder scroll position actuelle
   * Appelée automatiquement lors de la navigation vers autre page
   */
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = scrollContainerRef.current.scrollTop;
      return scrollPosition;
    }
    return 0;
  }, []);

  /**
   * Restaurer scroll position
   * Option B : Scroll vers élément sélectionné si existant, sinon position exacte
   */
  const restoreScrollPosition = useCallback((scrollPosition, selectedMomentId) => {
    if (!scrollContainerRef.current) return;

    // Option B : Priorité à l'élément sélectionné
    if (selectedMomentId && momentRefs.current[selectedMomentId]) {
      setTimeout(() => {
        const element = momentRefs.current[selectedMomentId];
        if (element) {
          executeScrollToElement(element);
        }
      }, 150);
    } else if (scrollPosition > 0) {
      // Fallback : Position exacte
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [executeScrollToElement]);

  // ⭐ v2.31 : Exposer fonction de sauvegarde sur window (pour NavigationStateManager)
  useEffect(() => {
    window.memoriesPageSaveState = () => ({
      scroll: saveScrollPosition()
    });

    return () => {
      delete window.memoriesPageSaveState;
    };
  }, [saveScrollPosition]);

  // ⭐ v2.31 : Restaurer scroll au montage
  useEffect(() => {
    const savedState = navigationStateManager.restorePageState('memories');
    if (savedState?.scroll) {
      restoreScrollPosition(savedState.scroll, savedState.selected?.moment);
    }
  }, []); // Une seule fois au montage

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
    handleScroll,

    // ⭐ v2.31 : Save/restore functions
    saveScrollPosition,
    restoreScrollPosition
  };
}
