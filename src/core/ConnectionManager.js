/**
 * ConnectionManager v0.8.6 - Solution iOS redirection directe
 * Redirige dans le même onglet pour contourner le blocage Safari iOS
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
    
    console.log('🔌 ConnectionManager: Construction (v0.8.6)...');
    this.init();
    
    // 🆕 Vérifier retour OAuth au chargement (iOS)
    if (this.isIOS) {
      this.checkForIOSAuthReturn();
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

  // 🆕 MÉTHODE iOS : Vérifier retour authentification
  checkForIOSAuthReturn() {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    
    // Chercher token dans le hash (#access_token=...)
    if (hash.includes('access_token=')) {
      console.log('📱 Token détecté dans hash, traitement...');
      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const token = hashParams.get('access_token');
      const error = hashParams.get('error');
      
      if (error) {
        console.error('📱 Erreur OAuth:', error);
        this.setState(this.states.ERROR);
        this.lastError = `Erreur OAuth: ${error}`;
      } else if (token) {
        console.log('📱 Token OAuth trouvé:', token.substring(0, 20) + '...');
        this.handleIOSAuthSuccess(token);
      }
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // Chercher code dans les params (?code=...)
    const code = params.get('code');
    const error = params.get('error');
    
    if (error) {
      console.error('📱 Erreur OAuth:', error);
      this.setState(this.states.ERROR);
      this.lastError = `Erreur OAuth: ${error}`;
    } else if (code) {
      console.log('📱 Code OAuth trouvé:', code.substring(0, 20) + '...');
      this.handleIOSAuthSuccess('token_from_code_' + code);
    }
    
    if (code || error) {
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // 🆕 MÉTHODE iOS : Traiter succès authentification
  async handleIOSAuthSuccess(token) {
    try {
      console.log('📱 Traitement succès authentification iOS...');
      this.setState(this.states.CONNECTING);
      
      this.accessToken = token;
      
      // Finaliser la connexion
      await this.finalizeConnection();
      
    } catch (error) {
      console.error('❌ Erreur finalisation iOS:', error);
      this.setState(this.states.ERROR);
      this.lastError = `Erreur finalisation: ${error.message}`;
    }
  }

  async connect() {
    console.log('🔌 Démarrage connexion...');
    this.setState(this.states.CONNECTING);
    
    try {
      if (!this.gisInitialized) {
        await this.initializeGoogleIdentityServices();
      }
      
      // 🆕 GESTION iOS : Redirection directe
      if (this.isIOS) {
        return this.connectWithRedirect();
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

  // 🆕 MÉTHODE iOS : Redirection directe
  async connectWithRedirect() {
    console.log('📱 iOS - Redirection directe vers Google');
    
    const userConfirm = confirm(
      'Vous allez être redirigé vers Google pour l\'authentification.\n\n' +
      'Après avoir autorisé l\'accès, vous reviendrez automatiquement à l\'application.'
    );
    
    if (!userConfirm) {
      this.setState(this.states.OFFLINE);
      return { success: false, error: 'Connexion annulée par l\'utilisateur' };
    }
    
    // Sauvegarder l'état avant redirection
    localStorage.setItem('ios_auth_in_progress', JSON.stringify({
      timestamp: Date.now(),
      returnUrl: window.location.href
    }));
    
    // Construire URL OAuth
    const authUrl = this.buildIOSAuthUrl();
    console.log('📱 Redirection vers:', authUrl);
    
    // Redirection immédiate dans le même onglet
    window.location.href = authUrl;
    
    // Cette méthode ne retournera jamais car on redirige
    return new Promise(() => {});
  }

  // 🆕 MÉTHODE iOS : Construire URL OAuth
  buildIOSAuthUrl() {
    const currentUrl = window.location.origin + window.location.pathname;
    
    const params = new URLSearchParams({
      client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
      redirect_uri: currentUrl,
      scope: GOOGLE_DRIVE_CONFIG.SCOPES,
      response_type: 'token', // Implicit flow - token directement dans hash
      include_granted_scopes: 'true',
      prompt: 'consent',
      state: 'ios_auth_' + Date.now()
    });
    
    return `https://accounts.google.com/oauth/authorize?${params.toString()}`;
  }

  // MÉTHODE Desktop : Popup normal
  async connectWithPopup() {
    console.log('🖥️ Desktop - Connexion popup');
    this.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    return new Promise((resolve) => { this._connectionResolve = resolve; });
  }

  async disconnect() {
    try {
      console.log('🔌 Déconnexion...');
      
      if (this.accessToken) {
        if (window.google?.accounts?.oauth2 && !this.isIOS) {
          window.google.accounts.oauth2.revoke(this.accessToken);
        }
        this.accessToken = null;
      }
      
      this.userInfo = null;
      this.lastError = null;
      this.setState(this.states.OFFLINE);
      
      // Nettoyer localStorage iOS
      localStorage.removeItem('ios_auth_in_progress');
      
      console.log('✅ Déconnexion réussie');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // --- Le reste du code reste identique ---

  async initializeGoogleIdentityServices() {
    try {
      validateCredentials();
      
      // Sur iOS, on n'utilise pas Google Identity Services
      // On fait tout manuellement avec des URLs
      if (this.isIOS) {
        this.gisInitialized = true;
        console.log('✅ iOS: Mode manuel OAuth (pas de GIS)');
        return;
      }
      
      // Desktop : chargement normal GIS
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
      // Sur iOS avec token, on initialise quand même gapi pour l'API Drive
      if (this.isIOS) {
        console.log('📱 iOS: Initialisation Google API avec token');
        await this.initializeGapiClient();
        this.userInfo = await this.getUserInfo();
      } else {
        // Desktop: processus normal
        await this.initializeGapiClient();
        this.userInfo = await this.getUserInfo();
      }
      
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
    try {
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
    } catch (error) {
      console.error('❌ Erreur initialisation gapi:', error);
      throw error;
    }
  }

  async getUserInfo() {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      if (!response.ok) throw new Error('Erreur récupération profil utilisateur');
      const profile = await response.json();
      return { id: profile.id, name: profile.name, email: profile.email, imageUrl: profile.picture };
    } catch (error) {
      console.error('❌ Erreur getUserInfo:', error);
      // Si on ne peut pas récupérer le profil, créer un profil minimal
      return { 
        id: 'ios_user', 
        name: 'Utilisateur iOS', 
        email: 'ios@temp.com', 
        imageUrl: null 
      };
    }
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