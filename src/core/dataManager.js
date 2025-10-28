/**
 * DataManager v3.5 - Messages photo dans bulle utilisateur
 * âœ… CHANGEMENT : Photo = message utilisateur, pas systÃ¨me
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
  currentPage: 'sessions',
  error: null, 
  connection: { hasError: false, lastError: null },
  isCreatingSession: false,
};
    this.listeners = new Set();
    this.notificationManager = null;

    console.log('ðŸ“¦ DataManager v3.5 (Photo user message): Ready.');
  }

  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.stateManager = dependencies.stateManager;
    this.notificationManager = dependencies.notificationManager; 
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    console.log('ðŸ“¦ DataManager: Dependencies injected.');
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
    console.log('ðŸš€ DataManager: Synchronisation initiale...');
    this.updateState({ isLoading: true });
    
    try {
      const cachedUser = await this.stateManager.get('mekong_currentUser');
      if (cachedUser) console.log(`ðŸ‘¤ Utilisateur en cache trouvÃ© : ${cachedUser}`);
      
      const loadedFiles = await this.driveSync.loadAllData();

let masterIndex = (loadedFiles?.masterIndex) ? 
  (typeof loadedFiles.masterIndex === 'string' ? JSON.parse(loadedFiles.masterIndex) : loadedFiles.masterIndex) 
  : null;

// â­ NOUVEAU : Enrichir moments avec IDs si absents
if (masterIndex?.moments) {
  masterIndex.moments = masterIndex.moments.map((moment, index) => {
    // Si pas d'ID, le gÃ©nÃ©rer
    if (!moment.id) {
      return {
        ...moment,
        id: `moment_${moment.dayStart}_${moment.dayEnd}_${index}`
      };
    }
    return moment;
  });
  console.log(`âœ… ${masterIndex.moments.length} moments chargÃ©s avec IDs`);
}

const sessions = loadedFiles.sessions || [];

// â­ Charger notifications
await this.notificationManager.init();

      this.updateState({
        masterIndex, 
        sessions, 
        currentUser: cachedUser || null,
        isLoading: false, 
        isInitialized: true, 
        error: null
      });
      
      console.log(`âœ… DataManager: Synchro terminÃ©e. ${sessions.length} session(s) chargÃ©e(s).`);
      
    } catch (error) {
      console.error("âŒ DataManager: Erreur de synchronisation.", error);
      this.updateState({ 
        error: `Sync Error: ${error.message}`, 
        isLoading: false, 
        isInitialized: true 
      });
    }
  }

	sendNotification = async (toUserId, sessionId, sessionTitle) => {
  try {
    const result = await this.notificationManager.sendNotification({
      from: this.appState.currentUser,
      to: toUserId,
      sessionId,
      sessionTitle
    });
    
    if (result.success) {
      console.log('âœ… Notification envoyÃ©e:', result.notification);
    }
    
    return result;
  } catch (error) {
    console.error('âŒ Erreur envoi notification:', error);
    return { success: false, error: error.message };
  }
}

  setCurrentUser = (userId) => {
    console.log(`ðŸ‘¤ Changement d'utilisateur -> ${userId}`);
    this.stateManager.set('mekong_currentUser', userId);
    this.updateState({ currentUser: userId });
  }

  updateCurrentPage = (pageId) => {
    if (this.appState.currentPage !== pageId) {
      console.log(`ðŸ“„ Changement de page -> ${pageId}`);
      this.updateState({ currentPage: pageId });
    }
  }
  
  reloadMasterIndex = async () => {
    try {
      console.log('ðŸ”„ DataManager: Rechargement manuel du masterIndex...');
      const masterIndexData = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
      
      if (masterIndexData) {
        await this.stateManager.set('master_index_v3', masterIndexData);
        await this.stateManager.set('master_index_loaded_at', new Date().toISOString());
        
        this.updateState({ masterIndex: masterIndexData });
        
        console.log('âœ… MasterIndex rechargÃ© et appliquÃ© !');
        return { success: true };
      } else {
        throw new Error("Le fichier masterIndex n'a pas pu Ãªtre rechargÃ© depuis Drive.");
      }
    } catch (error) {
      console.error('âŒ Echec du rechargement du master index:', error);
      this.updateState({ error: `Reload Error: ${error.message}` });
      return { success: false, error };
    }
  }

// âœ… NOUVEAU : RÃ©gÃ©nÃ©rer complÃ¨tement l'index
regenerateMasterIndex = async () => {
  try {
    console.log('ðŸ—ï¸ DataManager: RÃ©gÃ©nÃ©ration complÃ¨te du masterIndex...');
    
    // 1. VÃ©rifier que masterIndexGenerator existe
    if (!window.masterIndexGenerator) {
      throw new Error('masterIndexGenerator n\'est pas disponible');
    }
    
    // 2. RÃ©gÃ©nÃ©rer l'index
    const result = await window.masterIndexGenerator.generateMomentsStructure();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur de gÃ©nÃ©ration');
    }
    
    console.log('âœ… Index rÃ©gÃ©nÃ©rÃ© sur Drive');
    
    // 3. Recharger le nouveau fichier
    await new Promise(resolve => setTimeout(resolve, 500)); // Attendre que Drive sync
    const reloadResult = await this.reloadMasterIndex();
    
    return reloadResult;
    
  } catch (error) {
    console.error('âŒ Erreur rÃ©gÃ©nÃ©ration masterIndex:', error);
    return { success: false, error: error.message };
  }
}



// src/core/dataManager.js - REMPLACEMENT de createSession (lignes 145-220)

/**
 * dataManager.js v3.8 - PHASE A : Structure sessions enrichie
 * ✅ momentId (remplace gameId)
 * ✅ originContent (type, id, title)
 * ✅ themeIds (array vide par défaut)
 */

