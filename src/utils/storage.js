/**
 * storage.js - Wrapper sécurisé pour localStorage
 * Gère les erreurs de quota et de sérialisation
 * 
 * USAGE :
 * import { safeStorage } from './utils/storage.js';
 * 
 * safeStorage.set('mekong_user', { id: 'tom' });
 * const user = safeStorage.get('mekong_user', null);
 */

/**
 * Vérifie si localStorage est disponible
 * (peut être bloqué en mode navigation privée)
 */
function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Calcule la taille approximative du localStorage
 * @returns {number} Taille en Ko
 */
function getStorageSize() {
  if (!isLocalStorageAvailable()) return 0;
  
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  
  return (total / 1024).toFixed(2);
}

/**
 * Wrapper sécurisé pour localStorage
 */
export const safeStorage = {
  /**
   * Sauvegarder une valeur
   * @param {string} key - Clé de stockage
   * @param {any} value - Valeur à sauvegarder
   * @returns {boolean} true si succès, false sinon
   */
  set: (key, value) => {
    if (!isLocalStorageAvailable()) {
      console.warn('⚠️ localStorage non disponible');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
      
    } catch (error) {
      // Quota exceeded
      if (error.name === 'QuotaExceededError') {
        console.error('❌ Quota localStorage dépassé');
        console.error('→ Taille actuelle:', getStorageSize(), 'Ko');
        console.error('→ Tentative sauvegarde:', key);
        
        // Optionnel : nettoyer anciennes clés
        safeStorage.cleanup();
        
        return false;
      }
      
      // Erreur sérialisation
      console.error('❌ Erreur sérialisation:', error);
      console.error('→ Clé:', key);
      console.error('→ Type:', typeof value);
      
      return false;
    }
  },

  /**
   * Récupérer une valeur
   * @param {string} key - Clé de stockage
   * @param {any} defaultValue - Valeur par défaut si erreur
   * @returns {any} Valeur récupérée ou defaultValue
   */
  get: (key, defaultValue = null) => {
    if (!isLocalStorageAvailable()) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      
      if (item === null) {
        return defaultValue;
      }
      
      return JSON.parse(item);
      
    } catch (error) {
      console.warn('⚠️ Erreur lecture localStorage:', key);
      return defaultValue;
    }
  },

  /**
   * Supprimer une valeur
   * @param {string} key - Clé à supprimer
   * @returns {boolean} true si succès
   */
  remove: (key) => {
    if (!isLocalStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression:', key);
      return false;
    }
  },

  /**
   * Vider tout le localStorage (DANGEREUX)
   * @param {string} prefix - Optionnel : supprimer seulement clés avec préfixe
   * @returns {number} Nombre de clés supprimées
   */
  clear: (prefix = null) => {
    if (!isLocalStorageAvailable()) {
      return 0;
    }

    try {
      if (prefix) {
        // Supprimer seulement clés avec préfixe
        let count = 0;
        const keysToRemove = [];
        
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          count++;
        });
        
        console.log(`🧹 ${count} clé(s) "${prefix}*" supprimée(s)`);
        return count;
        
      } else {
        // Tout supprimer (DANGEREUX)
        const count = localStorage.length;
        localStorage.clear();
        console.warn(`⚠️ localStorage vidé (${count} clés)`);
        return count;
      }
      
    } catch (error) {
      console.error('❌ Erreur clear:', error);
      return 0;
    }
  },

  /**
   * Lister toutes les clés
   * @param {string} prefix - Optionnel : filtrer par préfixe
   * @returns {Array<string>} Liste des clés
   */
  keys: (prefix = null) => {
    if (!isLocalStorageAvailable()) {
      return [];
    }

    const keys = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    }
    
    return keys;
  },

  /**
   * Obtenir toutes les données (debug)
   * @param {string} prefix - Optionnel : filtrer par préfixe
   * @returns {Object} Objet clé-valeur
   */
  getAll: (prefix = null) => {
    if (!isLocalStorageAvailable()) {
      return {};
    }

    const data = {};
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        if (!prefix || key.startsWith(prefix)) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
    }
    
    return data;
  },

  /**
   * Nettoyer les anciennes clés (stratégie LRU simple)
   * Supprime 20% des clés les plus anciennes
   */
  cleanup: () => {
    if (!isLocalStorageAvailable()) {
      return 0;
    }

    try {
      const keys = safeStorage.keys();
      const toRemove = Math.ceil(keys.length * 0.2);
      
      console.log(`🧹 Nettoyage : suppression de ${toRemove} anciennes clés`);
      
      // Supprimer les premières clés (stratégie simpliste)
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(keys[i]);
      }
      
      return toRemove;
      
    } catch (error) {
      console.error('❌ Erreur cleanup:', error);
      return 0;
    }
  },

  /**
   * Obtenir statistiques de stockage
   * @returns {Object} Stats
   */
  stats: () => {
    if (!isLocalStorageAvailable()) {
      return {
        available: false,
        totalKeys: 0,
        sizeKB: 0
      };
    }

    return {
      available: true,
      totalKeys: localStorage.length,
      sizeKB: getStorageSize(),
      maxSizeKB: 5120, // ~5MB limite navigateur
      percentUsed: ((getStorageSize() / 5120) * 100).toFixed(1)
    };
  }
};

/**
 * Exposer dans window pour debug console
 */
if (typeof window !== 'undefined') {
  window.safeStorage = safeStorage;
  
  // Commandes utiles console
  window.storageStats = () => {
    const stats = safeStorage.stats();
    console.table(stats);
    return stats;
  };
  
  window.storageKeys = (prefix) => {
    const keys = safeStorage.keys(prefix);
    console.log(`📋 ${keys.length} clé(s)${prefix ? ` (${prefix}*)` : ''}`);
    console.table(keys);
    return keys;
  };
}

export default safeStorage;