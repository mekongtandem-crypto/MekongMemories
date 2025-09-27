/**
 * StateManager v0.7.0 - Version Progressive
 * Gestion d'état unifiée sans dépendances externes
 */

class StateManager {
  constructor() {
    this.state = new Map(); // État en mémoire
    this.listeners = new Set(); // Observateurs pour React
    this.isInitialized = false;
    
    console.log('🧠 StateManager: Construction...');
    this.init();
  }

  async init() {
    try {
      console.log('🧠 StateManager: Initialisation...');
      
      // Charger les données depuis localStorage
      await this.loadFromLocal();
      
      // Marquer comme initialisé
      this.isInitialized = true;
      
      console.log('✅ StateManager: Initialisé avec succès');
      console.log('📊 État initial:', this.getDebugState());
      
    } catch (error) {
      console.error('❌ StateManager: Erreur initialisation:', error);
    }
  }

  // ========================================
  // API PRINCIPALE
  // ========================================

  /**
   * Récupérer une valeur
   */
  async get(key, fallback = null) {
    try {
      // 1. Vérifier la mémoire d'abord
      if (this.state.has(key)) {
        const value = this.state.get(key);
        console.log(`📖 StateManager.get(${key}): depuis mémoire`, value);
        return value;
      }

      // 2. Charger depuis localStorage
      const localValue = this.getFromLocal(key);
      if (localValue !== null) {
        // Mettre en cache en mémoire
        this.state.set(key, localValue);
        console.log(`📖 StateManager.get(${key}): depuis localStorage`, localValue);
        return localValue;
      }

      console.log(`📖 StateManager.get(${key}): fallback`, fallback);
      return fallback;
      
    } catch (error) {
      console.error(`❌ StateManager.get(${key}) erreur:`, error);
      return fallback;
    }
  }

  /**
   * Sauvegarder une valeur
   */
  async set(key, value) {
    try {
      console.log(`💾 StateManager.set(${key}):`, value);
      
      // 1. Mettre à jour la mémoire immédiatement
      this.state.set(key, value);
      
      // 2. Sauvegarder en localStorage
      const saved = this.setToLocal(key, value);
      
      // 3. Notifier les observateurs React
      this.notifyListeners(key, value);
      
      if (saved) {
        console.log(`✅ StateManager.set(${key}): succès`);
      } else {
        console.warn(`⚠️ StateManager.set(${key}): localStorage échoué`);
      }
      
      return saved;
      
    } catch (error) {
      console.error(`❌ StateManager.set(${key}) erreur:`, error);
      return false;
    }
  }

  /**
   * Supprimer une valeur
   */
  async remove(key) {
    try {
      console.log(`🗑️ StateManager.remove(${key})`);
      
      // Supprimer de la mémoire
      this.state.delete(key);
      
      // Supprimer du localStorage
      this.removeFromLocal(key);
      
      // Notifier les observateurs
      this.notifyListeners(key, null);
      
      console.log(`✅ StateManager.remove(${key}): succès`);
      return true;
      
    } catch (error) {
      console.error(`❌ StateManager.remove(${key}) erreur:`, error);
      return false;
    }
  }

  // ========================================
  // STOCKAGE LOCAL
  // ========================================

