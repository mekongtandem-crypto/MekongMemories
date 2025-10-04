/**
 * DriveSync.js v1.6 - Chargement des sessions au démarrage
 * NOUVEAU : La fonction loadAllData charge maintenant l'index ET toutes les sessions.
 * Contient toutes les fonctions nécessaires pour la synchronisation avec Google Drive.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class DriveSync {
  constructor() {
    this.connectionManager = null;
    this.appFolderId = null;
    console.log('☁️ DriveSync v1.6 (Charge les sessions): Prêt.');
  }

  initialize({ connectionManager }) {
    this.connectionManager = connectionManager;
  }

  // --- API PUBLIQUE (pour les autres modules) ---

  /**
   * CORRIGÉ : Charge maintenant l'index et TOUTES les sessions.
   */
  async loadAllData() {
    console.log('📥 DriveSync: Chargement de toutes les données de l\'application...');
    const results = {};

    // 1. Charger le fichier d'index principal
    results.masterIndex = await this.loadFile(GOOGLE_DRIVE_CONFIG.FILES.masterIndex);

    // 2. Charger toutes les sessions
    results.sessions = await this.loadAllSessions();
    
    return results;
  }

  /**
   * NOUVEAU : Liste tous les fichiers commençant par "session_"
   * dans le dossier de l'app et charge leur contenu.
   */
  async loadAllSessions() {
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');
    
    await this.ensureAppFolder();
    
    const sessionFiles = await this.listFiles({
      q: `name starts with 'session_' and '${this.appFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (!sessionFiles || sessionFiles.length === 0) {
      console.log('ℹ️ Aucune session trouvée sur le Drive.');
      return []; // Retourne un tableau vide si aucune session n'est trouvée
    }

    // Charger le contenu de chaque fichier de session en parallèle
    const sessionPromises = sessionFiles.map(file => 
      window.gapi.client.drive.files.get({ fileId: file.id, alt: 'media' })
        .then(response => JSON.parse(response.body))
    );

    const sessions = await Promise.all(sessionPromises);
    console.log(`✅ ${sessions.length} session(s) chargée(s) depuis le Drive.`);
    return sessions;
  }
  
  async loadFileFromPath(filename, folderPath = []) {
    console.log(`🗂️ Recherche de "${filename}" dans le chemin: ${folderPath.join('/')}`);
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');

    let currentFolderId = 'root';

    for (const folderName of folderPath) {
      const folders = await this.listFiles({
        q: `'${currentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        pageSize: 1
      });
      if (folders.length === 0) throw new Error(`Dossier intermédiaire introuvable: "${folderName}" dans le chemin.`);
      currentFolderId = folders[0].id;
    }

    const files = await this.listFiles({
      q: `'${currentFolderId}' in parents and name='${filename}' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1
    });

    if (files.length === 0) throw new Error(`Fichier "${filename}" introuvable dans ${folderPath.join('/')}`);
    
    const response = await window.gapi.client.drive.files.get({ fileId: files[0].id, alt: 'media' });
    try {
      return JSON.parse(response.body);
    } catch(e) {
      return response.body;
    }
  }

  // ... (deleteFile, saveFile, loadFile, etc. restent identiques)
  async deleteFile(filename) {
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');
    try {
      const file = await this.findFileInAppFolder(filename);
      if (!file) {
        console.log(`⚠️ Tentative de suppression d'un fichier déjà inexistant: ${filename}`);
        return;
      }
      await window.gapi.client.drive.files.delete({
        fileId: file.id
      });
      console.log(`✅ Fichier supprimé sur Drive: ${filename}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du fichier "${filename}" sur Drive:`, error);
      throw new Error(`Erreur API Drive (suppression): ${error.details || error.message}`);
    }
  }

  async saveFile(filename, data, contentType = 'application/json') {
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');
    
    await this.ensureAppFolder();
    const existingFile = await this.findFileInAppFolder(filename);

    const fileMetadata = { name: filename, parents: existingFile ? undefined : [this.appFolderId] };
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: contentType }));
    
    const url = existingFile
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const method = existingFile ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${window.gapi.client.getToken().access_token}` },
      body: form,
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Erreur API Google Drive: ${errorBody.error.message}`);
    }
    
    console.log(`✅ Fichier sauvegardé sur Drive: ${filename}`);
    return await response.json();
  }
  
  async loadFile(filename) {
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');
    
    const file = await this.findFileInAppFolder(filename);
    if (!file) {
      console.log(`Fichier non trouvé dans le dossier de l'app: ${filename}`);
      return null;
    }
    
    const response = await window.gapi.client.drive.files.get({ fileId: file.id, alt: 'media' });
    try {
      return JSON.parse(response.body);
    } catch (e) {
      return response.body;
    }
  }

