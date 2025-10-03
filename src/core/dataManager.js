/**
 * DataManager v3.5 - Messages photo dans bulle utilisateur
 * ✅ CHANGEMENT : Photo = message utilisateur, pas système
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
      isCreatingSession: false,
    };

    this.listeners = new Set();
    console.log('📦 DataManager v3.5 (Photo user message): Ready.');
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

  createSession = async (gameData, initialText = null, sourcePhoto = null) => {
    this.updateState({ isCreatingSession: true });
    
    try {
      const now = new Date().toISOString();
      const baseTimestamp = Date.now();
      
      const newSession = {
        id: `sid_${baseTimestamp}`, 
        gameId: gameData.id, 
        gameTitle: gameData.title,
        subtitle: `Conversation sur ${gameData.title}`, 
        createdAt: now,
        user: this.appState.currentUser,
        notes: [],
      };
      
      // ✅ NOUVEAU : Si photo, créer message utilisateur avec photo + texte
      if (sourcePhoto) {
        const userPhotoMessage = {
          id: `msg_${baseTimestamp}`,
          author: this.appState.currentUser,
          content: initialText?.trim() || '',
          timestamp: now,
          edited: false,
          photoData: {
            filename: sourcePhoto.filename,
            google_drive_id: sourcePhoto.google_drive_id,
            width: sourcePhoto.width,
            height: sourcePhoto.height,
            mime_type: sourcePhoto.mime_type
          }
        };
        newSession.notes.push(userPhotoMessage);
        console.log('📸 Message photo créé pour utilisateur:', userPhotoMessage.photoData.filename);
      } else {
        // Message système pour post/moment
        const systemMessage = {
          id: `${baseTimestamp}-system`,
          content: gameData.systemMessage || `💬 Session initiée.`,
          author: 'duo',
          timestamp: now,
          edited: false
        };
        newSession.notes.push(systemMessage);
        
        // Message utilisateur si texte fourni
        if (initialText && initialText.trim()) {
          const userMessage = {
            id: `msg_${baseTimestamp + 1}`,
            author: this.appState.currentUser,
            content: initialText.trim(),
            timestamp: now,
            edited: false
          };
          newSession.notes.push(userMessage);
          console.log('✅ Message utilisateur ajouté:', userMessage.content);
        }
      }
      
      await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.updateState({ 
        sessions: [...this.appState.sessions, newSession],
        isCreatingSession: false
      });
      
      console.log('✅ Session créée avec', newSession.notes.length, 'message(s)');
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