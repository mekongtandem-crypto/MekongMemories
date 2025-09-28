/**
 * PhotoDataV2.js v3.4 - FIX SAFARI MOBILE
 * ✅ CORRECTION: URLs Google Drive compatibles Safari ITP
 * ✅ DÉTECTION: User agent Safari pour utiliser le bon format
 */

import { stateManager } from './StateManager.js';

class PhotoDataV2 {
  constructor() {
    this.masterIndex = null;
    this.isLoaded = false;
    this.loadedAt = null;
    this.urlCache = new Map();
    this.debugMode = true;
    this.isSafari = this.detectSafari();
    
    console.log(`📸 PhotoDataV2 v3.4 (Safari Fix): ${this.isSafari ? 'Safari détecté' : 'Autre navigateur'}`);
    this.init();
  }

  // ✅ NOUVEAU: Détection Safari pour adapter les URLs
  detectSafari() {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent;
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    
    return isSafari || isIOS;
  }

  async init() {
    try {
      const savedIndex = await stateManager.get('master_index_v3', null);
      if (savedIndex) {
        this.masterIndex = savedIndex;
        this.isLoaded = true;
        this.loadedAt = await stateManager.get('master_index_loaded_at', null);
        console.log('📸 PhotoDataV2: Index chargé depuis le cache StateManager.');
      }
    } catch (error) {
      console.error('⚠️ Erreur init PhotoDataV2:', error);
    }
  }

  initializeDependencies({ stateManager }) {
    this.stateManager = stateManager;
  }

  logDebug(message, data = null) {
    if (this.debugMode) {
      console.log(`📸 PhotoDataV2 DEBUG: ${message}`, data || '');
    }
  }

  async loadMasterIndexFromData(masterData) {
    try {
      this.logDebug('📥 Chargement du master index depuis les données directes...');
      if (!masterData) throw new Error("Les données fournies sont vides.");
      this.validateMasterIndex(masterData);
      this.masterIndex = masterData;
      this.isLoaded = true;
      this.loadedAt = new Date().toISOString();
      await this.stateManager.set('master_index_v3', masterData);
      await this.stateManager.set('master_index_loaded_at', this.loadedAt);
      const stats = this.getStats();
      this.logDebug(`✅ Master index chargé directement avec succès. Version: ${stats.version}`, stats);
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Erreur chargement master index depuis les données:', error);
      return { success: false, error: error.message };
    }
  }

  validateMasterIndex(data) {
    if (!data || !data.version || !data.metadata) {
      throw new Error('Structure du fichier maître invalide (métadonnées ou version manquantes).');
    }
    this.logDebug(`✔️ Validation de la structure (v${data.version}) réussie.`);
  }

  getTimelineCompatibleData() {
    if (!this.isLoaded || !this.masterIndex) {
      return { moments: [], byDay: {}, error: 'Index non chargé' };
    }
    return {
      moments: this.masterIndex.moments || [],
      byDay: this.masterIndex.byDay || {},
      metadata: this.masterIndex.metadata || {}
    };
  }

  // ✅ CORRECTION PRINCIPALE: URLs compatibles Safari
  async resolveImageUrl(photo, isThumbnail = false) {
    if (!photo) return this.getPlaceholderImageUrl();

    const size = isThumbnail ? 'w400' : 'w800';
    const cacheKey = `${this.getPhotoCacheKey(photo)}_${size}`;
    
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }

    let url = null;
    let fileId = photo.google_drive_id;
    let filename = photo.filename;

    // Logique pour les photos de post (Mastodon)
    if (!fileId && photo.url) {
        filename = photo.url.split('/').pop();
    }

    if (fileId) {
      // ✅ CORRECTION: Format d'URL adapté selon le navigateur
      if (this.isSafari) {
        // Format spécial pour Safari (évite l'ITP)
        url = `https://drive.google.com/thumbnail?sz=${size}&id=${fileId}`;
      } else {
        // Format standard pour les autres navigateurs
        url = `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
      }
    } else if (filename) {
      // Recherche par nom de fichier
      this.logDebug(`🔍 Photo sans ID, recherche par nom: ${filename}`);
      const foundId = await this.fallbackImageSearch(filename);
      if (foundId) {
        if (this.isSafari) {
          url = `https://drive.google.com/thumbnail?sz=${size}&id=${foundId}`;
        } else {
          url = `https://drive.google.com/thumbnail?id=${foundId}&sz=${size}`;
        }
      }
    }

    const finalUrl = url || this.getPlaceholderImageUrl();
    this.urlCache.set(cacheKey, finalUrl);
    
    // ✅ AMÉLIORATION: Log pour debug Safari
    if (this.isSafari && url) {
      this.logDebug(`🍎 Safari URL générée: ${url}`);
    }
    
    return finalUrl;
  }

  // ✅ AMÉLIORATION: Fallback search avec retry pour Safari
  async fallbackImageSearch(filename) {
    try {
      if (!window.gapi?.client?.drive || !filename) return null;
      
      this.logDebug(`Recherche Drive API pour: name='${filename}'`);
      
      const response = await window.gapi.client.drive.files.list({
        q: `name='${filename}' and trashed=false and mimeType contains 'image'`,
        fields: 'files(id)', 
        pageSize: 1
      });
      
      if (response.result.files && response.result.files.length > 0) {
        const fileId = response.result.files[0].id;
        this.logDebug(`✅ Fichier trouvé par recherche fallback : ${filename} -> ${fileId}`);
        return fileId;
      }
      
      this.logDebug(`❌ Fichier non trouvé par recherche fallback : ${filename}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Erreur recherche fallback pour ${filename}:`, error);
      
      // ✅ NOUVEAU: Retry pour Safari si erreur réseau
      if (this.isSafari && error.status === 403) {
        console.log('🍎 Retry recherche pour Safari...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const retryResponse = await window.gapi.client.drive.files.list({
            q: `name='${filename}' and trashed=false`,
            fields: 'files(id)', 
            pageSize: 1
          });
          if (retryResponse.result.files && retryResponse.result.files.length > 0) {
            return retryResponse.result.files[0].id;
          }
        } catch (retryError) {
          console.error('❌ Retry aussi échoué:', retryError);
        }
      }
      
      return null;
    }
  }

  getPhotoCacheKey(photo) {
    return photo.google_drive_id || photo.url || photo.filename || `key_${Math.random()}`;
  }
  
  getPlaceholderImageUrl() {
     return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPj9JbWFnZT88L3RleHQ+PC9zdmc+`;
  }

  // ✅ NOUVEAU: Méthode pour forcer le rechargement du cache Safari
  clearCacheForSafari() {
    if (this.isSafari) {
      this.urlCache.clear();
      console.log('🍎 Cache Safari vidé pour forcer le rechargement');
    }
  }

  getStats() {
      if (!this.isLoaded) return { isLoaded: false };
      return { 
        isLoaded: true, 
        isSafari: this.isSafari,
        ...this.masterIndex.metadata 
      };
  }
}

// Export et exposition sur window
export const photoDataV2 = new PhotoDataV2();
if (typeof window !== 'undefined') { 
  window.photoDataV2 = photoDataV2; 
}