/**
 * Recherche un fichier par son nom dans tout le Drive
 */
async searchFileByName(fileName, mimeType = null) {
  if (!this.connectionManager.getState().isOnline) {
    throw new Error('Non connecté.');
  }
  
  try {
    const query = mimeType 
      ? `name='${fileName}' and mimeType='${mimeType}' and trashed=false`
      : `name='${fileName}' and trashed=false`;
    
    const response = await this.listFiles({
      q: query,
      fields: 'files(id, name)',
      pageSize: 10
    });
    
    console.log(`🔍 Recherche "${fileName}": ${response.length} résultat(s)`);
    return response;
    
  } catch (error) {
    console.error(`❌ Erreur recherche "${fileName}":`, error);
    throw error;
  }
}

async getFileMetadata(fileId, fields = 'id,name,parents') {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields: fields
    });
    return response.result;
  } catch (error) {
    console.error(`❌ Erreur getFileMetadata pour ${fileId}:`, error);
    throw error;
  }
}

  // --- Fonctions Utilitaires Internes ---

async listFiles(options) {
  if (!this.connectionManager.getState().isOnline) {
    throw new Error('Non connecté.');
  }
  
  try {
    let allFiles = [];
    let pageToken = null;
    
    do {
      const queryParams = { 
        ...options,
        pageSize: options.pageSize || 1000  // ✅ Maximum autorisé par Google
      };
      
      if (pageToken) {
        queryParams.pageToken = pageToken;
      }
      
      const response = await window.gapi.client.drive.files.list(queryParams);
      const files = response.result.files || [];
      allFiles.push(...files);
      
      pageToken = response.result.nextPageToken;
      
      // Log pour debug
      if (pageToken) {
        console.log(`📄 DriveSync: ${allFiles.length} fichiers chargés, continuation...`);
      }
      
    } while (pageToken);
    
    console.log(`✅ DriveSync.listFiles: ${allFiles.length} fichiers au total`);
    return allFiles;
    
  } catch (error) {
    console.error('❌ Erreur lors du listage des fichiers Drive:', error);
    throw new Error(`Erreur API Drive: ${error.details || error.message}`);
  }
}

  async findFileInAppFolder(filename) {
    await this.ensureAppFolder();
    const files = await this.listFiles({
      q: `name='${filename}' and '${this.appFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    return files[0] || null;
  }

  async ensureAppFolder() {
    if (this.appFolderId) return this.appFolderId;
    const folderName = GOOGLE_DRIVE_CONFIG.APP_FOLDER_NAME;
    const existingFolders = await this.listFiles({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1,
    });
    if (existingFolders.length > 0) {
      this.appFolderId = existingFolders[0].id;
    } else {
      console.log(`Dossier applicatif "${folderName}" non trouvé, création...`);
      const fileMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
      const response = await window.gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
      this.appFolderId = response.result.id;
    }
    return this.appFolderId;
  }
}

export const driveSync = new DriveSync();
if (typeof window !== 'undefined') {
  window.driveSync = driveSync;
}
