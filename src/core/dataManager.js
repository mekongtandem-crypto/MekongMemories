/**
 * DataManager v2.5 - Final & Intelligent
 * This module orchestrates all application data.
 * It now correctly loads the masterIndex from Drive on startup if it exists,
 * and provides a method to instantly refresh it after regeneration.
 */
import { photoDataV2 } from './PhotoDataV2.js';

class DataManager {
  constructor() {
    this.connectionManager = null;
    this.driveSync = null;
    
    this.appState = {
      isInitialized: false,
      isLoading: true,
      sessions: [],
      masterIndex: null,
      currentUser: '',
      currentPage: 'memories', // Default to memories page
      error: null,
      connection: { hasError: false, lastError: null },
    };

    this.listeners = new Set();
    console.log('📦 DataManager v2.5: Ready.');
  }

  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    console.log('📦 DataManager: Dependencies injected.');
  }

  setState(newState) {
    this.appState = { ...this.appState, ...newState };
    this.notify();
  }

  async handleConnectionChange(connectionState) {
    if (connectionState.hasError) {
      this.setState({
        isLoading: false,
        error: `Connection Error: ${connectionState.lastError}`,
        connection: { hasError: true, lastError: connectionState.lastError }
      });
    }
    if (connectionState.isOnline && !this.appState.isInitialized) {
      await this.synchronizeInitialData();
    }
  }

  async synchronizeInitialData() {
  console.log('🚀 DataManager: Synchronisation initiale...');
  this.setState({ isLoading: true });

  try {
    // CORRECTION : On ne déstructure pas { data }, on prend l'objet entier.
    const loadedFiles = await this.driveSync.loadAllData();

    // On vérifie si l'index maître a bien été chargé.
    if (loadedFiles && loadedFiles.masterIndex) {
      console.log('Index maître trouvé sur Drive, chargement...');

      // La version B de DriveSync ne parse plus le JSON, on le fait ici.
      const parsedIndex = typeof loadedFiles.masterIndex === 'string' 
        ? JSON.parse(loadedFiles.masterIndex) 
        : loadedFiles.masterIndex;

      this.setState({ masterIndex: parsedIndex });
    }

    this.setState({
      isLoading: false,
      isInitialized: true,
      error: null // On efface les erreurs précédentes si la synchro réussit
    });
    console.log('✅ DataManager: Synchronisation initiale terminée.');

  } catch (error) {
    console.error("❌ DataManager: Erreur de synchronisation.", error);
    this.setState({ error: `Sync Error: ${error.message}`, isLoading: false, isInitialized: true });
  }
}

  /**
   * Instantly reloads the masterIndex into the app's state after generation.
   * This is called by SettingsPage.
   */
  // Nouvelle version corrigée de la fonction
async reloadMasterIndex() {
  try {
    console.log('🔄 DataManager: Rechargement manuel du masterIndex...');
    const masterIndexData = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
    
    if (masterIndexData) {
      // Étape 1 : Mettre à jour la sauvegarde à long terme (ce qui fonctionne déjà)
      await stateManager.set('master_index_v3', masterIndexData);
      await stateManager.set('master_index_loaded_at', new Date().toISOString());

      // --- LA CORRECTION CRUCIALE EST ICI ---
      // Étape 2 : Mettre à jour l'état interne "en direct" du DataManager
      this.setState({ masterIndex: masterIndexData });
      
      console.log('✅ MasterIndex rechargé et appliqué !');
      
      // Étape 3 : Notifier l'interface, qui recevra maintenant le nouvel état
      // (Cette ligne était déjà là, mais elle notifiera maintenant avec les BONNES données)
      this.notify();

      return { success: true };
    } else {
      throw new Error("Le fichier masterIndex n'a pas pu être rechargé depuis Drive.");
    }
  } catch (error) {
    console.error('❌ Echec du rechargement du master index:', error);
    this.setState({ error: `Reload Error: ${error.message}` }); // Informer l'UI de l'erreur
    return { success: false, error };
  }
}

  // --- Public API for UI ---

  async updateCurrentPage(pageId) {
    if (this.appState.currentPage !== pageId) {
      this.setState({ currentPage: pageId });
    }
  }

  getState() {
    return this.appState;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.appState);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }
}

export const dataManager = new DataManager();

