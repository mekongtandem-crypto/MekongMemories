/**
 * ==============================================================================
 * DataManager v3.8 - Logger intégré + Code nettoyé
 * ==============================================================================
 * 
 * RESPONSABILITÉS :
 * - Gestion centralisée de l'état application (sessions, masterIndex, user)
 * - CRUD sessions (create, update, delete)
 * - Synchronisation Drive via DriveSync
 * - Pub/Sub pour React (listeners)
 * - Indexation ContentLinks (liens bidirectionnels)
 * 
 * ARCHITECTURE :
 * DataManager ↔ useAppState ↔ React Components
 * 
 * ==============================================================================
 */

import { logger } from '../utils/logger.js';

class DataManager {
  
  // ========================================
  // CONSTRUCTOR
  // ========================================
  
  constructor() {
    // Dépendances injectées
    this.connectionManager = null;
    this.driveSync = null;
    this.stateManager = null;
    this.contentLinks = null;
    this.notificationManager = null;
    
    // État application
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
      // ✨ Spinner générique pour opérations async
      loadingOperation: {
        active: false,
        message: 'Chargement...',
        subMessage: 'Enregistrement sur Google Drive',
        variant: 'spin' // 'spin' | 'bounce' | 'monkey'
      }
    };
    
    // Pub/Sub listeners
    this.listeners = new Set();

