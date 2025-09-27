/**
 * DataManager v3.0 - FINAL STABLE
 * This version uses arrow functions for all public methods to
 * permanently fix `this` context issues when called from React.
 */
class DataManager {
  constructor() {
    this.connectionManager = null;
    this.driveSync = null;
    this.stateManager = null;

    this.appState = {
      isInitialized: false, isLoading: true, masterIndex: null, sessions: [],
      currentChatSession: null, currentUser: null, currentPage: 'memories',
      error: null, connection: { hasError: false, lastError: null },
    };

    this.listeners = new Set();
    console.log('📦 DataManager v3.0 (Stable): Ready.');
  }

  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.stateManager = dependencies.stateManager; // Injection de stateManager
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    console.log('📦 DataManager: Dependencies injected.');
  }

  // Renommée en updateState pour la clarté, et privée
  updateState = (newState) => {
    this.appState = { ...this.appState, ...newState };
    this.notify();
  }

  // --- Fonctions de cycle de vie ---

  handleConnectionChange = async (connectionState) => {
    if (connectionState.hasError) {
      this.updateState({
        isLoading: false, error: `Connection Error: ${connectionState.lastError}`,
        connection: { hasError: true, lastError: connectionState.lastError }
      });
    }
    if (connectionState.isOnline && !this.appState.isInitialized) {
      await this.synchronizeInitialData();
    }
  }

  synchronizeInitialData = async () => {
    console.log('🚀 DataManager: Synchronisation initiale...');
    this.updateState({ isLoading: true });
    try {
      const cachedUser = await this.stateManager.get('mekong_currentUser');
      if (cachedUser) console.log(`👤 Utilisateur en cache trouvé : ${cachedUser}`);
      
      const loadedFiles = await this.driveSync.loadAllData();
      const masterIndex = (loadedFiles?.masterIndex) ? (typeof loadedFiles.masterIndex === 'string' ? JSON.parse(loadedFiles.masterIndex) : loadedFiles.masterIndex) : null;
      const sessions = loadedFiles.sessions || [];

      this.updateState({
        masterIndex, sessions, currentUser: cachedUser || null,
        isLoading: false, isInitialized: true, error: null
      });
      console.log(`✅ DataManager: Synchro terminée. ${sessions.length} session(s) chargée(s).`);
    } catch (error) {
      console.error("❌ DataManager: Erreur de synchronisation.", error);
      this.updateState({ error: `Sync Error: ${error.message}`, isLoading: false, isInitialized: true });
    }
  }

  // --- API PUBLIQUE (toutes en fonctions fléchées) ---
  
  setCurrentUser = (userId) => {
    console.log(`👤 Changement d'utilisateur -> ${userId}`);
    this.stateManager.set('mekong_currentUser', userId);
    this.updateState({ currentUser: userId });
  }

  updateCurrentPage = (pageId) => {
    if (this.appState.currentPage !== pageId) {
      console.log(`📄 Changement de page -> ${pageId}`);
      this.updateState({ currentPage: pageId });
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

// --- NOUVELLE API PUBLIQUE POUR LES SESSIONS ---

  /** Crée une nouvelle session de chat */
  createSession = async (gameData) => {
    const newSession = {
      id: `sid_${Date.now()}`, gameId: gameData.id, gameTitle: gameData.title,
      subtitle: `Conversation sur ${gameData.title}`, createdAt: new Date().toISOString(),
      user: this.appState.currentUser, notes: [],
    };
    await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
    this.updateState({ sessions: [...this.appState.sessions, newSession] });
    return newSession;
  }

  updateSession = async (sessionToUpdate) => {
    await this.driveSync.saveFile(`session_${sessionToUpdate.id}.json`, sessionToUpdate);
    const updatedSessions = this.appState.sessions.map(s => s.id === sessionToUpdate.id ? sessionToUpdate : s);
    const updatedCurrentChat = this.appState.currentChatSession?.id === sessionToUpdate.id ? sessionToUpdate : this.appState.currentChatSession;
    this.updateState({ sessions: updatedSessions, currentChatSession: updatedCurrentChat });
  }

  deleteSession = async (sessionId) => {
    await this.driveSync.deleteFile(`session_${sessionId}.json`);
    const filteredSessions = this.appState.sessions.filter(s => s.id !== sessionId);
    this.updateState({ sessions: filteredSessions });
  }

  addMessageToSession = async (sessionId, messageContent) => {
    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (!session) return;
    const newMessage = {
      id: `msg_${Date.now()}`, author: this.appState.currentUser,
      content: messageContent, timestamp: new Date().toISOString(), edited: false
    };
    const updatedSession = { ...session, notes: [...session.notes, newMessage] };
    await this.updateSession(updatedSession);
  }

  openChatSession = (session) => {
    this.updateState({ currentChatSession: session, currentPage: 'chat' });
  }

  closeChatSession = () => {
    this.updateState({ currentChatSession: null, currentPage: 'sessions' });
  }
  // --- Fin de la nouvelle API ---


  // --- Public API for UI ---

  async updateCurrentPage(pageId) {
    if (this.appState.currentPage !== pageId) {
      this.setState({ currentPage: pageId });
    }
  }

  // --- Gestion de l'état et des abonnements (inchangé) ---
  getState = () => this.appState;
  subscribe = (callback) => {
    this.listeners.add(callback);
    callback(this.appState);
    return () => this.listeners.delete(callback);
  }
  notify = () => { for (const listener of this.listeners) { listener(this.getState()); } }
}

export const dataManager = new DataManager();

