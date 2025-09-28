/**
 * ConnectionManager v0.8.2 - Logique d'abonnement ajoutée
 * Ajout des méthodes subscribe/notify/getState pour permettre aux autres
 * modules d'écouter les changements d'état de la connexion de manière propre.
 */

import { stateManager } from './StateManager.js';
import { GOOGLE_DRIVE_CONFIG, validateCredentials } from '../config/googleDrive.js';

class ConnectionManager {
  constructor() {
    this.states = { OFFLINE: 'offline', CONNECTING: 'connecting', ONLINE: 'online', ERROR: 'error' };
    this.currentState = this.states.OFFLINE;
    this.userInfo = null;
    this.lastError = null;
    this.listeners = new Set();
    this.gisInitialized = false;
    this.tokenClient = null;
    this.accessToken = null;
    
    console.log('🔌 ConnectionManager: Construction (v0.8.2)...');
    this.init();
  }

  async init() {
    try {
      console.log('🔌 ConnectionManager: Initialisation...');
      await this.initializeGoogleIdentityServices();
      console.log('✅ ConnectionManager: Initialisé');
    } catch (error) {
      console.error('❌ ConnectionManager: Erreur initialisation:', error);
      this.setState(this.states.ERROR);
      this.lastError = error.message;
    }
  }

  async connect() {
    console.log('🔌 Démarrage connexion...');
    this.setState(this.states.CONNECTING);
    try {
      if (!this.gisInitialized) {
        await this.initializeGoogleIdentityServices();
      }
      this.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
      return new Promise((resolve) => { this._connectionResolve = resolve; });
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      this.setState(this.states.ERROR);
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async disconnect() {
    try {
      console.log('🔌 Déconnexion...');
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken);
        this.accessToken = null;
      }
      this.userInfo = null;
      this.lastError = null;
      this.setState(this.states.OFFLINE);
      console.log('✅ Déconnexion réussie');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // --- Logique interne Google ---

  async initializeGoogleIdentityServices() {
    try {
      validateCredentials();
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Impossible de charger le script Google GSI'));
        document.head.appendChild(script);
      });

      await new Promise(resolve => setTimeout(resolve, 50)); // Petit délai pour garantir que `google` est sur window

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
        scope: GOOGLE_DRIVE_CONFIG.SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            this.setState(this.states.ERROR);
            this.lastError = `Erreur OAuth: ${tokenResponse.error}`;
            return;
          }
          this.accessToken = tokenResponse.access_token;
          this.finalizeConnection();
        }
      });
      this.gisInitialized = true;
      console.log('✅ Google Identity Services (GIS) initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation GIS:', error);
      throw new Error(`Initialisation GIS échouée: ${error.message}`);
    }
  }
  
  async finalizeConnection() {
    try {
      // Pour utiliser l'API gapi, nous devons l'initialiser avec le token
      await this.initializeGapiClient();
      this.userInfo = await this.getUserInfo();
      this.setState(this.states.ONLINE);

      console.log('✅ Connexion Google Drive finalisée. DataManager va maintenant synchroniser.');

      const result = { success: true, userInfo: this.userInfo };
      if (this._connectionResolve) this._connectionResolve(result);
      return result;
    } catch (error) {
      this.setState(this.states.ERROR);
      this.lastError = `Finalisation échouée: ${error.message}`;
      const errorResult = { success: false, error: this.lastError };
      if (this._connectionResolve) this._connectionResolve(errorResult);
      return errorResult;
    }
  }
  
  async initializeGapiClient() {
    await new Promise((resolve, reject) => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => window.gapi.load('client', resolve);
        gapiScript.onerror = reject;
        document.head.appendChild(gapiScript);
    });

    await window.gapi.client.init({
      apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
      discoveryDocs: [GOOGLE_DRIVE_CONFIG.DISCOVERY_DOC],
    });
    window.gapi.client.setToken({ access_token: this.accessToken });
    console.log('✅ Google API Client (gapi) initialisé et authentifié.');
  }

  async getUserInfo() {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });
    if (!response.ok) throw new Error('Erreur récupération profil utilisateur');
    const profile = await response.json();
    return { id: profile.id, name: profile.name, email: profile.email, imageUrl: profile.picture };
  }

  // --- Gestion de l'état et des abonnements ---

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getState()); 
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  getState() {
    return {
      state: this.currentState,
      isOnline: this.currentState === this.states.ONLINE,
      isConnecting: this.currentState === this.states.CONNECTING,
      isOffline: this.currentState === this.states.OFFLINE,
      hasError: this.currentState === this.states.ERROR,
      userInfo: this.userInfo,
      lastError: this.lastError,
    };
  }
  
  // NOTE: Ceci est maintenant la SEULE et UNIQUE définition de setState
  setState(newState) {
    if (this.currentState !== newState) {
      const oldState = this.currentState;
      this.currentState = newState;
      console.log(`🔄 État connexion: ${oldState} → ${newState}`);
      this.notify();
    }
  }

  getDebugInfo() {
      // Méthode pour le débogage, si `useAppState` l'utilise encore.
      return {
          currentState: this.currentState,
          userInfo: this.userInfo,
          lastError: this.lastError,
          gisInitialized: this.gisInitialized,
          hasToken: !!this.accessToken,
      };
  }
}

export const connectionManager = new ConnectionManager();

if (typeof window !== 'undefined') {
  window.connectionManager = connectionManager;
}