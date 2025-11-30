/**
 * ==============================================================================
 * DataManager v3.9 - Import de photos + MasterIndex éditable
 * ==============================================================================
 *
 * RESPONSABILITÉS :
 * - Gestion centralisée de l'état application (sessions, masterIndex, user)
 * - CRUD sessions (create, update, delete)
 * - Synchronisation Drive via DriveSync
 * - Pub/Sub pour React (listeners)
 * - Indexation ContentLinks (liens bidirectionnels)
 * - Import de photos et ajout au masterIndex (v3.0)
 *
 * ARCHITECTURE :
 * DataManager ↔ useAppState ↔ React Components
 *
 * NOUVELLES FONCTIONNALITÉS v3.0 :
 * - addImportedPhotoToMasterIndex() : Ajout photos importées au masterIndex
 * - Support création de nouveaux moments
 * - Support posts avec photos (caption)
 * - Photos standalone dans dayPhotos
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

      let sessions = loadedFiles.sessions || [];

      // 🔄 Migration : Convertir les anciennes sessions avec 'completed' en 'archived'
      sessions = sessions.map(session => {
        if (session.completed && !session.archived) {
          logger.info(`Migration session ${session.id}: completed → archived`);
          return { ...session, archived: true, completed: undefined };
        }
        return session;
      });

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
    // ⭐ v2.9g : Ajouter updatedAt automatiquement
    const sessionWithTimestamp = {
      ...sessionToUpdate,
      updatedAt: new Date().toISOString()
    };

    await this.driveSync.saveFile(`session_${sessionWithTimestamp.id}.json`, sessionWithTimestamp);

    const updatedSessions = this.appState.sessions.map(s =>
      s.id === sessionWithTimestamp.id ? sessionWithTimestamp : s
    );

    const updatedCurrentChat = this.appState.currentChatSession?.id === sessionWithTimestamp.id
      ? sessionWithTimestamp
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
    // ✨ Activer le spinner
    this.setLoadingOperation(true, 'Suppression de la session...', 'Enregistrement sur Google Drive', 'monkey');

    try {
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

      // ⭐ v2.9g : Mettre à jour currentChatSession si c'est la session supprimée
      const updatedCurrentChat = this.appState.currentChatSession?.id === sessionId
        ? null
        : this.appState.currentChatSession;

      this.updateState({
        sessions: filteredSessions,
        currentChatSession: updatedCurrentChat
      });

      // ✨ Désactiver le spinner
      this.setLoadingOperation(false);
    } catch (error) {
      logger.error('Erreur suppression session', error);
      // ✨ Désactiver le spinner en cas d'erreur
      this.setLoadingOperation(false);
      throw error;
    }
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

  /**
   * Ajouter une photo importée au MasterIndex (v3.0e)
   * @param {Object} photoData - Métadonnées photo (google_drive_id, filename, etc.)
   * @param {Object} conversionData - { momentId, newMoment: { title, date, jnnn }, noteTitle, noteContent }
   * @returns {Promise<Object>} { success, momentId, photoAdded }
   */
  addImportedPhotoToMasterIndex = async (photoData, conversionData) => {
    try {
      logger.info('📝 Ajout photo importée au masterIndex', { photoData, conversionData });

      // 1. Charger le masterIndex actuel
      const masterIndex = { ...this.appState.masterIndex };
      if (!masterIndex || !masterIndex.moments) {
        throw new Error('MasterIndex non disponible');
      }

      let targetMoment;
      let momentId;

      // 2a. Créer un nouveau moment si demandé
      if (conversionData.newMoment) {
        const { title, date, jnnn } = conversionData.newMoment;

        // Générer ID unique pour le moment
        momentId = `moment_imported_${Date.now()}`;

        targetMoment = {
          id: momentId,
          title: title,
          date: date,
          jnnn: jnnn || 'IMP',  // ⭐ v2.8e : "IMP" par défaut
          description: '',
          location: '',
          source: 'imported',  // ⭐ v2.9n2 : Marquer comme importé pour activer boutons édition
          dayPhotos: [],
          posts: [],
          themes: []
        };

        // Ajouter le moment à la liste
        masterIndex.moments.push(targetMoment);
        logger.info(`✅ Nouveau moment créé: ${momentId} (jnnn: ${jnnn || 'IMP'})`);
      }
      // 2b. Trouver le moment existant
      else {
        momentId = conversionData.momentId;
        targetMoment = masterIndex.moments.find(m => m.id === momentId);

        if (!targetMoment) {
          throw new Error(`Moment ${momentId} introuvable`);
        }

        logger.info(`✅ Moment trouvé: ${momentId}`);
      }

      // 3. Préparer l'objet photo pour le masterIndex
      const photoForMasterIndex = {
        google_drive_id: photoData.google_drive_id,
        filename: photoData.filename,
        url: photoData.url,
        source: 'imported',
        uploadedBy: photoData.uploadedBy,
        uploadedAt: photoData.uploadedAt,
        width: photoData.width || null,
        height: photoData.height || null,
        mime_type: photoData.type || 'image/jpeg'
      };

      // 4. Déterminer si c'est une Note de photo (texte présent)
      const isPhotoNote = conversionData.noteTitle || conversionData.noteContent;

      // ⭐ v2.8e : Garder contentId et contentType pour ContentLinks
      let contentId;
      let contentType;

      // 4a. Si texte → créer un post avec photo (Note de photo)
      if (isPhotoNote) {
        const newPost = {
          id: `post_imported_${Date.now()}`,
          type: 'post',
          category: 'user_added',
          title: conversionData.noteTitle || '',
          content: conversionData.noteContent || '',
          date: new Date().toISOString(),
          url: null,
          source: 'imported',
          photos: [photoForMasterIndex],
          uploadedBy: photoData.uploadedBy
        };

        if (!targetMoment.posts) {
          targetMoment.posts = [];
        }
        targetMoment.posts.push(newPost);

        // ⭐ v2.8e : Pour ContentLinks
        contentId = newPost.id;
        contentType = 'post';

        logger.info(`✅ Note de photo créée: ${newPost.id} (titre: "${conversionData.noteTitle || 'sans titre'}")`);
      }
      // 4b. Sinon → ajouter photo standalone dans dayPhotos
      else {
        if (!targetMoment.dayPhotos) {
          targetMoment.dayPhotos = [];
        }
        targetMoment.dayPhotos.push(photoForMasterIndex);

        // ⭐ v2.8e : Pour ContentLinks
        contentId = photoForMasterIndex.google_drive_id;
        contentType = 'photo';

        logger.info(`✅ Photo simple ajoutée à dayPhotos`);
      }

      // 5. Sauvegarder le masterIndex modifié
      await this.saveMasterIndex(masterIndex);

      logger.success('🎉 Photo importée ajoutée au masterIndex avec succès');

      return {
        success: true,
        momentId: momentId,
        photoAdded: true,
        contentId: contentId,  // ⭐ v2.8e : Pour ContentLinks
        contentType: contentType  // ⭐ v2.8e : 'post' ou 'photo'
      };

    } catch (error) {
      logger.error('❌ Erreur ajout photo au masterIndex:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================
  // CRUD MOMENTS, POSTS, PHOTOS (v2.9)
  // ========================================

  /**
   * Mettre à jour un moment (seulement source='imported')
   * @param {Object} updatedMoment - Moment avec modifications
   */
  updateMoment = async (updatedMoment) => {
    logger.info('Mise à jour moment:', updatedMoment.id);

    this.setLoadingOperation(true, 'Modification du moment...', 'Enregistrement sur Google Drive', 'spin');

    try {
      // Vérifier que c'est un moment importé
      if (updatedMoment.source !== 'imported') {
        throw new Error('Seuls les moments importés peuvent être modifiés');
      }

      // Mettre à jour dans le masterIndex
      const masterIndex = this.appState.masterIndex;
      const momentIndex = masterIndex.moments.findIndex(m => m.id === updatedMoment.id);

      if (momentIndex === -1) {
        throw new Error('Moment introuvable');
      }

      masterIndex.moments[momentIndex] = updatedMoment;

      // Sauvegarder sur Drive
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

      // Mettre à jour l'état
      this.updateState({ masterIndex });

      this.setLoadingOperation(false);
      logger.success('Moment mis à jour');

      return { success: true };
    } catch (error) {
      logger.error('Erreur mise à jour moment:', error);
      this.setLoadingOperation(false);
      throw error;
    }
  }

  /**
   * Supprimer un moment (seulement source='imported')
   * @param {string} momentId - ID du moment à supprimer
   */
  deleteMoment = async (momentId, cascadeOptions = null) => {
    logger.info('Suppression moment:', momentId, 'cascade:', cascadeOptions);

    // ⭐ v2.9s : Message adapté selon action (effacement mémoire vs suppression Drive)
    const spinnerMessage = cascadeOptions?.deleteFiles
      ? 'Suppression du souvenir et fichiers...'
      : 'Effacement du souvenir...';
    this.setLoadingOperation(true, spinnerMessage, 'Enregistrement sur Google Drive', 'monkey');

    try {
      const masterIndex = this.appState.masterIndex;
      const moment = masterIndex.moments.find(m => m.id === momentId);

      if (!moment) {
        throw new Error('Moment introuvable');
      }

      if (moment.source !== 'imported') {
        throw new Error('Seuls les moments importés peuvent être supprimés');
      }

      // ⭐ v2.9n : Vérifier cross-références AVANT suppression Drive
      if (cascadeOptions?.deleteFiles) {
        const deleteNoteIds = cascadeOptions.deleteNotes
          ? (moment.posts || [])
              .filter(p => p.category === 'user_added')
              .map(p => p.id)
          : [];

        const photoIds = this.collectMomentPhotos(moment, deleteNoteIds);

        // Vérifier chaque photo
        const allCrossRefs = [];
        for (const photoId of photoIds) {
          const crossRefs = this.checkPhotoCrossReferences(photoId, momentId);
          const sessionRefs = this.checkPhotoInSessions(photoId); // ⭐ v2.9n3 : Vérifier sessions aussi

          if (crossRefs.length > 0 || sessionRefs.length > 0) {
            allCrossRefs.push({ photoId, crossRefs, sessionRefs });
          }
        }

        if (allCrossRefs.length > 0) {
          this.setLoadingOperation(false);
          logger.warn('⚠️ Photos utilisées ailleurs:', allCrossRefs);
          return {
            success: false,
            reason: 'cross_references',
            allCrossRefs
          };
        }
      }

      // ⭐ v2.9j : Suppression en cascade des enfants
      if (cascadeOptions) {
        // 1. Supprimer les Note de photos (category='user_added')
        if (cascadeOptions.deleteNotes && moment.posts) {
          const notesToDelete = moment.posts.filter(post => post.category === 'user_added');
          logger.info(`🗑️ Suppression de ${notesToDelete.length} note(s)...`);
          for (const note of notesToDelete) {
            await this.deletePost(momentId, note.id, false);  // false = pas de reload
          }
        }

        // 2. Supprimer les Photos importées (source='imported')
        if (cascadeOptions.deletePhotos && moment.dayPhotos) {
          const photosToDelete = moment.dayPhotos.filter(photo => photo.source === 'imported');
          logger.info(`🗑️ Suppression de ${photosToDelete.length} photo(s)...`);
          for (const photo of photosToDelete) {
            // Passer deleteFromDrive=cascadeOptions.deleteFiles
            const result = await this.deletePhoto(momentId, photo.google_drive_id || photo.filename, photo.filename, cascadeOptions.deleteFiles, false);  // false = pas de reload

            // ⭐ v2.9n : Gérer cas improbable de cross-ref (déjà vérifié en amont)
            if (result && !result.success && result.reason === 'cross_references') {
              logger.warn('⚠️ Cross-ref détectée durant cascade (ne devrait pas arriver):', result.crossRefs);
              // Continue quand même (on a déjà vérifié en amont, donc c'est incohérent)
            }
          }
        }
      }

      // Supprimer tous les liens ContentLinks associés
      if (this.contentLinks) {
        try {
          const links = this.contentLinks.getLinksForContent('moment', momentId);
          for (const link of links) {
            await this.contentLinks.removeLink(link.sessionId, 'moment', momentId);
          }
          logger.debug('Liens ContentLinks supprimés');
        } catch (error) {
          logger.error('Erreur suppression liens:', error);
          // Non-bloquant
        }
      }

      // Retirer du masterIndex
      masterIndex.moments = masterIndex.moments.filter(m => m.id !== momentId);

      // Sauvegarder sur Drive
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

      // Mettre à jour l'état
      this.updateState({ masterIndex });

      this.setLoadingOperation(false);
      logger.success('Moment supprimé' + (cascadeOptions ? ' (avec enfants)' : ''));

      return { success: true };
    } catch (error) {
      logger.error('Erreur suppression moment:', error);
      this.setLoadingOperation(false);
      throw error;
    }
  }

  /**
   * Mettre à jour un post (seulement category='user_added')
   * @param {string} momentId - ID du moment parent
   * @param {Object} updatedPost - Post avec modifications
   */
  updatePost = async (momentId, updatedPost) => {
    logger.info('Mise à jour post:', updatedPost.id);

    this.setLoadingOperation(true, 'Modification de la Note de photo...', 'Enregistrement sur Google Drive', 'spin');

    try {
      // Vérifier que c'est un post user_added
      if (updatedPost.category !== 'user_added') {
        throw new Error('Seuls les posts user_added peuvent être modifiés');
      }

      const masterIndex = this.appState.masterIndex;
      const moment = masterIndex.moments.find(m => m.id === momentId);

      if (!moment) {
        throw new Error('Moment parent introuvable');
      }

      const postIndex = moment.posts.findIndex(p => p.id === updatedPost.id);

      if (postIndex === -1) {
        throw new Error('Post introuvable');
      }

      moment.posts[postIndex] = updatedPost;

      // Sauvegarder sur Drive
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

      // Mettre à jour l'état
      this.updateState({ masterIndex });

      this.setLoadingOperation(false);
      logger.success('Post mis à jour');

      return { success: true };
    } catch (error) {
      logger.error('Erreur mise à jour post:', error);
      this.setLoadingOperation(false);
      throw error;
    }
  }

  /**
   * Supprimer un post (seulement category='user_added')
   * @param {string} momentId - ID du moment parent
   * @param {string} postId - ID du post à supprimer
   */
  deletePost = async (momentId, postId, cascadeOptions = null, showSpinner = true) => {
    logger.info('Suppression post:', postId);

    // ⭐ v2.9o : Si cascadeOptions est un booléen (ancien API), le convertir en showSpinner
    if (typeof cascadeOptions === 'boolean') {
      showSpinner = cascadeOptions;
      cascadeOptions = null;
    }

    if (showSpinner) {
      // ⭐ v2.9s : Message adapté selon action
      const spinnerMessage = cascadeOptions?.deleteFiles
        ? 'Suppression de la note et fichiers...'
        : 'Effacement de la note...';
      this.setLoadingOperation(true, spinnerMessage, 'Enregistrement sur Google Drive', 'monkey');
    }

    try {
      const masterIndex = this.appState.masterIndex;
      const moment = masterIndex.moments.find(m => m.id === momentId);

      if (!moment) {
        throw new Error('Moment parent introuvable');
      }

      const post = moment.posts.find(p => p.id === postId);

      if (!post) {
        throw new Error('Post introuvable');
      }

      if (post.category !== 'user_added') {
        throw new Error('Seuls les posts user_added peuvent être supprimés');
      }

      // ⭐ v2.9o : Supprimer photos du post si demandé
      if (cascadeOptions?.deletePhotos && post.photos && post.photos.length > 0) {
        logger.info(`Suppression en cascade de ${post.photos.length} photo(s) du post...`);
        for (const photo of post.photos) {
          const photoId = photo.google_drive_id || photo.filename;
          try {
            await this.deletePhoto(momentId, photoId, photo.filename, cascadeOptions.deleteFiles, false);
            logger.debug(`Photo ${photo.filename} supprimée`);
          } catch (error) {
            logger.warn(`Erreur suppression photo ${photo.filename}:`, error);
            // Continue avec les autres photos
          }
        }
      }

      // Supprimer tous les liens ContentLinks associés
      if (this.contentLinks) {
        try {
          const links = this.contentLinks.getLinksForContent('post', postId);
          for (const link of links) {
            await this.contentLinks.removeLink(link.sessionId, 'post', postId);
          }
          logger.debug('Liens ContentLinks supprimés');
        } catch (error) {
          logger.error('Erreur suppression liens:', error);
          // Non-bloquant
        }
      }

      // Retirer du moment
      moment.posts = moment.posts.filter(p => p.id !== postId);

      // Sauvegarder sur Drive
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

      // Mettre à jour l'état
      this.updateState({ masterIndex });

      if (showSpinner) {
        this.setLoadingOperation(false);
      }
      logger.success('Post supprimé' + (cascadeOptions?.deletePhotos ? ' avec photos' : ''));

      return { success: true };
    } catch (error) {
      logger.error('Erreur suppression post:', error);
      if (showSpinner) {
        this.setLoadingOperation(false);
      }
      throw error;
    }
  }

  /**
   * ⭐ v2.9n : Collecter toutes les photos d'un moment (dayPhotos + posts)
   * @param {Object} moment - Le moment
   * @param {Array} deleteNoteIds - IDs des notes à supprimer (optionnel)
   * @returns {Array} - Liste des photoIds
   */
  collectMomentPhotos = (moment, deleteNoteIds = []) => {
    const photoIds = [];

    // Photos directes du moment
    if (moment.dayPhotos) {
      moment.dayPhotos
        .filter(p => p.source === 'imported')
        .forEach(p => {
          const id = p.google_drive_id || p.filename;
          if (id && !photoIds.includes(id)) {
            photoIds.push(id);
          }
        });
    }

    // Photos des notes (seulement si la note sera supprimée)
    if (moment.posts && deleteNoteIds.length > 0) {
      moment.posts
        .filter(post => post.category === 'user_added' && deleteNoteIds.includes(post.id))
        .forEach(post => {
          if (post.photos) {
            post.photos
              .filter(p => p.source === 'imported')
              .forEach(p => {
                const id = p.google_drive_id || p.filename;
                if (id && !photoIds.includes(id)) {
                  photoIds.push(id);
                }
              });
          }
        });
    }

    return photoIds;
  }

  /**
   * ⭐ v2.9n : Vérifier si une photo est utilisée dans d'autres moments
   * @param {string} photoId - ID de la photo (google_drive_id ou filename)
   * @param {string} excludeMomentId - ID du moment à exclure de la recherche
   * @returns {Array} - Liste des moments où la photo est utilisée
   */
  checkPhotoCrossReferences = (photoId, excludeMomentId) => {
    const masterIndex = this.appState.masterIndex;
    if (!masterIndex?.moments) return [];

    const crossRefs = [];

    for (const moment of masterIndex.moments) {
      const locations = [];

      // ⭐ v2.9t : Chercher dans dayPhotos
      const foundInDay = moment.dayPhotos?.find(p =>
        p.google_drive_id === photoId || p.filename === photoId
      );

      if (foundInDay) {
        locations.push({ type: 'dayPhotos', location: 'dayPhotos' });
      }

      // ⭐ v2.9t : Chercher dans les posts
      if (moment.posts) {
        for (const post of moment.posts) {
          const foundInPost = post.photos?.find(p =>
            p.google_drive_id === photoId || p.filename === photoId
          );

          if (foundInPost) {
            locations.push({
              type: 'post',
              location: `post:${post.id}`,
              postTitle: post.title || 'Sans titre'
            });
          }
        }
      }

      // ⭐ v2.9t : Si moment actuel, vérifier duplications internes
      if (moment.id === excludeMomentId) {
        // Si photo trouvée à plusieurs endroits dans le MÊME moment
        if (locations.length > 1) {
          crossRefs.push({
            momentId: moment.id,
            momentTitle: moment.title + ' (même moment)',
            momentDate: moment.date,
            locations: locations,
            isSameMoment: true  // ⭐ Flag spécial
          });
        }
        continue; // Ne pas ajouter de cross-ref "normal" pour le moment actuel
      }

      // ⭐ v2.9t : Autres moments : ajouter cross-refs si photo trouvée
      if (locations.length > 0) {
        // Si trouvée dans dayPhotos, utiliser cette info
        if (foundInDay) {
          crossRefs.push({
            momentId: moment.id,
            momentTitle: moment.title,
            momentDate: moment.date,
            location: 'dayPhotos'
          });
        } else {
          // Sinon, ajouter pour chaque post
          locations.forEach(loc => {
            if (loc.type === 'post') {
              crossRefs.push({
                momentId: moment.id,
                momentTitle: moment.title,
                momentDate: moment.date,
                location: loc.location,
                postTitle: loc.postTitle
              });
            }
          });
        }
      }
    }

    return crossRefs;
  }

  /**
   * ⭐ v2.9n3 : Vérifier si une photo est utilisée dans des sessions/chats
   * @param {string} photoId - ID de la photo (google_drive_id ou filename)
   * @returns {Array} - Liste des sessions où la photo est utilisée
   */
  checkPhotoInSessions = (photoId) => {
    const sessions = this.appState.sessions;
    if (!sessions || sessions.length === 0) return [];

    const sessionRefs = [];

    for (const session of sessions) {
      if (!session.notes || session.notes.length === 0) continue;

      // Chercher dans les messages (notes) de la session
      for (const note of session.notes) {
        if (!note.photoData) continue;

        // Vérifier si ce message contient la photo
        const matchById = note.photoData.google_drive_id === photoId;
        const matchByFilename = note.photoData.filename === photoId;

        if (matchById || matchByFilename) {
          sessionRefs.push({
            sessionId: session.id,
            sessionTitle: session.gameTitle || 'Sans titre',
            messageId: note.id,
            messageAuthor: note.author,
            messageDate: note.timestamp
          });
          break; // Pas besoin de chercher dans les autres messages de cette session
        }
      }
    }

    return sessionRefs;
  }

  /**
   * Supprimer une photo (seulement source='imported')
   * @param {string} momentId - ID du moment parent
   * @param {string} photoId - ID de la photo (google_drive_id ou filename)
   * @param {string} filename - Nom du fichier (optionnel)
   * @param {boolean} deleteFromDrive - ⭐ v2.9 : Supprimer aussi du Drive
   * @param {boolean} showSpinner - ⭐ v2.9j : Afficher spinner (false en cascade)
   */
  deletePhoto = async (momentId, photoId, filename = null, deleteFromDrive = false, showSpinner = true) => {
    logger.info('Suppression photo:', photoId, deleteFromDrive ? '(+ Drive)' : '(uniquement index)');

    // ⭐ v2.9n : Vérifier cross-références AVANT suppression Drive
    if (deleteFromDrive) {
      const crossRefs = this.checkPhotoCrossReferences(photoId, momentId);
      const sessionRefs = this.checkPhotoInSessions(photoId); // ⭐ v2.9n3 : Vérifier sessions aussi

      if (crossRefs.length > 0 || sessionRefs.length > 0) {
        logger.warn('⚠️ Photo utilisée ailleurs:', { crossRefs, sessionRefs });
        return {
          success: false,
          reason: 'cross_references',
          crossRefs,
          sessionRefs  // ⭐ v2.9n3 : Retourner aussi les refs sessions
        };
      }
    }

    if (showSpinner) {
      this.setLoadingOperation(
        true,
        deleteFromDrive ? 'Suppression de la photo et du fichier...' : 'Suppression de la photo...',
        'Enregistrement sur Google Drive',
        'monkey'
      );
    }

    try {
      const masterIndex = this.appState.masterIndex;
      const moment = masterIndex.moments.find(m => m.id === momentId);

      if (!moment) {
        throw new Error('Moment parent introuvable');
      }

      // Chercher dans dayPhotos
      const dayPhoto = moment.dayPhotos?.find(p => p.google_drive_id === photoId || p.filename === photoId);

      if (dayPhoto) {
        if (dayPhoto.source !== 'imported') {
          throw new Error('Seules les photos importées peuvent être supprimées');
        }

        // Supprimer tous les liens ContentLinks associés
        if (this.contentLinks) {
          try {
            const links = this.contentLinks.getLinksForContent('photo', photoId);
            for (const link of links) {
              await this.contentLinks.removeLink(link.sessionId, 'photo', photoId);
            }
            logger.debug('Liens ContentLinks supprimés');
          } catch (error) {
            logger.error('Erreur suppression liens:', error);
            // Non-bloquant
          }
        }

        // ⭐ v2.9n : Supprimer fichier Drive ET thumbnail si demandé
        if (deleteFromDrive && dayPhoto.google_drive_id) {
          try {
            logger.info(`🗑️ Suppression fichier Drive demandée - ID: ${dayPhoto.google_drive_id}, filename: ${dayPhoto.filename}`);
            console.log('📸 Photo dayPhoto complète:', dayPhoto);

            // 1. Supprimer le fichier principal
            await this.driveSync.deleteFileById(dayPhoto.google_drive_id);
            logger.success('📸 Fichier image principal supprimé du cloud');

            // 2. Supprimer le thumbnail (pattern: filename_thumb.ext)
            if (dayPhoto.filename) {
              const thumbFilename = dayPhoto.filename.replace(/\.(\w+)$/, '_thumb.$1');
              logger.info(`🔍 Recherche thumbnail: ${thumbFilename}`);

              const thumbFileId = await this.driveSync.findFileIdByName(thumbFilename, 'Medias/imported');

              if (thumbFileId) {
                await this.driveSync.deleteFileById(thumbFileId);
                logger.success('🖼️ Thumbnail supprimé du cloud');
              } else {
                logger.warn(`⚠️ Thumbnail non trouvé: ${thumbFilename}`);
              }
            }
          } catch (error) {
            logger.warn('⚠️ Impossible de supprimer les fichiers du cloud:', error);
            // Non-bloquant, on continue
          }
        }

        // Retirer de dayPhotos
        moment.dayPhotos = moment.dayPhotos.filter(p =>
          p.google_drive_id !== photoId && p.filename !== photoId
        );

        // Sauvegarder masterIndex sur Drive
        await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

        // Mettre à jour l'état
        this.updateState({ masterIndex });

        if (showSpinner) {
          this.setLoadingOperation(false);
        }
        logger.success('Photo supprimée');

        return { success: true };
      }

      // Chercher dans postPhotos
      for (const post of moment.posts || []) {
        const postPhoto = post.photos?.find(p => p.google_drive_id === photoId || p.filename === photoId);

        if (postPhoto) {
          if (postPhoto.source !== 'imported') {
            throw new Error('Seules les photos importées peuvent être supprimées');
          }

          // Supprimer tous les liens ContentLinks associés
          if (this.contentLinks) {
            try {
              const links = this.contentLinks.getLinksForContent('photo', photoId);
              for (const link of links) {
                await this.contentLinks.removeLink(link.sessionId, 'photo', photoId);
              }
              logger.debug('Liens ContentLinks supprimés');
            } catch (error) {
              logger.error('Erreur suppression liens:', error);
              // Non-bloquant
            }
          }

          // ⭐ v2.9n : Supprimer fichier Drive ET thumbnail si demandé
          if (deleteFromDrive && postPhoto.google_drive_id) {
            try {
              logger.info(`🗑️ Suppression fichier Drive demandée - ID: ${postPhoto.google_drive_id}, filename: ${postPhoto.filename}`);
              console.log('📸 Photo postPhoto complète:', postPhoto);

              // 1. Supprimer le fichier principal
              await this.driveSync.deleteFileById(postPhoto.google_drive_id);
              logger.success('📸 Fichier image principal supprimé du cloud');

              // 2. Supprimer le thumbnail (pattern: filename_thumb.ext)
              if (postPhoto.filename) {
                const thumbFilename = postPhoto.filename.replace(/\.(\w+)$/, '_thumb.$1');
                logger.info(`🔍 Recherche thumbnail: ${thumbFilename}`);

                const thumbFileId = await this.driveSync.findFileIdByName(thumbFilename, 'Medias/imported');

                if (thumbFileId) {
                  await this.driveSync.deleteFileById(thumbFileId);
                  logger.success('🖼️ Thumbnail supprimé du cloud');
                } else {
                  logger.warn(`⚠️ Thumbnail non trouvé: ${thumbFilename}`);
                }
              }
            } catch (error) {
              logger.warn('⚠️ Impossible de supprimer les fichiers du cloud:', error);
              // Non-bloquant, on continue
            }
          }

          // Retirer de post.photos
          post.photos = post.photos.filter(p =>
            p.google_drive_id !== photoId && p.filename !== photoId
          );

          // Sauvegarder masterIndex sur Drive
          await this.driveSync.saveFile('mekong_master_index_v3_moments.json', masterIndex);

          // Mettre à jour l'état
          this.updateState({ masterIndex });

          this.setLoadingOperation(false);
          logger.success('Photo supprimée');

          return { success: true };
        }
      }

      throw new Error('Photo introuvable');
    } catch (error) {
      logger.error('Erreur suppression photo:', error);
      if (showSpinner) {
        this.setLoadingOperation(false);
      }
      throw error;
    }
  }

  /**
   * ⭐ v2.9q : Analyser l'impact d'une suppression AVANT ouverture modal
   * @param {string} type - 'moment' | 'post' | 'photo'
   * @param {Object} params - { momentId, postId, photoId, filename }
   * @returns {Object} - Analyse complète de l'impact
   */
  analyzeDeleteImpact = (type, params) => {
    const { momentId, postId, photoId, filename } = params;

    const result = {
      canDelete: true,
      crossRefs: {
        moments: [],
        sessions: [],
        total: 0
      },
      nestedElements: null,
      recommendedOptions: {
        deleteNotes: true,
        deletePhotos: true,
        deleteFiles: false  // Safe par défaut
      },
      requiresDoubleConfirmation: false
    };

    if (type === 'moment') {
      const moment = this.appState.masterIndex?.moments.find(m => m.id === momentId);
      if (!moment) return result;

      // Inventaire éléments imbriqués
      const userNotes = (moment.posts || []).filter(p => p.category === 'user_added');
      const importedPhotos = (moment.dayPhotos || []).filter(p => p.source === 'imported');

      // Compter photos dans notes
      let photosInNotes = 0;
      userNotes.forEach(note => {
        photosInNotes += (note.photos || []).filter(p => p.source === 'imported').length;
      });

      result.nestedElements = {
        notes: userNotes.map(note => ({
          id: note.id,
          title: note.title || 'Sans titre',
          photoCount: (note.photos || []).filter(p => p.source === 'imported').length
        })),
        photos: importedPhotos.length + photosInNotes,
        photosMoment: importedPhotos.length,
        photosNotes: photosInNotes
      };

      // Vérifier cross-refs pour TOUTES les photos
      const deleteNoteIds = userNotes.map(n => n.id);
      const allPhotoIds = this.collectMomentPhotos(moment, deleteNoteIds);

      allPhotoIds.forEach(pid => {
        const momentRefs = this.checkPhotoCrossReferences(pid, momentId);
        const sessionRefs = this.checkPhotoInSessions(pid);

        if (momentRefs.length > 0) {
          result.crossRefs.moments.push({ photoId: pid, refs: momentRefs });
        }
        if (sessionRefs.length > 0) {
          result.crossRefs.sessions.push({ photoId: pid, refs: sessionRefs });
        }
      });

      result.crossRefs.total = result.crossRefs.moments.length + result.crossRefs.sessions.length;
      result.requiresDoubleConfirmation = result.crossRefs.total > 0;
    }

    else if (type === 'photo') {
      // Analyse pour photo simple
      const momentRefs = this.checkPhotoCrossReferences(photoId, momentId);
      const sessionRefs = this.checkPhotoInSessions(photoId);

      if (momentRefs.length > 0) {
        result.crossRefs.moments.push({
          photoId,
          filename,
          refs: momentRefs
        });
      }
      if (sessionRefs.length > 0) {
        result.crossRefs.sessions.push({
          photoId,
          filename,
          refs: sessionRefs
        });
      }

      result.crossRefs.total = momentRefs.length + sessionRefs.length;
      result.requiresDoubleConfirmation = result.crossRefs.total > 0;
    }

    else if (type === 'post') {
      // Analyse pour post (Note de photo)
      const moment = this.appState.masterIndex?.moments.find(m => m.id === momentId);
      if (!moment) return result;

      const post = moment.posts?.find(p => p.id === postId);
      if (!post) return result;

      const importedPhotos = (post.photos || []).filter(p => p.source === 'imported');

      result.nestedElements = {
        photos: importedPhotos.length
      };

      // Vérifier cross-refs pour les photos du post
      importedPhotos.forEach(photo => {
        const pid = photo.google_drive_id || photo.filename;
        const momentRefs = this.checkPhotoCrossReferences(pid, momentId);
        const sessionRefs = this.checkPhotoInSessions(pid);

        if (momentRefs.length > 0) {
          result.crossRefs.moments.push({ photoId: pid, filename: photo.filename, refs: momentRefs });
        }
        if (sessionRefs.length > 0) {
          result.crossRefs.sessions.push({ photoId: pid, filename: photo.filename, refs: sessionRefs });
        }
      });

      result.crossRefs.total = result.crossRefs.moments.length + result.crossRefs.sessions.length;
      result.requiresDoubleConfirmation = result.crossRefs.total > 0;
    }

    logger.debug('Analyse impact suppression:', { type, params, result });
    return result;
  }

  // ⭐ v2.9r : cleanPhotoEverywhere SUPPRIMÉ
  // Utilise maintenant le système de blocage avec cross-refs au lieu de la suppression globale

  /**
   * ⭐ v2.9q : Naviguer vers un moment avec contexte mémorisé
   * @param {string} momentId - ID du moment cible
   * @param {Object} returnContext - Contexte pour retour au modal
   */
  navigateToMoment = (momentId, returnContext = null) => {
    logger.debug('Navigation vers moment:', momentId, returnContext);
    this.updateState({
      currentPage: 'memories',
      navigationContext: {
        targetMomentId: momentId,
        scrollToMoment: true,
        returnContext: returnContext
      }
    });
  }

  /**
   * ⭐ v2.9q : Naviguer vers une session avec contexte mémorisé
   * @param {string} sessionId - ID de la session cible
   * @param {Object} returnContext - Contexte pour retour au modal
   */
  navigateToSession = (sessionId, returnContext = null) => {
    logger.debug('Navigation vers session:', sessionId, returnContext);
    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (session) {
      this.updateState({
        currentPage: 'chat',
        currentChatSession: session,
        navigationContext: {
          returnContext: returnContext
        }
      });
    } else {
      logger.warn('Session introuvable:', sessionId);
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
  // LOADING OPERATIONS
  // ========================================

  /**
   * Set loading state for async operations with spinner display
   * @param {boolean} active - Show spinner
   * @param {string} message - Main message
   * @param {string} subMessage - Optional sub-message
   * @param {string} variant - Animation variant: 'spin' | 'bounce' | 'monkey'
   */
  setLoadingOperation = (active, message = 'Chargement...', subMessage = 'Enregistrement sur Google Drive', variant = 'spin') => {
    this.updateState({
      loadingOperation: {
        active,
        message,
        subMessage,
        variant
      }
    });
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