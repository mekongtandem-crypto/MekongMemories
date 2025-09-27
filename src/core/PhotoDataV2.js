/**
 * PhotoDataV2 v3.4 - Dependency Injection Fix
 * This version adds the initializeDependencies method to correctly receive
 * the stateManager, fixing the critical startup bug.
 */
class PhotoDataV2 {
  constructor() {
    this.masterIndex = null;
    this.isLoaded = false;
    this.stateManager = null; // Dependency will be injected
    console.log('📸 PhotoDataV2 v3.4: Prêt.');
  }

  // ✅ NOUVELLE MÉTHODE : Pour l'injection de dépendances
  initializeDependencies(dependencies) {
    this.stateManager = dependencies.stateManager;
  }

  async loadMasterIndexFromData(masterData) {
    try {
      if (!this.stateManager) throw new Error("StateManager dependency is missing.");
      this.masterIndex = masterData;
      this.isLoaded = true;
      const loadedAt = new Date().toISOString();
      
      // Utilise la dépendance injectée
      await this.stateManager.set('master_index_v3', masterData);
      await this.stateManager.set('master_index_loaded_at', loadedAt);
      
      return { success: true };
    } catch (error) {
      console.error('❌ PhotoDataV2: Error saving new index:', error);
      return { success: false, error: error.message };
    }
  }

  getTimelineCompatibleData() {
    if (!this.isLoaded || !this.masterIndex) {
      return { moments: [], error: 'Index not loaded' };
    }
    return {
      moments: this.masterIndex.moments || [],
    };
  }
  
  // Le reste des fonctions (resolveImageUrl, etc.) n'a pas besoin de changer pour l'instant
}

export const photoDataV2 = new PhotoDataV2();