createSession = async (gameData, initialText = null, sourcePhoto = null) => {
  this.updateState({ isCreatingSession: true });
  
  try {
    const now = new Date().toISOString();
    const baseTimestamp = Date.now();
    
    // ✨ PHASE A : Déterminer originContent
    let originContent = null;
    let momentId = null;
    
    if (sourcePhoto) {
      // Session créée depuis une photo
      originContent = {
        type: 'photo',
        id: sourcePhoto.google_drive_id || sourcePhoto.id,
        title: sourcePhoto.filename || sourcePhoto.name || 'photo.jpg',
        // Stockage méta pour affichage ultérieur
        filename: sourcePhoto.filename || sourcePhoto.name,
        isMastodonPhoto: !!sourcePhoto.url && !sourcePhoto.filename
      };
      // Le momentId sera dans gameData.id pour les photos
      momentId = gameData.id;
      
    } else if (gameData.systemMessage?.includes('article')) {
      // Session créée depuis un post (détection via systemMessage)
      originContent = {
        type: 'post',
        id: gameData.id, // L'ID du post
        title: gameData.title
      };
      // Pour un post, le momentId doit être passé séparément ou déduit
      // ⚠️ TODO: MemoriesPage devra passer contextMoment.id explicitement
      momentId = gameData.momentId || gameData.id; // Fallback temporaire
      
    } else {
      // Session créée depuis un moment
      originContent = {
        type: 'moment',
        id: gameData.id,
        title: gameData.title
      };
      momentId = gameData.id;
    }
    
    const newSession = {
      id: `sid_${baseTimestamp}`, 
      
      // ✨ PHASE A : Nouvelle structure
      momentId: momentId,                    // Moment du voyage (obligatoire)
      originContent: originContent,          // Contenu exact d'origine
      themeIds: [],                          // Thèmes associés (vide par défaut)
      
      // ⚠️ COMPATIBILITÉ : Garder gameId temporairement
      gameId: momentId,                      // DEPRECATED - à supprimer plus tard
      
      gameTitle: gameData.title,
      subtitle: `Conversation sur ${gameData.title}`, 
      createdAt: now,
      user: this.appState.currentUser,
      notes: [],
    };
    
    // ✅ Support photos Mastodon ET photos moments
    if (sourcePhoto) {
      const userPhotoMessage = {
        id: `msg_${baseTimestamp}`,
        author: this.appState.currentUser,
        content: initialText?.trim() || '',
        timestamp: now,
        edited: false,
        photoData: {
          filename: sourcePhoto.filename || sourcePhoto.name || 'photo.jpg',
          google_drive_id: sourcePhoto.google_drive_id,
          url: sourcePhoto.url,
          width: sourcePhoto.width,
          height: sourcePhoto.height,
          mime_type: sourcePhoto.mime_type || sourcePhoto.mediaType || 'image/jpeg',
          isMastodonPhoto: !!sourcePhoto.url && !sourcePhoto.filename
        }
      };
      newSession.notes.push(userPhotoMessage);
      
      console.log('📸 Session photo créée:', {
        momentId: newSession.momentId,
        originType: newSession.originContent.type,
        originId: newSession.originContent.id
      });
      
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
      }
      
      console.log('✅ Session créée:', {
        momentId: newSession.momentId,
        originType: newSession.originContent.type,
        originId: newSession.originContent.id
      });
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

addMessageToSession = async (sessionId, messageContent, photoData = null, linkedContent = null) => {
    console.log('=== dataManager.addMessageToSession ===');
    console.log('ðŸ“¨ sessionId:', sessionId);
    console.log('ðŸ“¨ messageContent:', messageContent);
    console.log('ðŸ“¨ photoData reÃ§u:', photoData);
    console.log('ðŸ“¨ linkedContent reÃ§u:', linkedContent);  // â­ NOUVEAU
    
    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (!session) {
        console.error('âŒ Session introuvable:', sessionId);
        return;
    }
        
    const newMessage = {
      id: `msg_${Date.now()}`, 
      author: this.appState.currentUser,
      content: messageContent, 
      timestamp: new Date().toISOString(), 
      edited: false,
      ...(photoData && { photoData: photoData }),
      ...(linkedContent && { linkedContent })  // âœ… Maintenant linkedContent existe
    };
    
    console.log('ðŸ’¾ Message crÃ©Ã©:', newMessage);
    console.log('ðŸ’¾ Message a photoData?', 'photoData' in newMessage);
    console.log('ðŸ’¾ Message a linkedContent?', 'linkedContent' in newMessage);
        
    const updatedSession = { ...session, notes: [...session.notes, newMessage] };
    await this.updateSession(updatedSession);
    
    console.log('âœ… Session mise Ã  jour');
       
    const notif = this.notificationManager.getNotificationForSession(
      sessionId, 
      this.appState.currentUser
    );
    if (notif) {
      await this.notificationManager.markAsRead(notif.id);
    }
}


openChatSession = (session) => {
  this.updateState({ currentChatSession: session, currentPage: 'chat' });
  
  // âœ… NOUVEAU : Marquer notification comme lue Ã  l'ouverture
  const notif = this.notificationManager.getNotificationForSession(
    session.id, 
    this.appState.currentUser.id
  );
  if (notif) {
    this.notificationManager.markAsRead(notif.id);
    console.log('âœ… Notification marquÃ©e lue Ã  l\'ouverture de la session');
  }
}

  closeChatSession = () => {
    this.updateState({ currentChatSession: null, currentPage: 'sessions' });
  }
  
  /**
 * Marquer une session comme terminÃ©e/archivÃ©e
 */
markSessionStatus = async (sessionId, statusType, value) => {
  const session = this.appState.sessions.find(s => s.id === sessionId);
  if (!session) return;
  
  const updatedSession = { 
    ...session, 
    [statusType]: value 
  };
  
  await this.updateSession(updatedSession);
}

sendNotification = async (toUserId, sessionId, sessionTitle) => {
  try {
    const result = await this.notificationManager.sendNotification({
      from: this.appState.currentUser,
      to: toUserId,
      sessionId,
      sessionTitle
    });
    
    if (result.success) {
      console.log('âœ… Notification envoyÃ©e:', result.notification);
    }
    
    return result;
  } catch (error) {
    console.error('âŒ Erreur envoi notification:', error);
    return { success: false, error: error.message };
  }
}

  /**
 * Sauvegarde le masterIndex modifiÃ© sur Drive
 */
saveMasterIndex = async (updatedMasterIndex) => {
  try {
    await this.driveSync.saveFile('mekong_master_index_v3_moments.json', updatedMasterIndex);
    
    // Mettre Ã  jour l'Ã©tat local
    this.updateState({ masterIndex: updatedMasterIndex });
    
    console.log('âœ… MasterIndex sauvegardÃ©');
    return { success: true };
  } catch (error) {
    console.error('âŒ Erreur sauvegarde masterIndex:', error);
    return { success: false, error: error.message };
  }
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

// âœ… AJOUTER CES LIGNES Ã€ LA FIN :
if (typeof window !== 'undefined') {
  window.dataManager = dataManager;
  console.log('ðŸ› ï¸ DataManager disponible via window.dataManager');
}