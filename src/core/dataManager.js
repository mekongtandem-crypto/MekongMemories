/**
 * DataManager v2.6 - gestion des sessions directement dans l'état principal et implémenté les méthodes nécessaires pour les manipuler.
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
      masterIndex: null,
      sessions: [],             // Pour stocker la liste de toutes les sessions
      currentChatSession: null, // Pour suivre la session de chat actuellement ouverte
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
      const loadedFiles = await this.driveSync.loadAllData();

      // --- MISE À JOUR POUR CHARGER LES SESSIONS ---
      const masterIndex = (loadedFiles && loadedFiles.masterIndex) 
          ? (typeof loadedFiles.masterIndex === 'string' ? JSON.parse(loadedFiles.masterIndex) : loadedFiles.masterIndex)
          : null;
      
      const sessions = loadedFiles.sessions || []; // On récupère les sessions chargées par driveSync
      // ---------------------------------------------

      this.setState({
        masterIndex: masterIndex,
        sessions: sessions, // On stocke les sessions dans l'état
        isLoading: false,
        isInitialized: true,
        error: null
      });
      console.log(`✅ DataManager: Synchro terminée. ${sessions.length} session(s) chargée(s).`);

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

// --- NOUVELLE API PUBLIQUE POUR LES SESSIONS ---

  /** Crée une nouvelle session de chat */
  async createSession(gameData) {
    console.log('Logic: Création de session pour', gameData.title);
    const newSession = {
      id: `sid_${Date.now()}`,
      gameId: gameData.id,
      gameTitle: gameData.title,
      subtitle: `Conversation sur ${gameData.title}`,
      createdAt: new Date().toISOString(),
      user: this.appState.currentUser,
      notes: [], // Le tableau des messages du chat
    };

    try {
      await this.driveSync.saveFile(`session_${newSession.id}.json`, newSession);
      this.setState({ sessions: [...this.appState.sessions, newSession] });
      return newSession;
    } catch (error) {
      console.error("❌ Erreur de création de session:", error);
      this.setState({ error: `Session Create Error: ${error.message}` });
    }
  }

  /** Met à jour une session existante (pour ajout/modif de message, etc.) */
  async updateSession(sessionToUpdate) {
    try {
      await this.driveSync.saveFile(`session_${sessionToUpdate.id}.json`, sessionToUpdate);
      
      const updatedSessions = this.appState.sessions.map(s => 
        s.id === sessionToUpdate.id ? sessionToUpdate : s
      );

      // Si la session mise à jour est celle qui est ouverte, on met aussi à jour currentChatSession
      const updatedCurrentChat = this.appState.currentChatSession?.id === sessionToUpdate.id 
        ? sessionToUpdate 
        : this.appState.currentChatSession;

      this.setState({ 
        sessions: updatedSessions,
        currentChatSession: updatedCurrentChat
      });
    } catch (error) {
      console.error("❌ Erreur de mise à jour de session:", error);
      this.setState({ error: `Session Update Error: ${error.message}` });
    }
  }

  /** Supprime une session */
  async deleteSession(sessionId) {
    try {
      await this.driveSync.deleteFile(`session_${sessionId}.json`);
      const filteredSessions = this.appState.sessions.filter(s => s.id !== sessionId);
      this.setState({ sessions: filteredSessions });
    } catch (error) {
      console.error("❌ Erreur de suppression de session:", error);
      this.setState({ error: `Session Delete Error: ${error.message}` });
    }
  }

  /** Ajoute un message à une session (basé sur la logique de ChatPage_A) */
  async addMessageToSession(sessionId, messageContent) {
    const session = this.appState.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      author: this.appState.currentUser,
      content: messageContent,
      timestamp: new Date().toISOString(),
      edited: false
    };

    const updatedSession = {
      ...session,
      notes: [...session.notes, newMessage]
    };
    
    // updateSession s'occupe de sauvegarder et de mettre à jour l'état
    await this.updateSession(updatedSession);
  }

  /** Ouvre une session dans l'interface de chat */
  async openChatSession(session) {
    this.setState({ 
      currentChatSession: session,
      currentPage: 'chat' // On change de page pour afficher le chat
    });
  }

  /** Ferme la session de chat et retourne à la liste */
  async closeChatSession() {
    this.setState({ 
      currentChatSession: null,
      currentPage: 'sessions' // On retourne à la page des sessions
    });
  }

  // --- Fin de la nouvelle API ---


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