  getFromLocal(key) {
    try {
      const fullKey = `mekong_v2_${key}`;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`⚠️ Erreur lecture localStorage ${key}:`, error);
      return null;
    }
  }

  setToLocal(key, value) {
    try {
      const fullKey = `mekong_v2_${key}`;
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`❌ Erreur écriture localStorage ${key}:`, error);
      return false;
    }
  }

  removeFromLocal(key) {
    try {
      const fullKey = `mekong_v2_${key}`;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`❌ Erreur suppression localStorage ${key}:`, error);
      return false;
    }
  }

  async loadFromLocal() {
    console.log('📂 StateManager: Chargement depuis localStorage...');
    
    const defaultKeys = ['sessions', 'currentUser', 'appState', 'preferences'];
    let loaded = 0;
    
    for (const key of defaultKeys) {
      const value = this.getFromLocal(key);
      if (value !== null) {
        this.state.set(key, value);
        loaded++;
        console.log(`✅ Chargé: ${key}`, value);
      }
    }
    
    console.log(`📂 StateManager: ${loaded} éléments chargés depuis localStorage`);
  }

  // ========================================
  // OBSERVATEURS (pour React)
  // ========================================

  /**
   * S'abonner aux changements
   */
  subscribe(key, callback) {
    const listener = { key, callback };
    this.listeners.add(listener);

    console.log(`👂 StateManager: Nouvel observateur pour "${key}"`);

    // Retourner fonction de désabonnement
    return () => {
      this.listeners.delete(listener);
      console.log(`👋 StateManager: Observateur supprimé pour "${key}"`);
    };
  }

  /**
   * Notifier les observateurs
   */
  notifyListeners(key, value) {
    let notified = 0;
    
    for (const listener of this.listeners) {
      if (listener.key === key || listener.key === '*') {
        try {
          listener.callback(value, key);
          notified++;
        } catch (error) {
          console.error('❌ Erreur notification listener:', error);
        }
      }
    }
    
    if (notified > 0) {
      console.log(`📢 StateManager: ${notified} observateurs notifiés pour "${key}"`);
    }
  }

  // ========================================
  // MIGRATION (depuis v0.6.3)
  // ========================================

  async migrateFromV063() {
    console.log('📦 StateManager: Migration depuis v0.6.3...');
    
    try {
      // Vérifier si migration déjà effectuée
      const alreadyMigrated = await this.get('migrated_from_v063', false);
      if (alreadyMigrated) {
        console.log('✅ Migration déjà effectuée');
        return true;
      }

      let migrated = 0;
      const oldKeys = ['mekong_sessions', 'mekong_currentUser'];
      
      for (const oldKey of oldKeys) {
        try {
          const oldValue = localStorage.getItem(oldKey);
          if (oldValue) {
            const newKey = oldKey.replace('mekong_', '');
            const parsedValue = JSON.parse(oldValue);
            
            await this.set(newKey, parsedValue);
            migrated++;
            
            console.log(`✅ Migré: ${oldKey} → ${newKey}`);
          }
        } catch (error) {
          console.warn(`⚠️ Impossible de migrer ${oldKey}:`, error);
        }
      }

      // Marquer migration comme effectuée
      await this.set('migrated_from_v063', true);
      
      console.log(`✅ Migration terminée: ${migrated} éléments migrés`);
      return true;
      
    } catch (error) {
      console.error('❌ Erreur migration:', error);
      return false;
    }
  }

  // ========================================
  // UTILITAIRES & DEBUG
  // ========================================

  getStats() {
    return {
      isInitialized: this.isInitialized,
      memoryItems: this.state.size,
      listeners: this.listeners.size,
      localStorageItems: this.getLocalStorageItems(),
      version: '0.7.0'
    };
  }

  getLocalStorageItems() {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('mekong_v2_')) {
        items[key] = localStorage.getItem(key);
      }
    }
    return items;
  }

  getDebugState() {
    const debugState = {};
    for (const [key, value] of this.state.entries()) {
      debugState[key] = value;
    }
    return debugState;
  }

  async reset() {
    console.log('🔄 StateManager: Reset complet...');
    
    // Vider la mémoire
    this.state.clear();
    
    // Vider localStorage (seulement nos clés)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('mekong_v2_') || key.startsWith('mekong_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`🔄 StateManager: Reset terminé - ${keysToRemove.length} clés supprimées`);
  }

  // ========================================
  // MÉTHODES SPÉCIALISÉES (pour les composants)
  // ========================================

  async getSessions() {
    return await this.get('sessions', []);
  }

  async setSessions(sessions) {
    return await this.set('sessions', sessions);
  }

  async getCurrentUser() {
    return await this.get('currentUser', '');
  }

  async setCurrentUser(user) {
    return await this.set('currentUser', user);
  }

  async getAppState() {
    return await this.get('appState', {
      currentPage: 'home',
      lastAccess: new Date().toISOString()
    });
  }

  async setAppState(state) {
    return await this.set('appState', {
      ...state,
      lastModified: new Date().toISOString()
    });
  }
}

// Instance globale unique
export const stateManager = new StateManager();

// Export pour debugging en développement
if (typeof window !== 'undefined') {
  window.stateManager = stateManager;
  console.log('🛠️ StateManager disponible via window.stateManager');
}