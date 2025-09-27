/**
 * ConnectionManager v3.1 - SIMPLIFIED & ROBUST
 * - Simplifies the loading and initialization chain to prevent race conditions.
 * - Authorizes GAPI first, then initializes GIS for token management.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class ConnectionManager {
  constructor() {
    this.tokenClient = null;
    this.state = {
      isConnecting: true, // Start in connecting state
      isOnline: false,
      userInfo: null,
      hasError: false,
      lastError: null,
    };
    this.listeners = new Set();
    console.log('🔌 ConnectionManager v3.1 (Simplified): Prêt.');
  }

  initialize = () => {
    console.log('🔌 ConnectionManager: Initialisation...');
    // Step 1: Load Google's GSI client script for authentication
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = this.gisLoaded;
    document.head.appendChild(gisScript);
  }

  // Step 2: GIS script is loaded, now load GAPI script
  gisLoaded = () => {
    console.log('✅ Google Identity (GIS) script chargé.');
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = this.gapiLoaded;
    document.head.appendChild(gapiScript);
  }

  // Step 3: GAPI script is loaded, now initialize the GAPI client
  gapiLoaded = () => {
    gapi.load('client', this.initializeGapiClient);
  }

  // Step 4: GAPI client is ready, now we can initialize everything
  initializeGapiClient = async () => {
    console.log('✅ Google API (GAPI) client chargé.');
    await gapi.client.init({
      apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
      discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
    });

    // Initialize the token client for auth
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
      scope: GOOGLE_DRIVE_CONFIG.SCOPES,
      callback: this.handleTokenResponse,
    });

    // Step 5: Everything is ready, try a silent sign-in
    console.log('Tout est initialisé. Tentative de connexion silencieuse...');
    this.tokenClient.requestAccessToken({ prompt: '' });
  }
  
  // Central callback for handling the access token
  handleTokenResponse = async (tokenResponse) => {
    if (tokenResponse.error) {
      this.updateState({
        isConnecting: false,
        isOnline: false,
        hasError: false, // Not a critical error, just means user needs to sign in
        lastError: 'Connexion silencieuse échouée.',
      });
      console.warn("Connexion silencieuse échouée. L'utilisateur doit se connecter manuellement via le bouton.");
      return;
    }

    console.log('Jeton d\'accès reçu. Récupération des informations utilisateur...');
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
      this.updateState({ isConnecting: false, hasError: true, lastError: 'Impossible de récupérer les informations utilisateur.' });
    }
  }

  // Called by the "Connect" button in the UI
  connect = () => {
    if (this.tokenClient) {
      this.updateState({ isConnecting: true, hasError: false, lastError: null });
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  // Disconnect
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

  // State management methods...
  updateState = (newState) => { this.state = { ...this.state, ...newState }; this.notify(); }
  getState = () => this.state;
  subscribe = (callback) => { this.listeners.add(callback); callback(this.state); return () => this.listeners.delete(callback); }
  notify = () => { for (const listener of this.listeners) { listener(this.state); } }
}

export const connectionManager = new ConnectionManager();

if (typeof window !== 'undefined') {
  window.connectionManager = connectionManager;
}