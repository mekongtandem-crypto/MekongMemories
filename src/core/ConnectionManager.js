/**
 * ConnectionManager v3.0 - STABLE
 * Gère le flux d'authentification complet avec Google Identity Services (GIS).
 * - Tente une connexion silencieuse au démarrage.
 * - Lance une connexion manuelle via un clic utilisateur.
 * - Gère correctement les jetons d'accès.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class ConnectionManager {
  constructor() {
    this.tokenClient = null;
    this.state = {
      isConnecting: true, // On commence en mode connexion
      isOnline: false,
      userInfo: null,
      hasError: false,
      lastError: null,
    };
    this.listeners = new Set();
    console.log('🔌 ConnectionManager v3.0 (Stable): Prêt.');
  }

  // Point d'entrée, appelé depuis main.jsx
  initialize = () => {
    console.log('🔌 ConnectionManager: Initialisation...');
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = this.gapiLoaded; // Démarrer avec GAPI
    document.body.appendChild(script);
  }

  // Étape 1 : GAPI est chargé
  gapiLoaded = () => {
    gapi.load('client:gis', this.gisLoaded);
  }

  // Étape 2 : GIS est chargé
  gisLoaded = async () => {
    console.log('✅ Google API & Identity Services (GIS) chargés.');
    
    // Initialise le client GAPI pour les appels à Drive
    await gapi.client.init({
      apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
      discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
    });

    // Initialise le client d'authentification
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
      scope: GOOGLE_DRIVE_CONFIG.SCOPES,
      callback: this.handleTokenResponse,
    });

    // Étape 3 : Tente une connexion silencieuse
    this.tokenClient.requestAccessToken({ prompt: '' });
  }

  // Callback central pour gérer le jeton d'accès
  handleTokenResponse = async (tokenResponse) => {
    if (tokenResponse.error) {
      this.updateState({ 
        isConnecting: false, 
        isOnline: false, 
        hasError: true, 
        lastError: 'Connexion silencieuse échouée. Veuillez vous connecter manuellement.' 
      });
      console.warn("Connexion silencieuse échouée. En attente d'une action de l'utilisateur.");
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

  // Fonction appelée par le bouton "Se connecter" de l'UI
  connect = () => {
    if (this.tokenClient) {
      this.updateState({ isConnecting: true, hasError: false, lastError: null });
      // Force l'affichage de la sélection de compte Google
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.error("Tentative de connexion manuelle avant l'initialisation du client.");
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