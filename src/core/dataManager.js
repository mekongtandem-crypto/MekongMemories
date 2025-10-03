/**
 * DataManager v3.2 - Spinner global création session
 * ✅ NOUVEAU : State isCreatingSession
 */
class DataManager {
  constructor() {
    this.connectionManager = null;
    this.driveSync = null;
    this.stateManager = null;

    this.appState = {
      isInitialized: false, 
      isLoading: true, 
      masterIndex: null, 
      sessions: [],
      currentChatSession: null, 
      currentUser: null, 
      currentPage: 'memories',
      error: null, 
      connection: { hasError: false, lastError: null },
      isCreatingSession: false, // ✅ NOUVEAU
    };

    this.listeners = new Set();
    console.log('📦 DataManager v3.2 (Spinner global): Ready.');
  }

  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.stateManager = dependencies.stateManager;
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    console.log('📦 DataManager: Dependencies injected.');
  }

  updateState = (newState) => {
    this.appState = { ...this.appState, ...newState };
    this.notify();
  }

  handleConnectionChange = async (connectionState) => {
    if (connectionState.hasError) {
      this.updateState({
        isLoading: false, 
        error: `Connection Error: ${connectionState.lastError}`,
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
      const masterIndex = (loadedFiles?.masterIndex) ? 
        (typeof loadedFiles.masterIndex === 'string' ? JSON.parse(loadedFiles.masterIndex) : loadedFiles.masterIndex) 
        : null;
      const sessions = loadedFiles.sessions || [];

      this.updateState({
        masterIndex, 
        sessions, 
        currentUser: cachedUser || null,
        isLoading: false, 
        isInitialized: true, 
        error: null
      });
      
      console.log(`✅ DataManager: Synchro terminée. ${sessions.length} session(s) chargée(s).`);
      
    } catch (error) {
      console.error("❌ DataManager: Erreur de synchronisation.", error);
      this.updateState({ 
        error: `Sync Error: ${error.message}`, 
        isLoading: false, 
        isInitialized: true 
      });
    }
  }

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
  
  reloadMasterIndex = async () => {
    try {
      console.log('🔄 DataManager: Rechargement manuel du masterIndex...');
      const masterIndexData = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
      
      if (masterIndexData) {
        await this.stateManager.set('master_index_v3', masterIndexData);
        await this.stateManager.set('master_index_loaded_at', new Date().toISOString());
        
        this.updateState({ masterIndex: masterIndexData });
        
        console.log('✅ MasterIndex rechargé et appliqué !');
        return { success: true };
      } else {
        throw new Error("Le fichier masterIndex n'a pas pu être rechargé depuis Drive.");
      }
    } catch (error) {
      console.error('❌ Echec du rechargement du master index:', error);
      this.updateState({ error: `Reload Error: ${error.message}` });
      return { success: false, error };
    }
  }

  // ✅ MODIFIÉ : Gestion spinner global
  createSession = async (gameData) => {
    this.updateState({ isCreatingSession: true });
    
    try {
      const newSession = {
        id: `sid_${Date.now()}`, 
        gameId: gameData.id, 
        gameTitle: gameData.title,
        subtitle: `Conversation sur ${gameData.title}`, 
        createdAt: new Date().toISOString(),
        user: this.appState.currentUser,
        notes: [],
      };
      
      await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
      
      this.updateState({ 
        sessions: [...this.appState.sessions, newSession],
        isCreatingSession: false
      });
      
      console.log('✅ Session créée avec succès');
      return newSession;
      
    } catch (error) {
      console.error('❌ Erreur création session:', error);
      this.updateState({ isCreatingSession: false });
      throw error;
    }
  }

  updateSession = async (sessionToUpdate) => {
    await this.driveSync.saveFile(`session_${sessionToUpdate.id}.json`, sessionToUpdate);
    const updatedSessions = this.appState.sessions.map(s => 
      s.id === sessionToUpdate.id ? sessionToUpdate : s
    );
    const updatedCurrentChat = this.appState.currentChatSession?.id === sessionToUpdate.id ? 
      sessionToUpdate : this.appState.currentChatSession;
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
      id: `msg_${Date.now()}`, 
      author: this.appState.currentUser,
      content: messageContent, 
      timestamp: new Date().toISOString(), 
      edited: false
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

  getState = () => this.appState;
  
  subscribe = (callback) => {
    this.listeners.add(callback);
    callback(this.appState);
    return () => this.listeners.delete(callback);
  }
  
  notify = () => { 
    for (const listener of this.listeners) { 
      listener(this.getState()); 
    } 
  }
}

export const dataManager = new DataManager();