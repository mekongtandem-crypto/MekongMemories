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
    console.log('🚀 DataManager: Initial synchronization with REAL Drive...');
    this.setState({ isLoading: true });

    try {
      const { data } = await this.driveSync.loadAllData();
      
      // Load masterIndex first if it exists
      if (data.masterIndex) {
        console.log('Found masterIndex on Drive, loading into photoDataV2...');
        // The file content is raw text, so we parse it here
        const parsedIndex = JSON.parse(data.masterIndex);
        await photoDataV2.loadMasterIndexFromData(parsedIndex);
        this.setState({ masterIndex: parsedIndex });
      }

      this.setState({
        sessions: data.sessions || [],
        currentUser: data.appState?.currentUser || '',
        isLoading: false,
        isInitialized: true,
      });
      console.log('✅ DataManager: Sync complete.');
    } catch (error) {
      console.error("❌ DataManager: Sync error.", error);
      this.setState({ error: `Sync Error: ${error.message}`, isLoading: false, isInitialized: true });
    }
  }

  /**
   * Instantly reloads the masterIndex into the app's state after generation.
   * This is called by SettingsPage.
   */
  async reloadMasterIndex() {
    console.log('🔄 DataManager: Manual reload of masterIndex...');
    try {
        const masterIndexContent = await this.driveSync.loadData('masterIndex');
        if (masterIndexContent) {
            const parsedIndex = JSON.parse(masterIndexContent);
            await photoDataV2.loadMasterIndexFromData(parsedIndex);
            this.setState({ masterIndex: parsedIndex });
            console.log('✅ MasterIndex reloaded and applied!');
        }
    } catch(error) {
        console.error('❌ Failed to reload master index:', error);
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

