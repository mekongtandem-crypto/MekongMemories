/**
 * ConnectionManager v0.8.5 - Solution iOS avec nouvel onglet
 * Contourne les limitations Safari iOS en ouvrant Google dans un nouvel onglet
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
    
    // 🆕 DÉTECTION iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // 🆕 Variables pour gérer l'onglet iOS
    this.iosAuthWindow = null;
    this.iosAuthCheckInterval = null;
    
    console.log('🔌 ConnectionManager: Construction (v0.8.5)...');
    this.init();
    
    // 🆕 Écouter le retour de l'authentification iOS
    if (this.isIOS) {
      this.setupIOSAuthListener();
    }
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

  // 🆕 MÉTHODE iOS : Écouter le retour d'authentification
  setupIOSAuthListener() {
    // Écouter les messages postMessage depuis l'onglet d'auth
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('📱 Message de succès reçu:', event.data);
        this.handleIOSAuthSuccess(event.data.token);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        console.error('📱 Erreur auth reçue:', event.data.error);
        this.handleIOSAuthError(event.data.error);
      }
    });
    
    // Vérifier si on revient d'une auth (URL contient token)
    this.checkForAuthToken();
  }

  // 🆕 MÉTHODE iOS : Vérifier token dans l'URL
  checkForAuthToken() {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    // Vérifier hash fragment (implicit flow)
    if (hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const token = hashParams.get('access_token');
      const error = hashParams.get('error');
      
      if (error) {
        console.error('📱 Erreur OAuth dans hash:', error);
        this.handleIOSAuthError(error);
      } else if (token) {
        console.log('📱 Token trouvé dans hash');
        this.handleIOSAuthSuccess(token);
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    // Vérifier query params (authorization code flow)
    const code = params.get('code');
    const error = params.get('error');
    
    if (error) {
      console.error('📱 Erreur OAuth dans params:', error);
      this.handleIOSAuthError(error);
    } else if (code) {
      console.log('📱 Code auth trouvé dans params');
      // Pour un code, on aurait besoin d'un backend pour l'échanger
      // Pour l'instant, simulons un succès
      this.handleIOSAuthSuccess('code_' + code);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // 🆕 MÉTHODE iOS : Gérer succès authentification
  async handleIOSAuthSuccess(token) {
    try {
      console.log('📱 Traitement succès auth iOS...');
      this.setState(this.states.CONNECTING);
      
      this.accessToken = token;
      
      // Fermer l'onglet d'auth s'il est ouvert
      if (this.iosAuthWindow && !this.iosAuthWindow.closed) {
        this.iosAuthWindow.close();
      }
      
      // Arrêter la surveillance
      if (this.iosAuthCheckInterval) {
        clearInterval(this.iosAuthCheckInterval);
        this.iosAuthCheckInterval = null;
      }
      
      // Finaliser la connexion
      await this.finalizeConnection();
      
    } catch (error) {
      console.error('❌ Erreur traitement succès iOS:', error);
      this.handleIOSAuthError(error.message);
    }
  }

  // 🆕 MÉTHODE iOS : Gérer erreur authentification  
  handleIOSAuthError(error) {
    console.error('📱 Erreur auth iOS:', error);
    this.setState(this.states.ERROR);
    this.lastError = `Erreur authentification iOS: ${error}`;
    
    // Nettoyer
    if (this.iosAuthWindow && !this.iosAuthWindow.closed) {
      this.iosAuthWindow.close();
    }
    if (this.iosAuthCheckInterval) {
      clearInterval(this.iosAuthCheckInterval);
      this.iosAuthCheckInterval = null;
    }
    
    if (this._connectionResolve) {
      this._connectionResolve({ success: false, error: this.lastError });
    }
  }

  async connect() {
    console.log('🔌 Démarrage connexion...');
    this.setState(this.states.CONNECTING);
    
    try {
      if (!this.gisInitialized) {
        await this.initializeGoogleIdentityServices();
      }
      
      // 🆕 GESTION iOS : Nouvel onglet au lieu de popup/redirect
      if (this.isIOS) {
        return this.connectWithNewTab();
      } else {
        return this.connectWithPopup();
      }
      
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      this.setState(this.states.ERROR);
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // 🆕 MÉTHODE iOS : Connexion via nouvel onglet
  async connectWithNewTab() {
    console.log('📱 iOS - Connexion via nouvel onglet');
    
    const userConfirm = confirm(
      'L\'authentification va s\'ouvrir dans un nouvel onglet.\n\n' +
      'Après avoir autorisé l\'accès à Google Drive, ' +
      'fermez l\'onglet et revenez ici.'
    );
    
    if (!userConfirm) {
      this.setState(this.states.OFFLINE);
      return { success: false, error: 'Connexion annulée par l\'utilisateur' };
    }
    
    // Construire URL OAuth avec implicit flow (plus simple pour iOS)
    const authUrl = this.buildIOSAuthUrl();
    console.log('📱 Ouverture onglet auth:', authUrl);
    
    // Ouvrir dans un nouvel onglet
    this.iosAuthWindow = window.open(authUrl, '_blank', 'width=600,height=700');
    
    if (!this.iosAuthWindow) {
      throw new Error('Impossible d\'ouvrir l\'onglet d\'authentification. Popups bloqués ?');
    }
    
    // Surveiller la fermeture de l'onglet
    this.iosAuthCheckInterval = setInterval(() => {
      if (this.iosAuthWindow.closed) {
        console.log('📱 Onglet fermé par l\'utilisateur');
        clearInterval(this.iosAuthCheckInterval);
        this.iosAuthCheckInterval = null;
        
        // Vérifier si on a reçu un token
        setTimeout(() => {
          if (this.currentState === this.states.CONNECTING) {
            console.log('📱 Pas de token reçu, connexion annulée');
            this.setState(this.states.OFFLINE);
            if (this._connectionResolve) {
              this._connectionResolve({ 
                success: false, 
                error: 'Authentification non terminée ou annulée' 
              });
            }
          }
        }, 1000);
      }
    }, 1000);
    
    return new Promise((resolve) => { 
      this._connectionResolve = resolve; 
    });
  }

  // 🆕 MÉTHODE iOS : Construire URL OAuth
  buildIOSAuthUrl() {
    const params = new URLSearchParams({
      client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
      redirect_uri: window.location.origin + window.location.pathname,
      scope: GOOGLE_DRIVE_CONFIG.SCOPES,
      response_type: 'token', // Implicit flow pour iOS
      include_granted_scopes: 'true',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  }

  // MÉTHODE Desktop : Connexion popup normale
  async connectWithPopup() {
    console.log('🖥️ Desktop - Connexion par popup');
    this.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    return new Promise((resolve) => { this._connectionResolve = resolve; });
  }

  async disconnect() {
    try {
      console.log('🔌 Déconnexion...');
      
      // Nettoyer iOS
      if (this.iosAuthWindow && !this.iosAuthWindow.closed) {
        this.iosAuthWindow.close();
      }
      if (this.iosAuthCheckInterval) {
        clearInterval(this.iosAuthCheckInterval);
        this.iosAuthCheckInterval = null;
      }
      
      if (this.accessToken) {
        if (window.google?.accounts?.oauth2) {
          window.google.accounts.oauth2.revoke(this.accessToken);
        }
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

  // --- Reste du code identique ---

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

      await new Promise(resolve => setTimeout(resolve, 50));

      // Configuration pour desktop uniquement (iOS utilise URL manuelle)
      if (!this.isIOS) {
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
      }
      
      this.gisInitialized = true;
      console.log('✅ Google Identity Services (GIS) initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation GIS:', error);
      throw new Error(`Initialisation GIS échouée: ${error.message}`);
    }
  }
  
  async finalizeConnection() {
    try {
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

  // --- Gestion de l'état et des abonnements (identique) ---

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
  
  setState(newState) {
    if (this.currentState !== newState) {
      const oldState = this.currentState;
      this.currentState = newState;
      console.log(`🔄 État connexion: ${oldState} → ${newState}`);
      this.notify();
    }
  }

  getDebugInfo() {
      return {
          currentState: this.currentState,
          userInfo: this.userInfo,
          lastError: this.lastError,
          gisInitialized: this.gisInitialized,
          hasToken: !!this.accessToken,
          isIOS: this.isIOS,
      };
  }
}

export const connectionManager = new ConnectionManager();

if (typeof window !== 'undefined') {
  window.connectionManager = connectionManager;
}