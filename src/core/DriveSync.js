/**
 * DriveSync.js v1.4 - Version Complète et Unifiée
 * Contient toutes les fonctions nécessaires pour DataManager, MasterIndexGenerator, et MastodonData.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class DriveSync {
  constructor() {
    this.connectionManager = null;
    this.appFolderId = null;
    console.log('☁️ DriveSync v1.4 (Complet): Prêt.');
  }

  initialize({ connectionManager }) {
    this.connectionManager = connectionManager;
  }

  // --- API PUBLIQUE (pour les autres modules) ---

  async loadAllData() {
    console.log('📥 DriveSync: Chargement de toutes les données de l\'application...');
    const results = {};
    for (const key in GOOGLE_DRIVE_CONFIG.FILES) {
      const filename = GOOGLE_DRIVE_CONFIG.FILES[key];
      results[key] = await this.loadFile(filename);
    }
    return results;
  }
  
  async loadFileFromPath(filename, folderPath = []) {
    console.log(`🗂️ Recherche de "${filename}" dans le chemin: ${folderPath.join('/')}`);
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');

    let currentFolderId = 'root'; // On commence à la racine du Drive de l'utilisateur

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

  // --- Fonctions Utilitaires Internes ---

  async listFiles(options) {
    if (!this.connectionManager.getState().isOnline) throw new Error('Non connecté.');
    try {
      const response = await window.gapi.client.drive.files.list(options);
      return response.result.files || [];
    } catch (error) {
      console.error('Erreur lors du listage des fichiers Drive:', error);
      throw new Error(`Erreur API Drive: ${error.details || error.message}`);
    }
  }

  async searchFileByName(name, mimeType) {
    let query = `name='${name}' and trashed=false`;
    if (mimeType) {
      query += ` and mimeType='${mimeType}'`;
    }
    return await this.listFiles({ q: query, fields: 'files(id, name)' });
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
    const existingFolders = await this.searchFileByName(folderName, 'application/vnd.google-apps.folder');

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