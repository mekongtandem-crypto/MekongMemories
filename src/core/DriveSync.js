/**
 * DriveSync v1.0 - Real Mode & Modular Architecture
 * This module handles all communication with the Google Drive API.
 * It is configured to run in "real mode" by default, connecting to the user's actual Google Drive.
 */
import { GOOGLE_DRIVE_CONFIG } from '../config/googleDrive.js';

class DriveSync {
  constructor() {
    this.connectionManager = null;
    this.simulationMode = false; // REAL MODE by default
    this.appFolderId = null;
    this.operationQueue = [];
    this.isProcessing = false;
    console.log('☁️ DriveSync v1.0: Ready (Real Mode).');
  }

  initialize(dependencies) {
    this.connectionManager = dependencies.connectionManager;
    this.connectionManager.subscribe(this.handleConnectionChange.bind(this));
    console.log('☁️ DriveSync: Initialized with dependencies.');
  }
  
  handleConnectionChange(connectionState) {
    console.log(`📡 DriveSync: Connection state changed: ${connectionState.state}`);
    if (connectionState.isOnline && this.operationQueue.length > 0) {
      this.processQueue();
    }
  }

  // --- PUBLIC API ---

  async loadAllData() {
    console.log('📥 DriveSync: Loading all data from REAL Google Drive...');
    const results = {};
    const fileKeys = Object.keys(GOOGLE_DRIVE_CONFIG.FILES);

    for (const key of fileKeys) {
      try {
        const fileContent = await this.loadData(key);
        results[key] = fileContent;
      } catch (error) {
        console.warn(`Could not load ${key}, it might not exist yet. Continuing...`);
        results[key] = null;
      }
    }
    return { data: results };
  }

  async loadData(key) {
    const filename = GOOGLE_DRIVE_CONFIG.FILES[key];
    if (!filename) throw new Error(`Unknown file key: ${key}`);
    return this.realLoadFile(filename);
  }
  
  async saveData(key, data) {
    const filename = GOOGLE_DRIVE_CONFIG.FILES[key];
    if (!filename) throw new Error(`Unknown file key: ${key}`);
    const stringifiedData = JSON.stringify(data, null, 2);
    return this.realSaveFile(filename, stringifiedData, 'application/json');
  }

  async loadFileFromRoot(filename) {
    console.log(`📥 DriveSync: Loading "${filename}" from root...`);
    return this.realLoadFile(filename, true); // Pass true for root search
  }

  // --- REAL DRIVE OPERATIONS ---

  async realLoadFile(filename, fromRoot = false) {
    if (!this.connectionManager.getState().isOnline) {
      throw new Error('Not connected to Google Drive.');
    }
    const file = await this.findFile(filename, fromRoot);
    if (!file) {
      // This is not an error, the file might not exist yet (e.g., first run)
      console.log(`File not found on Drive: ${filename}. This is normal if it hasn't been created yet.`);
      return null;
    }
    const response = await window.gapi.client.drive.files.get({
      fileId: file.id,
      alt: 'media',
    });
    // The response body is the raw text content. Parsing happens in the calling module.
    return response.body;
  }
  
  async realSaveFile(filename, content, contentType) {
     if (!this.connectionManager.getState().isOnline) {
      throw new Error('Not connected to Google Drive.');
    }
    await this.ensureAppFolder();
    const existingFile = await this.findFile(filename);

    const fileMetadata = { name: filename };
    if (!existingFile) {
        fileMetadata.parents = [this.appFolderId];
    }
    
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
        throw new Error(`Google Drive API error: ${errorBody.error.message}`);
    }
    
    console.log(`✅ File saved successfully on Drive: ${filename}`);
    return await response.json();
  }

  async findFile(filename, fromRoot = false) {
    let query = `name='${filename}' and trashed=false`;
    if (!fromRoot) {
      await this.ensureAppFolder();
      query += ` and '${this.appFolderId}' in parents`;
    }
    
    const response = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    return response.result.files?.[0] || null;
  }

  async ensureAppFolder() {
    if (this.appFolderId) return this.appFolderId;

    const response = await window.gapi.client.drive.files.list({
      q: `name='${GOOGLE_DRIVE_CONFIG.APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    if (response.result.files && response.result.files.length > 0) {
      this.appFolderId = response.result.files[0].id;
    } else {
      const fileMetadata = {
        name: GOOGLE_DRIVE_CONFIG.APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const response = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });
      this.appFolderId = response.result.id;
    }
    console.log(`App folder ID: ${this.appFolderId}`);
    return this.appFolderId;
  }
  
  // Queue methods are for potential future use, not critical for current logic
  processQueue() { /* ... */ }
}

export const driveSync = new DriveSync();