    logger.info('DataManager v3.8: Ready');
  }

  // ========================================
  // INITIALISATION
  // ========================================
  
  initializeDependencies(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.driveSync = dependencies.driveSync;
    this.stateManager = dependencies.stateManager;
    this.notificationManager = dependencies.notificationManager;
    this.contentLinks = dependencies.contentLinks || window.contentLinks;
    
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    
    logger.debug('Dependencies injected');
    
    if (this.contentLinks) {
      logger.debug('ContentLinks disponible');
    } else {
      logger.warn('ContentLinks non trouvé');
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

  // ========================================
  // SYNCHRONISATION INITIALE
  // ========================================
  
  synchronizeInitialData = async () => {
    logger.info('Synchronisation initiale...');
    this.updateState({ isLoading: true });
    
    try {
      // 1. Charger user en cache
      const cachedUser = await this.stateManager.get('mekong_currentUser');
      if (cachedUser) {
        logger.debug(`User en cache: ${cachedUser}`);
      }
      
      // 2. Charger données Drive
      const loadedFiles = await this.driveSync.loadAllData();

      // 3. Parser masterIndex
      let masterIndex = loadedFiles?.masterIndex ? 
        (typeof loadedFiles.masterIndex === 'string' 
          ? JSON.parse(loadedFiles.masterIndex) 
          : loadedFiles.masterIndex
        ) : null;

      // 4. Enrichir moments avec IDs si absents
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
        logger.debug(`${masterIndex.moments.length} moments chargés`);
      }

      const sessions = loadedFiles.sessions || [];

      // 5. Init notifications
      await this.notificationManager.init();
      
      // 6. Init ContentLinks + rebuild si vide
      if (this.contentLinks) {
        await this.contentLinks.init();
        
        if (this.contentLinks.links.size === 0 && sessions.length > 0) {
          logger.info('ContentLinks vide → Reconstruction auto');
          await this.rebuildContentLinks(sessions);
        }
      }

      // 7. Mettre à jour état
      this.updateState({
        masterIndex, 
        sessions, 
        currentUser: cachedUser || null,
        isLoading: false, 
        isInitialized: true, 
        error: null
      });
      
      logger.success('Synchro terminée', { sessions: sessions.length });
      
    } catch (error) {
      logger.error('Erreur synchronisation', error);
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
   * Reconstruit l'index ContentLinks depuis toutes les sessions
   * Appelé automatiquement si content-links.json est vide
   */
  rebuildContentLinks = async (sessions = null) => {
    if (!this.contentLinks) {
      logger.warn('ContentLinks non disponible, skip rebuild');
      return;
    }
    
    const sessionsToIndex = sessions || this.appState.sessions;
    
    logger.info(`Reconstruction ContentLinks: ${sessionsToIndex.length} sessions`);
    
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
            messageId: `${session.id}-origin`,
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
      
      logger.success('ContentLinks reconstruit', { 
        origines: originCount, 
        liens: linkCount, 
        total: originCount + linkCount 
      });
      
    } catch (error) {
      logger.error('Erreur reconstruction ContentLinks', error);
    }
  }

  // ========================================
  // SESSIONS - CRUD
  // ========================================

  /**
   * Créer une nouvelle session
   * 
   * @param {Object} gameData - Données du moment/post/photo
   * @param {string} initialText - Texte initial (optionnel)
   * @param {Object} sourcePhoto - Photo source si session depuis photo
   * @returns {Promise<Object>} Session créée
   */
  createSession = async (gameData, initialText = null, sourcePhoto = null) => {
    this.updateState({
      loadingOperation: {
        active: true,
        message: 'Création de la session...',
        subMessage: 'Enregistrement sur Google Drive',
        variant: 'monkey'
      }
    });
    
    try {
      const now = new Date().toISOString();
      const baseTimestamp = Date.now();
      
      // ========================================
      // 1. DÉTERMINER ORIGINCONTENT
      // ========================================
      
      let originContent = null;
      let momentId = null;
      
      if (sourcePhoto) {
        // Session depuis photo
        originContent = {
          type: 'photo',
          id: sourcePhoto.google_drive_id || sourcePhoto.id,
          title: sourcePhoto.filename || sourcePhoto.name || 'photo.jpg',
          filename: sourcePhoto.filename || sourcePhoto.name,
          isMastodonPhoto: !!sourcePhoto.url && !sourcePhoto.filename
        };
        momentId = gameData.id;
        
      } else if (gameData.systemMessage?.includes('article')) {
        // Session depuis post
        originContent = {
          type: 'post',
          id: gameData.id,
          title: gameData.title
        };
        momentId = gameData.momentId || gameData.id;
        
      } else {
        // Session depuis moment
        originContent = {
          type: 'moment',
          id: gameData.id,
          title: gameData.title
        };
        momentId = gameData.id;
      }
      
      // ========================================
      // 2. CRÉER SESSION
      // ========================================
      
      const newSession = {
        id: `sid_${baseTimestamp}`, 
        momentId: momentId,
        originContent: originContent,
        themeIds: [],
        gameId: momentId,  // Legacy
        gameTitle: gameData.title,
        subtitle: `Conversation sur ${gameData.title}`, 
        createdAt: now,
        user: this.appState.currentUser,
        notes: [],
      };
      
      // ========================================
      // 3. AJOUTER MESSAGES INITIAUX
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
        
        logger.debug('Session photo créée', { 
          momentId, 
          originType: originContent.type 
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
        
        logger.debug('Session créée', { 
          momentId, 
          originType: originContent.type 
        });
      }
      
      // ========================================
      // 4. SAUVEGARDER + INDEXER
      // ========================================
      
      // 4.1 Sauver session (source de vérité)
      await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
      
      // 4.2 Indexer dans ContentLinks
      if (this.contentLinks && originContent) {
        try {
          await this.contentLinks.addLink({
            sessionId: newSession.id,
            messageId: `${newSession.id}-origin`,
            contentType: originContent.type,
            contentId: originContent.id,
            contentTitle: originContent.title,
            linkedBy: this.appState.currentUser
          });
          logger.debug('Origine indexée dans ContentLinks');
        } catch (error) {
          logger.error('Erreur indexation origine', error);
          // Non-bloquant
        }
      }
      
      // 4.3 Délai technique
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4.4 Mettre à jour state React
      this.updateState({
        sessions: [...this.appState.sessions, newSession],
        loadingOperation: {
          active: false,
          message: 'Chargement...',
          subMessage: 'Enregistrement sur Google Drive',
          variant: 'spin'
        }
      });
      
      logger.success('Session créée', { messages: newSession.notes.length });
      return newSession;
      
    } catch (error) {
      logger.error('Erreur création session', error);
      this.updateState({
        loadingOperation: {
          active: false,
          message: 'Chargement...',
          subMessage: 'Enregistrement sur Google Drive',
          variant: 'spin'
        }
      });
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
    
    const updatedCurrentChat = this.appState.currentChatSession?.id === sessionToUpdate.id 
      ? sessionToUpdate 
      : this.appState.currentChatSession;
    
    this.updateState({ 
      sessions: updatedSessions, 
      currentChatSession: updatedCurrentChat 
    });
  }

  /**
   * Supprimer une session
   */
  deleteSession = async (sessionId) => {
    // 1. Supprimer liens de l'index
    if (this.contentLinks) {
      try {
        await this.contentLinks.removeLinksForSession(sessionId);
        logger.debug('Liens supprimés de ContentLinks');
      } catch (error) {
        logger.error('Erreur suppression liens', error);
        // Non-bloquant
      }
    }
    
    // 2. Supprimer fichier + state
    await this.driveSync.deleteFile(`session_${sessionId}.json`);
    const filteredSessions = this.appState.sessions.filter(s => s.id !== sessionId);
    this.updateState({ sessions: filteredSessions });
  }

  /**
   * Ajouter un message à une session
   */
  addMessageToSession = async (sessionId, messageContent, photoData = null, linkedContent = null) => {
    logger.debug('addMessageToSession', {
      sessionId,
      hasPhoto: !!photoData,
      hasLink: !!linkedContent
    });

    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (!session) {
      logger.error('Session introuvable', sessionId);
      return;
    }

    // ✨ Activer le spinner
    this.updateState({
      loadingOperation: {
        active: true,
        message: 'Envoi du message...',
        subMessage: 'Enregistrement sur Google Drive',
        variant: 'spin'
      }
    });

    try {
      // ========================================
      // 1. CRÉER MESSAGE
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

      // ========================================
      // 2. SAUVEGARDER + INDEXER
      // ========================================

      // 2.1 Sauver message (source de vérité)
      const updatedSession = { ...session, notes: [...session.notes, newMessage] };
      await this.updateSession(updatedSession);

      // 2.2 Indexer dans ContentLinks si lien présent (FIX syntaxe: NEW → Phase)
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
          logger.debug('Lien indexé dans ContentLinks');
        } catch (error) {
          logger.error('Erreur indexation lien', error);
          // Non-bloquant
        }
      }

      logger.debug('Session mise à jour');

      // ========================================
      // 3. NOTIFICATIONS
      // ========================================

      const notif = this.notificationManager.getNotificationForSession(
        sessionId,
        this.appState.currentUser
      );

      if (notif) {
        await this.notificationManager.markAsRead(notif.id);
      }

      // ✨ Désactiver le spinner
      this.updateState({
        loadingOperation: {
          active: false,
          message: 'Chargement...',
          subMessage: 'Enregistrement sur Google Drive',
          variant: 'spin'
        }
      });

    } catch (error) {
      logger.error('Erreur lors de l\'ajout du message', error);
      // ✨ Désactiver le spinner en cas d'erreur
      this.updateState({
        loadingOperation: {
          active: false,
          message: 'Chargement...',
          subMessage: 'Enregistrement sur Google Drive',
          variant: 'spin'
        }
      });
      throw error;
    }
  }

  // ========================================
  // SESSIONS - NAVIGATION
  // ========================================

  openChatSession = (session) => {
    this.updateState({ 
      currentChatSession: session, 
      currentPage: 'chat' 
    });
    
    // Marquer notification comme lue
    const notif = this.notificationManager.getNotificationForSession(
      session.id, 
      this.appState.currentUser.id
    );
    
    if (notif) {
      this.notificationManager.markAsRead(notif.id);
      logger.debug('Notification marquée lue');
    }
  }

  closeChatSession = () => {
    this.updateState({ 
      currentChatSession: null, 
      currentPage: 'sessions' 
    });
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
        logger.success('Notification envoyée', { to: toUserId });
      }
      
      return result;
    } catch (error) {
      logger.error('Erreur envoi notification', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // MASTER INDEX
  // ========================================
  
  /**
   * Recharger le MasterIndex depuis Drive
   */
  reloadMasterIndex = async () => {
    try {
      logger.info('Rechargement MasterIndex...');
      
      const masterIndexData = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
      
      if (masterIndexData) {
        await this.stateManager.set('master_index_v3', masterIndexData);
        await this.stateManager.set('master_index_loaded_at', new Date().toISOString());
        
        this.updateState({ masterIndex: masterIndexData });
        
        logger.success('MasterIndex rechargé');
        return { success: true };
      } else {
        throw new Error("Fichier masterIndex introuvable");
      }
    } catch (error) {
      logger.error('Erreur rechargement MasterIndex', error);
      this.updateState({ error: `Reload Error: ${error.message}` });
      return { success: false, error };
    }
  }

  /**
   * Régénérer le MasterIndex complet
   */
  regenerateMasterIndex = async () => {
    try {
      logger.info('Régénération complète MasterIndex...');
      
      if (!window.masterIndexGenerator) {
        throw new Error('masterIndexGenerator non disponible');
      }
      
      const result = await window.masterIndexGenerator.generateMomentsStructure();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur de génération');
      }
      
      logger.success('Index régénéré sur Drive');
      
      // Recharger le nouveau fichier
      await new Promise(resolve => setTimeout(resolve, 500));
      const reloadResult = await this.reloadMasterIndex();
      
      return reloadResult;
      
    } catch (error) {
      logger.error('Erreur régénération MasterIndex', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sauvegarder le MasterIndex
   */
  saveMasterIndex = async (updatedMasterIndex) => {
    try {
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', updatedMasterIndex);
      this.updateState({ masterIndex: updatedMasterIndex });
      logger.success('MasterIndex sauvegardé');
      return { success: true };
    } catch (error) {
      logger.error('Erreur sauvegarde MasterIndex', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // USER & PAGE
  // ========================================

  setCurrentUser = (userId) => {
    logger.debug(`Changement utilisateur: ${userId}`);
    this.stateManager.set('mekong_currentUser', userId);
    this.updateState({ currentUser: userId });
  }

  updateCurrentPage = (pageId) => {
    if (this.appState.currentPage !== pageId) {
      logger.debug(`Changement page: ${pageId}`);
      this.updateState({ currentPage: pageId });
    }
  }

  // ========================================
  // STATE MANAGEMENT - PUB/SUB
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
}