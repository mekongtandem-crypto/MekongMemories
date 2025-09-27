/**
 * ConnectionManager v2.0 - Redirect Flow
 * Réécriture complète pour utiliser la librairie Google Identity Services (GIS)
 * avec un flux de redirection. Cette méthode est robuste et compatible avec
 * les navigateurs mobiles stricts.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class ConnectionManager {
  constructor() {
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;

    this.state = {
      isConnecting: false,
      isOnline: false,
      userInfo: null,
      hasError: false,
      lastError: null,
    };
    this.listeners = new Set();
    console.log('🔌 ConnectionManager v2.0 (Redirect Flow): Prêt.');
  }

  // Point d'entrée, appelé depuis main.jsx
  initialize = () => {
    console.log('🔌 ConnectionManager: Initialisation...');
    this.loadGisScript(); // On charge Google Identity Services en premier
  }

  // Charge le script de Google Identity Services (pour l'authentification)
  loadGisScript = () => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = this.gisLoaded;
    document.body.appendChild(script);
  }

  // Charge le script de l'API Google (pour interagir avec Drive)
  loadGapiScript = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = this.gapiLoaded;
    document.body.appendChild(script);
  }

  // Callback : une fois que GIS est chargé
  gisLoaded = () => {
    console.log('✅ Google Identity Services (GIS) chargé.');
    this.gisInited = true;
    
    // Initialise le client d'authentification
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
      scope: GOOGLE_DRIVE_CONFIG.SCOPES,
      callback: this.handleTokenResponse, // Fonction à appeler avec le jeton d'accès
    });

    // Une fois GIS prêt, on peut charger le reste de l'API Google
    this.loadGapiScript();
  }

  // Callback : une fois que GAPI est chargé
  gapiLoaded = () => {
    gapi.load('client:oauth2', this.initializeGapiClient);
  }
  
  // Initialise le client GAPI pour pouvoir appeler les API Drive
  initializeGapiClient = async () => {
    await gapi.client.init({
      apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
      discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
    });
    console.log('✅ Google API Client (GAPI) chargé.');
    this.gapiInited = true;

    // Tente une connexion silencieuse au cas où l'utilisateur a déjà une session valide
    this.connect(true);
  }

  // Démarre le processus de connexion
  connect = (prompt = false) => {
    if (!this.gapiInited || !this.gisInited) {
      console.warn("Tentative de connexion avant initialisation complète.");
      return;
    }
    this.updateState({ isConnecting: true, hasError: false, lastError: null });
    // `prompt: 'consent'` force l'affichage de l'écran de connexion Google
    // `prompt: ''` (ou absent) tente une connexion silencieuse
    this.tokenClient.requestAccessToken({ prompt: prompt ? 'consent' : '' });
  }

  // Gère la réponse de Google après la tentative de connexion
  handleTokenResponse = async (tokenResponse) => {
    if (tokenResponse.error) {
      this.updateState({ hasError: true, lastError: tokenResponse.error_description, isConnecting: false });
      // Si la tentative silencieuse échoue, on propose une connexion manuelle
      if (tokenResponse.error === 'user_logged_out' || tokenResponse.error === 'immediate_failed') {
          // On ne fait rien, on attend que l'utilisateur clique sur "Se connecter"
          console.log("Connexion silencieuse échouée. L'utilisateur doit se connecter manuellement.");
          this.updateState({isConnecting: false, isOnline: false});
      }
      return;
    }

    console.log('Jeton d\'accès reçu. Récupération des informations utilisateur...');
    // Sauvegarde le jeton pour les futurs appels API
    gapi.client.setToken(tokenResponse);
    
    try {
      const profile = await gapi.client.oauth2.userinfo.get();
      this.updateState({
        isOnline: true,
        isConnecting: false,
        userInfo: { name: profile.result.name, email: profile.result.email, picture: profile.result.picture },
      });
      console.log(`✅ Connexion réussie pour ${profile.result.name}.`);
    } catch (error) {
      this.updateState({ hasError: true, lastError: 'Impossible de récupérer les informations utilisateur.', isConnecting: false });
    }
  }

  // Déconnexion
  disconnect = () => {
    const token = gapi.client.getToken();
    if (token) {
      google.accounts.oauth2.revoke(token.access_token, () => {
        gapi.client.setToken('');
        this.updateState({ isOnline: false, userInfo: null, isConnecting: false });
        console.log('🔌 Déconnexion réussie.');
      });
    }
  }

  // --- Méthodes de gestion d'état ---
  updateState = (newState) => {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState = () => this.state;
  
  subscribe = (callback) => {
    this.listeners.add(callback);
    callback(this.state);
    return () => this.listeners.delete(callback);
  }
  
  notify = () => {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const connectionManager = new ConnectionManager();

if (typeof window !== 'undefined') {
  window.connectionManager = connectionManager;
}