/**
 * ==============================================================================
 * DataManager v3.7 - Phase 19D : Système ContentLinks intégré
 * ==============================================================================
 * 
 * ARCHITECTURE DONNÉES :
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SESSION FILES (source de vérité absolue)                        │
 * │  Fichiers: session_sid_XXXXX.json                                │
 * │  - originContent : contenu d'origine de la session               │
 * │  - linkedContent : liens dans les messages individuels           │
 * └─────────────────────────────────────────────────────────────────┘
 *                              ↓ (indexé par)
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  CONTENT-LINKS.JSON (index de recherche inversée - cache)        │
 * │  - Permet requêtes rapides : photo/post/moment → sessions        │
 * │  - Reconstruit automatiquement si vide/corrompu/manquant         │
 * │  - Performance : Map-based (O(1) vs O(n) sans index)            │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * FLUX DE DONNÉES - Création session :
 * 1. User crée session → createSession()
 * 2. Sauver session avec originContent → session_XXX.json
 * 3. ⭐ NOUVEAU : contentLinks.addLink(origin) → content-links.json
 * 
 * FLUX DE DONNÉES - Ajout lien message :
 * 1. User ajoute lien → addMessageToSession(..., linkedContent)
 * 2. Sauver message avec linkedContent → session_XXX.json
 * 3. ⭐ NOUVEAU : contentLinks.addLink(link) → content-links.json
 * 
 * RECONSTRUCTION AUTO :
 * - Au démarrage : si content-links.json vide → rebuildContentLinks()
 * - Parcourt toutes les sessions et reconstruit l'index complet
 * 
 * CHANGELOG v3.7 :
 * ✅ contentLinks ajouté au constructor
 * ✅ Initialisation dans initializeDependencies()
 * ✅ createSession() → appelle contentLinks.addLink() pour origine
 * ✅ addMessageToSession() → appelle contentLinks.addLink() si linkedContent
 * ✅ deleteSession() → appelle contentLinks.removeLinksForSession()
 * ✅ rebuildContentLinks() avec auto-trigger au démarrage
 * ✅ Documentation complète des flux
 * 
 * ==============================================================================
 */

class DataManager {
  constructor() {
    this.connectionManager = null;
    this.driveSync = null;
    this.stateManager = null;
    this.contentLinks = null;  // ⭐ NEW Phase 19D - Index liens bidirectionnel
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

    console.log('📦 DataManager v3.7 (ContentLinks intégré): Ready.');
  }

  // ========================================
  // INITIALISATION
  // ========================================

  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.stateManager = dependencies.stateManager;
    this.notificationManager = dependencies.notificationManager;
    this.contentLinks = dependencies.contentLinks || window.contentLinks;  // ⭐ NEW Phase 19D
    
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    
    console.log('📦 DataManager: Dependencies injected.');
    if (this.contentLinks) {
      console.log('✅ ContentLinks disponible');
    } else {
      console.warn('⚠️ ContentLinks non trouvé - Index liens désactivé');
    }
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
    console.log('🔄 DataManager: Synchronisation initiale...');
    this.updateState({ isLoading: true });
    
