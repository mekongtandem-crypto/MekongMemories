/**
 * logger.js - Système de logging configurable
 * Permet de désactiver les logs debug en production
 * 
 * USAGE :
 * import { logger } from './utils/logger.js';
 * 
 * logger.debug('ContentLinks rebuild', { count: 10 });
 * logger.info('Session créée', sessionId);
 * logger.warn('Thème non trouvé', themeId);
 * logger.error('Erreur connexion', error);
 */

// Configuration
const DEBUG_MODE = 
  import.meta.env.DEV || // Mode développement Vite
  localStorage.getItem('mekong_debug_mode') === 'true' || // Toggle manuel
  window.location.search.includes('debug=true'); // URL param

// Couleurs console
const COLORS = {
  debug: 'color: #9ca3af; font-weight: normal',
  info: 'color: #3b82f6; font-weight: bold',
  warn: 'color: #f59e0b; font-weight: bold',
  error: 'color: #ef4444; font-weight: bold',
  success: 'color: #10b981; font-weight: bold'
};

// Emojis par niveau
const ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅'
};

/**
 * Formatte un objet pour affichage
 */
function formatData(data) {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
}

/**
 * Créer un timestamp pour les logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3 
  });
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Debug : Logs techniques détaillés (uniquement en dev)
   * @param {string} message - Message principal
   * @param {any} data - Données optionnelles
   */
  debug: (message, data = null) => {
    if (!DEBUG_MODE) return;
    
    const timestamp = getTimestamp();
    console.log(
      `%c${ICONS.debug} [${timestamp}] ${message}`,
      COLORS.debug,
      data !== null ? data : ''
    );
  },

  /**
   * Info : Événements importants (toujours affiché)
   * @param {string} message - Message principal
   * @param {any} data - Données optionnelles
   */
  info: (message, data = null) => {
    const timestamp = getTimestamp();
    console.log(
      `%c${ICONS.info} [${timestamp}] ${message}`,
      COLORS.info,
      data !== null ? data : ''
    );
  },

  /**
   * Warn : Avertissements (toujours affiché)
   * @param {string} message - Message principal
   * @param {any} data - Données optionnelles
   */
  warn: (message, data = null) => {
    const timestamp = getTimestamp();
    console.warn(
      `%c${ICONS.warn} [${timestamp}] ${message}`,
      COLORS.warn,
      data !== null ? data : ''
    );
  },

  /**
   * Error : Erreurs critiques (toujours affiché)
   * @param {string} message - Message principal
   * @param {any} data - Données optionnelles (souvent Error object)
   */
  error: (message, data = null) => {
    const timestamp = getTimestamp();
    console.error(
      `%c${ICONS.error} [${timestamp}] ${message}`,
      COLORS.error,
      data !== null ? data : ''
    );
    
    // Stack trace si c'est une Error
    if (data instanceof Error) {
      console.error('Stack:', data.stack);
    }
  },

  /**
   * Success : Confirmation opérations réussies (toujours affiché)
   * @param {string} message - Message principal
   * @param {any} data - Données optionnelles
   */
  success: (message, data = null) => {
    const timestamp = getTimestamp();
    console.log(
      `%c${ICONS.success} [${timestamp}] ${message}`,
      COLORS.success,
      data !== null ? data : ''
    );
  },

  /**
   * Group : Regrouper plusieurs logs
   * @param {string} label - Label du groupe
   * @param {Function} callback - Fonction contenant les logs
   */
  group: (label, callback) => {
    if (!DEBUG_MODE) {
      callback();
      return;
    }
    
    console.group(`📦 ${label}`);
    callback();
    console.groupEnd();
  },

  /**
   * Table : Afficher données tabulaires
   * @param {Array|Object} data - Données à afficher
   */
  table: (data) => {
    if (!DEBUG_MODE) return;
    console.table(data);
  },

  /**
   * Time : Mesurer durée d'exécution
   * @param {string} label - Label du timer
   */
  time: (label) => {
    if (!DEBUG_MODE) return;
    console.time(`⏱️ ${label}`);
  },

  /**
   * TimeEnd : Fin mesure durée
   * @param {string} label - Label du timer
   */
  timeEnd: (label) => {
    if (!DEBUG_MODE) return;
    console.timeEnd(`⏱️ ${label}`);
  }
};

/**
 * Helper pour activer/désactiver debug mode
 */
export const toggleDebugMode = () => {
  const current = localStorage.getItem('mekong_debug_mode') === 'true';
  localStorage.setItem('mekong_debug_mode', String(!current));
  logger.info(`Debug mode ${!current ? 'activé' : 'désactivé'} - Rechargez la page`);
  return !current;
};

/**
 * Exposer dans window pour tests console
 */
if (typeof window !== 'undefined') {
  window.logger = logger;
  window.toggleDebugMode = toggleDebugMode;
  
  // Afficher état au démarrage
  if (DEBUG_MODE) {
    console.log(
      '%c🔍 DEBUG MODE ACTIVÉ',
      'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold'
    );
    console.log('Pour désactiver : toggleDebugMode() dans la console');
  }
}

export default logger;