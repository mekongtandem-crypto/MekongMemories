/**
 * googleDrive.js - Fichier de configuration pour l'API Google Drive
 * Ce fichier centralise toutes les clés et les noms de fichiers pour l'application.
 */
export const GOOGLE_DRIVE_CONFIG = {
  // -----------------------------------------------------------------
  // ACTION REQUISE : Vérifiez que vos clés sont correctes
  // -----------------------------------------------------------------
  CLIENT_ID: '82966045106-hso0nr386agcuojllnud0dr41vcsh45a.apps.googleusercontent.com',
  API_KEY: 'AIzaSyDiyLLN4EsyVREGxF4TzqbuKyugaq4TUXw',
  
  // --- Configuration Standard ---
  // Le SCOPE inclut maintenant les infos utilisateur pour une connexion plus stable
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/drive.readonly profile email openid',
  
  APP_FOLDER_NAME: 'MemoireDuMekong-Data',

  // Liste des fichiers que l'application gère
  // APRÈS
	FILES: {
  		masterIndex: 'mekong_master_index_v3_moments.json',
	},

  // Configuration pour les tentatives de reconnexion
  RETRY_CONFIG: { 
    maxRetries: 3, 
    baseDelay: 1000, 
    maxDelay: 8000 
  }
};

// --- Fonction de validation ---
// S'assure que les clés ne sont pas laissées par défaut.
export function validateCredentials() {
  if (!GOOGLE_DRIVE_CONFIG.CLIENT_ID || GOOGLE_DRIVE_CONFIG.CLIENT_ID.startsWith('REMPLIR')) {
    throw new Error("CLIENT_ID Google Drive non configuré dans src/config/googleDrive.js");
  }
  if (!GOOGLE_DRIVE_CONFIG.API_KEY || GOOGLE_DRIVE_CONFIG.API_KEY.startsWith('REMPLIR')) {
    throw new Error("API_KEY Google Drive non configurée dans src/config/googleDrive.js");
  }
  console.log("Les identifiants Google Drive ont été validés.");
  return true;
}

// Pour un débogage facile dans la console du navigateur
if (typeof window !== 'undefined') {
  window.GOOGLE_DRIVE_CONFIG = GOOGLE_DRIVE_CONFIG;
}