    try {
      const cachedUser = await this.stateManager.get('mekong_currentUser');
      if (cachedUser) console.log(`👤 Utilisateur en cache trouvé : ${cachedUser}`);
      
      const loadedFiles = await this.driveSync.loadAllData();

      let masterIndex = (loadedFiles?.masterIndex) ? 
        (typeof loadedFiles.masterIndex === 'string' ? JSON.parse(loadedFiles.masterIndex) : loadedFiles.masterIndex) 
        : null;

      // Enrichir moments avec IDs si absents
      if (masterIndex?.moments) {
        masterIndex.moments = masterIndex.moments.map((moment, index) => {
          if (!moment.id) {
            return {
              ...moment,
              id: `moment_${moment.dayStart}_${moment.dayEnd}_${index}`
            };
          }
          return moment;
        });
        console.log(`✅ ${masterIndex.moments.length} moments chargés avec IDs`);
      }

      const sessions = loadedFiles.sessions || [];

      // Charger notifications
      await this.notificationManager.init();
      
      // ⭐ NEW Phase 19D : Charger ContentLinks
      if (this.contentLinks) {
        await this.contentLinks.init();
        
        // ⭐ Reconstruction auto si vide
        if (this.contentLinks.links.size === 0 && sessions.length > 0) {
          console.log('🔧 ContentLinks vide mais sessions présentes → Reconstruction...');
          await this.rebuildContentLinks(sessions);
        }
      }

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

  // ========================================
  // CONTENTLINKS - RECONSTRUCTION
  // ========================================
  
  /**
   * ⭐ NEW Phase 19D : Reconstruire l'index ContentLinks depuis toutes les sessions
   * 
   * QUAND : Appelé automatiquement si content-links.json est vide au démarrage
   * COMMENT : Parcourt toutes les sessions et réindexe originContent + linkedContent
   * DURÉE : ~100ms pour 50 sessions
   */
  rebuildContentLinks = async (sessions = null) => {
    if (!this.contentLinks) {
      console.warn('⚠️ ContentLinks non disponible, skip rebuild');
      return;
    }
    
    const sessionsToIndex = sessions || this.appState.sessions;
    
    console.log(`🔧 Reconstruction ContentLinks depuis ${sessionsToIndex.length} sessions...`);
    
    let originCount = 0;
    let linkCount = 0;
    
    try {
      // Vider l'index existant
      this.contentLinks.links.clear();
      this.contentLinks.sessionIndex.clear();
      this.contentLinks.contentIndex.clear();
      this.contentLinks.messageIndex.clear();
      
      // Parcourir chaque session
      for (const session of sessionsToIndex) {
        
        // 1. Indexer originContent
        if (session.originContent) {
          await this.contentLinks.addLink({
            sessionId: session.id,
            messageId: `${session.id}-origin`,  // ID virtuel pour origine
            contentType: session.originContent.type,
            contentId: session.originContent.id,
            contentTitle: session.originContent.title,
            linkedBy: session.user
          });
          originCount++;
        }
        
        // 2. Indexer liens dans les messages
        if (session.notes) {
          for (const message of session.notes) {
            if (message.linkedContent) {
              await this.contentLinks.addLink({
                sessionId: session.id,
                messageId: message.id,
                contentType: message.linkedContent.type,
                contentId: message.linkedContent.id,
                contentTitle: message.linkedContent.title,
                linkedBy: message.author
              });
              linkCount++;
            }
          }
        }
      }
      
      console.log(`✅ ContentLinks reconstruit : ${originCount} origines + ${linkCount} liens = ${originCount + linkCount} total`);
      
    } catch (error) {
      console.error('❌ Erreur reconstruction ContentLinks:', error);
    }
  }

  // ========================================
  // SESSIONS - CRUD
  // ========================================

  /**
   * Créer une nouvelle session
   * 
   * ⭐ v3.7 : Appelle contentLinks.addLink() pour indexer l'origine
   */
  createSession = async (gameData, initialText = null, sourcePhoto = null) => {
    this.updateState({ isCreatingSession: true });
    
    try {
      const now = new Date().toISOString();
      const baseTimestamp = Date.now();
      
      // ========================================
      // DÉTERMINER ORIGINCONTENT
      // ========================================
      let originContent = null;
      let momentId = null;
      
      if (sourcePhoto) {
        // Session créée depuis une photo
        originContent = {
          type: 'photo',
          id: sourcePhoto.google_drive_id || sourcePhoto.id,
          title: sourcePhoto.filename || sourcePhoto.name || 'photo.jpg',
          filename: sourcePhoto.filename || sourcePhoto.name,
          isMastodonPhoto: !!sourcePhoto.url && !sourcePhoto.filename
        };
        momentId = gameData.id;
        
      } else if (gameData.systemMessage?.includes('article')) {
        // Session créée depuis un post
        originContent = {
          type: 'post',
          id: gameData.id,
          title: gameData.title
        };
        momentId = gameData.momentId || gameData.id;
        
      } else {
        // Session créée depuis un moment
        originContent = {
          type: 'moment',
          id: gameData.id,
          title: gameData.title
        };
        momentId = gameData.id;
      }
      
      // ========================================
      // CRÉER SESSION
      // ========================================
      const newSession = {
        id: `sid_${baseTimestamp}`, 
        momentId: momentId,
        originContent: originContent,
        themeIds: [],
        
        // Compatibilité legacy
        gameId: momentId,  // DEPRECATED
        
        gameTitle: gameData.title,
        subtitle: `Conversation sur ${gameData.title}`, 
        createdAt: now,
        user: this.appState.currentUser,
        notes: [],
      };
      
      // ========================================
      // AJOUTER MESSAGES INITIAUX
      // ========================================
      if (sourcePhoto) {
        // Message photo utilisateur
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
      
      // ========================================
      // SAUVEGARDER + INDEXER
      // ========================================
      
      // 1. Sauver session (source de vérité)
      await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
      
      // 2. ⭐ NEW Phase 19D : Indexer dans ContentLinks
      if (this.contentLinks && originContent) {
        try {
          await this.contentLinks.addLink({
            sessionId: newSession.id,
            messageId: `${newSession.id}-origin`,  // ID virtuel pour origine
            contentType: originContent.type,
            contentId: originContent.id,
            contentTitle: originContent.title,
            linkedBy: this.appState.currentUser
          });
          console.log('🔗 Origine indexée dans ContentLinks');
        } catch (error) {
          console.error('❌ Erreur indexation origine:', error);
          // Non-bloquant : la session est sauvegardée même si indexation échoue
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Mettre à jour state React
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

  /**
   * Mettre à jour une session existante
   */
  updateSession = async (sessionToUpdate) => {
    await this.driveSync.saveFile(`session_${sessionToUpdate.id}.json`, sessionToUpdate);
    const updatedSessions = this.appState.sessions.map(s => 
      s.id === sessionToUpdate.id ? sessionToUpdate : s
    );
    const updatedCurrentChat = this.appState.currentChatSession?.id === sessionToUpdate.id ? 
      sessionToUpdate : this.appState.currentChatSession;
    this.updateState({ sessions: updatedSessions, currentChatSession: updatedCurrentChat });
  }

  /**
   * Supprimer une session
   * 
   * ⭐ v3.7 : Appelle contentLinks.removeLinksForSession() pour nettoyer l'index
   */
  deleteSession = async (sessionId) => {
    // ⭐ NEW Phase 19D : Supprimer liens de l'index AVANT de supprimer la session
    if (this.contentLinks) {
      try {
        await this.contentLinks.removeLinksForSession(sessionId);
        console.log('🗑️ Liens supprimés de ContentLinks');
      } catch (error) {
        console.error('❌ Erreur suppression liens:', error);
        // Non-bloquant
      }
    }
    
    // Supprimer fichier + state
    await this.driveSync.deleteFile(`session_${sessionId}.json`);
    const filteredSessions = this.appState.sessions.filter(s => s.id !== sessionId);
    this.updateState({ sessions: filteredSessions });
  }

  /**
   * Ajouter un message à une session
   * 
   * ⭐ v3.7 : Appelle contentLinks.addLink() si linkedContent présent
   */
  addMessageToSession = async (sessionId, messageContent, photoData = null, linkedContent = null) => {
    console.log('=== dataManager.addMessageToSession ===');
    console.log('📨 sessionId:', sessionId);
    console.log('📨 messageContent:', messageContent);
    console.log('📨 photoData reçu:', photoData);
    console.log('📨 linkedContent reçu:', linkedContent);
    
    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error('❌ Session introuvable:', sessionId);
      return;
    }
    
    // ========================================
    // CRÉER MESSAGE
    // ========================================
    const newMessage = {
      id: `msg_${Date.now()}`, 
      author: this.appState.currentUser,
      content: messageContent, 
      timestamp: new Date().toISOString(), 
      edited: false,
      ...(photoData && { photoData: photoData }),
      ...(linkedContent && { linkedContent })
    };
    
    console.log('💾 Message créé:', newMessage);
    console.log('💾 Message a photoData?', 'photoData' in newMessage);
    console.log('💾 Message a linkedContent?', 'linkedContent' in newMessage);
    
    // ========================================
    // SAUVEGARDER + INDEXER
    // ========================================
    
    // 1. Sauver message (source de vérité)
    const updatedSession = { ...session, notes: [...session.notes, newMessage] };
    await this.updateSession(updatedSession);
    
    // 2. ⭐ NEW Phase 19D : Indexer dans ContentLinks si lien présent
    if (this.contentLinks && linkedContent) {
      try {
        await this.contentLinks.addLink({
          sessionId: session.id,
          messageId: newMessage.id,
          contentType: linkedContent.type,
          contentId: linkedContent.id,
          contentTitle: linkedContent.title,
          linkedBy: this.appState.currentUser
        });
        console.log('🔗 Lien indexé dans ContentLinks');
      } catch (error) {
        console.error('❌ Erreur indexation lien:', error);
        // Non-bloquant : le message est sauvegardé même si indexation échoue
      }
    }
    
    console.log('✅ Session mise à jour');
    
    // ========================================
    // NOTIFICATIONS
    // ========================================
    const notif = this.notificationManager.getNotificationForSession(
      sessionId, 
      this.appState.currentUser
    );
    if (notif) {
      await this.notificationManager.markAsRead(notif.id);
    }
  }

  // ========================================
  // SESSIONS - NAVIGATION
  // ========================================

  openChatSession = (session) => {
    this.updateState({ currentChatSession: session, currentPage: 'chat' });
    
    // Marquer notification comme lue à l'ouverture
    const notif = this.notificationManager.getNotificationForSession(
      session.id, 
      this.appState.currentUser.id
    );
    if (notif) {
      this.notificationManager.markAsRead(notif.id);
      console.log('✅ Notification marquée lue à l\'ouverture de la session');
    }
  }

  closeChatSession = () => {
    this.updateState({ currentChatSession: null, currentPage: 'sessions' });
  }

  // ========================================
  // SESSIONS - STATUS & NOTIFS
  // ========================================
  
  /**
   * Marquer une session comme terminée/archivée
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
        console.log('✅ Notification envoyée:', result.notification);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // MASTER INDEX
  // ========================================
  
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

  regenerateMasterIndex = async () => {
    try {
      console.log('🔧 DataManager: Régénération complète du masterIndex...');
      
      if (!window.masterIndexGenerator) {
        throw new Error('masterIndexGenerator n\'est pas disponible');
      }
      
      const result = await window.masterIndexGenerator.generateMomentsStructure();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur de génération');
      }
      
      console.log('✅ Index régénéré sur Drive');
      
      // Recharger le nouveau fichier
      await new Promise(resolve => setTimeout(resolve, 500));
      const reloadResult = await this.reloadMasterIndex();
      
      return reloadResult;
      
    } catch (error) {
      console.error('❌ Erreur régénération masterIndex:', error);
      return { success: false, error: error.message };
    }
  }

  saveMasterIndex = async (updatedMasterIndex) => {
    try {
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', updatedMasterIndex);
      this.updateState({ masterIndex: updatedMasterIndex });
      console.log('✅ MasterIndex sauvegardé');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur sauvegarde masterIndex:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // USER & PAGE
  // ========================================

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

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
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

// ========================================
// EXPORT & GLOBAL
// ========================================

export const dataManager = new DataManager();

if (typeof window !== 'undefined') {
  window.dataManager = dataManager;
  console.log('🌍 DataManager disponible via window.dataManager');
}