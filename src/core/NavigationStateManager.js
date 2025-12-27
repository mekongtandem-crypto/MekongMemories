/**
 * NavigationStateManager.js v1.0 - Gestion centralisée navigation & état
 *
 * ⭐ v2.31 : Système de préservation d'état intelligent
 *
 * Fonctionnalités :
 * - Sauvegarde automatique état par page (filtres, scroll, sélection)
 * - Stack de navigation pour retour intelligent
 * - Persistance localStorage avec TTL (7 jours)
 * - API simple pour tous les composants
 *
 * Pages supportées :
 * - memories : Filtres, expansion, scroll, sélection
 * - sessions : Sort, filtres, scroll
 * - chat : Scroll, draft message
 */

import { logger } from '../utils/logger.js';

// ========================================
// CONFIGURATION
// ========================================

const STORAGE_KEY = 'mekong_navigation_state';
const STATE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

// ========================================
// CLASS NavigationStateManager
// ========================================

class NavigationStateManager {
  constructor() {
    this.storageKey = STORAGE_KEY;
    this.state = this.loadFromStorage();
    this.pageStack = []; // Stack de navigation pour retour intelligent

    logger.info('📍 NavigationStateManager initialized');
  }

  // ========================================
  // SAVE & RESTORE
  // ========================================

  /**
   * Sauvegarder état d'une page
   * @param {string} pageName - 'memories' | 'sessions' | 'chat'
   * @param {object} pageState - État à sauvegarder
   */
  savePageState(pageName, pageState) {
    this.state[pageName] = {
      ...pageState,
      timestamp: new Date().toISOString()
    };

    this.persistToStorage();

    logger.debug(`📍 State saved for page: ${pageName}`, {
      keys: Object.keys(pageState)
    });
  }

  /**
   * Restaurer état d'une page
   * @param {string} pageName - 'memories' | 'sessions' | 'chat'
   * @returns {object|null} État restauré ou null
   */
  restorePageState(pageName) {
    const savedState = this.state[pageName];

    if (!savedState) {
      logger.debug(`📍 No saved state for page: ${pageName}`);
      return null;
    }

    // Vérifier expiration (7 jours)
    const timestamp = new Date(savedState.timestamp).getTime();
    const now = Date.now();
    const age = now - timestamp;

    if (age > STATE_TTL) {
      logger.warn(`📍 Expired state for page: ${pageName} (${Math.round(age / 1000 / 60 / 60 / 24)} days old)`);
      delete this.state[pageName];
      this.persistToStorage();
      return null;
    }

    logger.debug(`📍 State restored for page: ${pageName}`, {
      age: `${Math.round(age / 1000 / 60)} minutes`
    });

    return savedState;
  }

  /**
   * Effacer état d'une page
   * @param {string} pageName
   */
  clearPageState(pageName) {
    if (this.state[pageName]) {
      delete this.state[pageName];
      this.persistToStorage();
      logger.info(`📍 State cleared for page: ${pageName}`);
    }
  }

  // ========================================
  // NAVIGATION STACK
  // ========================================

  /**
   * Naviguer vers une page (avec sauvegarde auto de la page actuelle)
   * @param {string} fromPage - Page actuelle
   * @param {string} toPage - Page destination
   * @param {object} context - Contexte de navigation
   */
  navigateTo(fromPage, toPage, context = {}) {
    // Sauvegarder état de la page actuelle (si fonction exposée)
    if (fromPage && window[`${fromPage}PageSaveState`]) {
      try {
        const currentState = window[`${fromPage}PageSaveState`]();
        this.savePageState(fromPage, currentState);
      } catch (error) {
        logger.error(`📍 Error saving state for ${fromPage}:`, error);
      }
    }

    // Ajouter à la stack
    this.pageStack.push({
      from: fromPage,
      to: toPage,
      context,
      timestamp: new Date().toISOString()
    });

    logger.debug(`📍 Navigation: ${fromPage} → ${toPage}`, {
      stackDepth: this.pageStack.length
    });

    return context;
  }

  /**
   * Retour vers page précédente
   * @returns {object|null} { page, state } ou null
   */
  goBack() {
    if (this.pageStack.length === 0) {
      logger.warn('📍 Cannot go back: empty navigation stack');
      return null;
    }

    const previous = this.pageStack.pop();

    logger.debug(`📍 Going back: ${previous.to} → ${previous.from}`);

    return {
      page: previous.from,
      state: this.restorePageState(previous.from),
      context: previous.context
    };
  }

  /**
   * Obtenir profondeur de la stack
   */
  getStackDepth() {
    return this.pageStack.length;
  }

  /**
   * Effacer la stack de navigation
   */
  clearStack() {
    this.pageStack = [];
    logger.info('📍 Navigation stack cleared');
  }

  // ========================================
  // PERSISTENCE
  // ========================================

  /**
   * Sauvegarder dans localStorage
   */
  persistToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      logger.error('📍 Error persisting to localStorage:', error);
    }
  }

  /**
   * Charger depuis localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      logger.error('📍 Error loading from localStorage:', error);
      return {};
    }
  }

  // ========================================
  // CLEANUP
  // ========================================

  /**
   * Nettoyer états expirés (> 7 jours)
   * À appeler périodiquement ou au démarrage
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    Object.keys(this.state).forEach(pageName => {
      const timestamp = this.state[pageName]?.timestamp;

      if (timestamp) {
        const age = now - new Date(timestamp).getTime();

        if (age > STATE_TTL) {
          delete this.state[pageName];
          cleanedCount++;
        }
      } else {
        // Pas de timestamp = ancien format, supprimer
        delete this.state[pageName];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.persistToStorage();
      logger.info(`📍 Cleanup: ${cleanedCount} expired state(s) removed`);
    }
  }

  /**
   * Reset complet (tout effacer)
   */
  reset() {
    this.state = {};
    this.pageStack = [];
    this.persistToStorage();
    logger.warn('📍 Complete reset: all states cleared');
  }

  // ========================================
  // DEBUG
  // ========================================

  /**
   * Afficher état complet (debug)
   */
  debug() {
    console.log('📍 NavigationStateManager Debug:');
    console.log('  Saved states:', Object.keys(this.state));
    console.log('  Stack depth:', this.pageStack.length);
    console.log('  Full state:', this.state);
    console.log('  Stack:', this.pageStack);
  }
}

// ========================================
// EXPORT SINGLETON
// ========================================

export const navigationStateManager = new NavigationStateManager();

// Cleanup au chargement
navigationStateManager.cleanup();

// Exposer globalement pour debug
if (typeof window !== 'undefined') {
  window.navigationStateManager = navigationStateManager;
}

export default navigationStateManager;
