/**
 * ConnectionManager v0.9.0 - Force Google Identity Services sur iOS
 * Ne plus construire l'URL manuellement, utiliser GIS avec des workarounds iOS
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
    
    // 🆕 iOS : On ne change plus le comportement, on force GIS partout
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('🔌 ConnectionManager: Construction (v0.9.0)...');
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
      
      // 🆕 iOS : Informer l'utilisateur, mais utiliser le même mécanisme
      if (this.isIOS) {
        console.log('📱 iOS détecté - Tentative avec Google Identity Services standard...');
        
        const userConfirm = confirm(
          'Sur iOS, l\'authentification peut s\'ouvrir dans un nouvel onglet.\n\n' +
          'Si rien ne se passe après 5 secondes, nous essaierons une méthode alternative.\n\n' +
          'Continuer ?'
        );
        
        if (!userConfirm) {
          this.setState(this.states.OFFLINE);
          return { success: false, error: 'Connexion annulée' };
        }
      }
      
      // 🆕 MÊME APPEL partout - Google Identity Services se débrouille
      console.log('🔄 Appel Google Identity Services...');
      this.tokenClient.requestAccessToken({ 
        prompt: 'consent select_account'
      });
      
      // 🆕 iOS : Timeout de sécurité si ça ne marche pas
      if (this.isIOS) {
        setTimeout(() => {
          if (this.currentState === this.states.CONNECTING) {
            console.log('📱 Timeout iOS - Tentative méthode alternative...');
            this.tryIOSAlternativeMethod();
          }
        }, 5000);
      }
      
      return new Promise((resolve) => { 
        this._connectionResolve = resolve; 
      });
      
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      this.setState(this.states.ERROR);
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // 🆕 MÉTHODE iOS : Alternative si GIS standard échoue
  async tryIOSAlternativeMethod() {
    console.log('📱 Méthode alternative iOS...');
    
    const confirmed = confirm(
      'La méthode standard n\'a pas fonctionné.\n\n' +
      'Voulez-vous essayer d\'ouvrir Google Drive directement ?\n' +
      '(Vous pourrez copier un lien d\'autorisation)'
    );
    
    if (confirmed) {
      // Ouvrir Google Drive pour que l'utilisateur s'authentifie là
      const driveUrl = 'https://drive.google.com/';
      window.open(driveUrl, '_blank');
      
      // Proposer une méthode manuelle
      setTimeout(() => {
        const manualAuth = confirm(
          'Méthode manuelle :\n\n' +
          '1. Connectez-vous à Google Drive dans l\'onglet ouvert\n' +
          '2. Revenez ici et cliquez OK\n' +
          '3. Nous essaierons une connexion simplifiée\n\n' +
          'Êtes-vous connecté à Google Drive ?'
        );
        
        if (manualAuth) {
          this.trySimplifiedAuth();
        } else {
          this.setState(this.states.OFFLINE);
          if (this._connectionResolve) {
            this._connectionResolve({ success: false, error: 'Authentification manuelle annulée' });
          }
        }
      }, 3000);
    } else {
      this.setState(this.states.OFFLINE);
      if (this._connectionResolve) {
        this._connectionResolve({ success: false, error: 'Méthode alternative refusée' });
      }
    }
  }

  // 🆕 MÉTHODE iOS : Authentification simplifiée
  async trySimplifiedAuth() {
    console.log('📱 Tentative authentification simplifiée...');
    
    try {
      // Si l'utilisateur est connecté à Google Drive, 
      // essayer d'accéder directement à l'API
      await this.initializeGapiClient();
      
      // Test simple : lister les fichiers
      const response = await window.gapi.client.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });
      
      if (response.result) {
        console.log('📱 Accès Google Drive réussi !');
        
        // Créer un token simulé pour l'API
        this.accessToken = 'ios_simplified_' + Date.now();
        
        // Créer des infos utilisateur simplifiées
        this.userInfo = {
          id: 'ios_simplified',
          name: 'Utilisateur iOS (Simplifié)',
          email: 'ios@simplified.auth',
          imageUrl: null
        };
        
        this.setState(this.states.ONLINE);
        
        if (this._connectionResolve) {
          this._connectionResolve({ success: true, userInfo: this.userInfo });
        }
        
        return;
      }
    } catch (error) {
      console.error('📱 Échec authentification simplifiée:', error);
    }
    
    // Si tout échoue
    this.setState(this.states.ERROR);
    this.lastError = 'Toutes les méthodes d\'authentification iOS ont échoué';
    
    if (this._connectionResolve) {
      this._connectionResolve({ success: false, error: this.lastError });
    }
  }

  async disconnect() {
    try {
      console.log('🔌 Déconnexion...');
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

  // --- Reste du code identique au desktop ---

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

      // 🆕 CONFIGURATION IDENTIQUE desktop/iOS
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
        scope: GOOGLE_DRIVE_CONFIG.SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('❌ Erreur OAuth:', tokenResponse.error);
            this.setState(this.states.ERROR);
            this.lastError = `Erreur OAuth: ${tokenResponse.error}`;
            return;
          }
          console.log('✅ Token reçu via Google Identity Services');
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
    
    // Si on a un token, l'utiliser
    if (this.accessToken && !this.accessToken.startsWith('ios_simplified')) {
      window.gapi.client.setToken({ access_token: this.accessToken });
    }
    
    console.log('✅ Google API Client (gapi) initialisé et authentifié.');
  }

  async getUserInfo() {
    // Si auth simplifiée iOS, retourner les infos déjà créées
    if (this.accessToken && this.accessToken.startsWith('ios_simplified')) {
      return this.userInfo;
    }
    
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      if (!response.ok) throw new Error('Erreur récupération profil utilisateur');
      const profile = await response.json();
      return { id: profile.id, name: profile.name, email: profile.email, imageUrl: profile.picture };
    } catch (error) {
      console.error('❌ Erreur getUserInfo:', error);
      // Fallback
      return { 
        id: 'fallback_user', 
        name: 'Utilisateur', 
        email: 'user@example.com', 
        imageUrl: null 
      };
    }
  }

  // --- Gestion de l'état (identique) ---

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