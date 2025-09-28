/**
 * ConnectionManager v0.9.1 - Utiliser l'URL Authentique Google + Modification Minimale
 * Ne plus construire l'URL manuellement, utiliser GIS avec des workarounds iOS
 */

// ConnectionManager.js - Intercepter l'URL Google et la modifier pour iOS

async connect() {
  console.log('🔌 Démarrage connexion...');
  this.setState(this.states.CONNECTING);
  
  try {
    if (!this.gisInitialized) {
      await this.initializeGoogleIdentityServices();
    }
    
    // 🆕 iOS : Intercepter l'URL Google Identity Services
    if (this.isIOS) {
      return this.connectIOSWithUrlInterception();
    } else {
      // Desktop : méthode normale
      this.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
      return new Promise((resolve) => { this._connectionResolve = resolve; });
    }
    
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    this.setState(this.states.ERROR);
    this.lastError = error.message;
    return { success: false, error: error.message };
  }
}

// 🆕 MÉTHODE iOS : Intercepter et modifier l'URL Google
async connectIOSWithUrlInterception() {
  console.log('📱 iOS - Interception URL Google Identity Services...');
  
  const userConfirm = confirm(
    'Vous allez être redirigé vers Google pour l\'authentification.\n\n' +
    'Après connexion, vous reviendrez automatiquement à l\'application.'
  );
  
  if (!userConfirm) {
    this.setState(this.states.OFFLINE);
    return { success: false, error: 'Connexion annulée' };
  }
  
  // Intercepter les tentatives d'ouverture de popup pour capturer l'URL
  const originalWindowOpen = window.open;
  let interceptedUrl = null;
  
  window.open = function(url, target, features) {
    if (url && url.includes('accounts.google.com/o/oauth2')) {
      console.log('📱 URL Google interceptée:', url);
      interceptedUrl = url;
      return null; // Empêcher l'ouverture du popup
    }
    return originalWindowOpen.call(this, url, target, features);
  };
  
  try {
    // Déclencher Google Identity Services (va tenter d'ouvrir popup)
    this.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
    
    // Attendre que l'URL soit interceptée
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restaurer window.open
    window.open = originalWindowOpen;
    
    if (interceptedUrl) {
      // 🆕 Modifier l'URL pour iOS
      const modifiedUrl = this.modifyUrlForIOS(interceptedUrl);
      console.log('📱 URL modifiée pour iOS:', modifiedUrl);
      
      // Sauvegarder l'état avant redirection
      localStorage.setItem('ios_auth_in_progress', JSON.stringify({
        timestamp: Date.now(),
        originalUrl: interceptedUrl
      }));
      
      // Redirection directe avec l'URL modifiée
      window.location.href = modifiedUrl;
    } else {
      throw new Error('Impossible d\'intercepter l\'URL Google');
    }
    
  } catch (error) {
    console.error('❌ Erreur interception URL:', error);
    // Restaurer window.open en cas d'erreur
    window.open = originalWindowOpen;
    throw error;
  }
  
  return new Promise(() => {}); // Pas de résolution car on redirige
}

// 🆕 MÉTHODE : Modifier l'URL Google pour iOS
modifyUrlForIOS(originalUrl) {
  try {
    const url = new URL(originalUrl);
    
    // Remplacer storagerelay:// par une vraie URL de redirection
    const currentAppUrl = window.location.origin + window.location.pathname;
    url.searchParams.set('redirect_uri', currentAppUrl);
    
    // Optionnel : ajuster d'autres paramètres si nécessaire
    // url.searchParams.set('ux_mode', 'redirect'); // Pas nécessaire car on redirige déjà
    
    return url.toString();
  } catch (error) {
    console.error('❌ Erreur modification URL:', error);
    return originalUrl; // Fallback
  }
}

// 🆕 MÉTHODE : Vérifier retour OAuth au démarrage (constructor)
constructor() {
  // ... code existant ...
  
  // Vérifier retour OAuth iOS
  if (this.isIOS) {
    this.checkForIOSAuthReturn();
  }
}

// 🆕 MÉTHODE : Gérer retour OAuth iOS
checkForIOSAuthReturn() {
  const hash = window.location.hash;
  const params = new URLSearchParams(window.location.search);
  
  // Vérifier si on revient d'une auth OAuth
  const isAuthInProgress = localStorage.getItem('ios_auth_in_progress');
  
  if (!isAuthInProgress) return; // Pas d'auth en cours
  
  console.log('📱 Retour auth iOS détecté...');
  
  // Chercher token dans hash (#access_token=...)
  if (hash.includes('access_token=')) {
    const hashParams = new URLSearchParams(hash.replace('#', '?'));
    const token = hashParams.get('access_token');
    const error = hashParams.get('error');
    
    if (error) {
      console.error('📱 Erreur OAuth hash:', error);
      this.setState(this.states.ERROR);
      this.lastError = `Erreur OAuth: ${error}`;
    } else if (token) {
      console.log('📱 Token OAuth trouvé:', token.substring(0, 20) + '...');
      this.handleIOSAuthSuccess(token);
    }
    
    // Nettoyer
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('ios_auth_in_progress');
    return;
  }
  
  // Chercher code dans params (?code=...)
  const code = params.get('code');
  const error = params.get('error');
  
  if (error) {
    console.error('📱 Erreur OAuth params:', error);
    this.setState(this.states.ERROR);
    this.lastError = `Erreur OAuth: ${error}`;
  } else if (code) {
    console.log('📱 Code OAuth trouvé:', code.substring(0, 20) + '...');
    // Pour un code, il faudrait un backend pour l'échanger
    // Pour l'instant, on simule un token
    this.handleIOSAuthSuccess('token_from_code_' + code);
  }
  
  if (code || error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('ios_auth_in_progress');
  }
}

// 🆕 MÉTHODE : Traiter succès auth iOS
async handleIOSAuthSuccess(token) {
  try {
    console.log('📱 Traitement succès auth iOS...');
    this.setState(this.states.CONNECTING);
    
    this.accessToken = token;
    await this.finalizeConnection();
    
  } catch (error) {
    console.error('❌ Erreur finalisation iOS:', error);
    this.setState(this.states.ERROR);
    this.lastError = `Erreur finalisation: ${error.message}`;
  }
}