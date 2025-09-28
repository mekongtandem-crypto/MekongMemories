/**
 * PhotoDataV2.js v3.5 - DEBUG MOBILE + FALLBACKS
 * ✅ DEBUG: Logging étendu pour diagnostiquer les problèmes mobile
 * ✅ FALLBACKS: Multiples formats d'URL Google Drive pour mobile
 * ✅ DETECTION: User agent détaillé et tests de connectivité
 */

import { stateManager } from './StateManager.js';

class PhotoDataV2 {
  constructor() {
    this.masterIndex = null;
    this.isLoaded = false;
    this.loadedAt = null;
    this.urlCache = new Map();
    this.debugMode = true;
    this.deviceInfo = this.detectDevice();
    
    console.log(`📸 PhotoDataV2 v3.5 (Mobile Debug):`, this.deviceInfo);
    this.init();
  }

  // ✅ AMÉLIORATION: Détection device complète
  detectDevice() {
    if (typeof navigator === 'undefined') return { type: 'server', isMobile: false };
    
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    
    return {
      type: isMobile ? 'mobile' : 'desktop',
      isMobile,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      userAgent: userAgent.substring(0, 100), // Tronqué pour logs
    };
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

  // ✅ NOUVEAU: Test de connectivité URL
  async testImageUrl(url, timeout = 5000) {
    return new Promise((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.onload = img.onerror = null;
        resolve({ success: false, error: 'timeout' });
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timer);
        resolve({ success: true, width: img.width, height: img.height });
      };
      
      img.onerror = (e) => {
        clearTimeout(timer);
        resolve({ success: false, error: 'load_error', event: e });
      };
      
      img.src = url;
    });
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

  // ✅ SOLUTION PRINCIPALE: Multiples fallbacks d'URL
  async resolveImageUrl(photo, isThumbnail = false) {
    if (!photo) return this.getPlaceholderImageUrl();

    const size = isThumbnail ? 'w400' : 'w800';
    const cacheKey = `${this.getPhotoCacheKey(photo)}_${size}_${this.deviceInfo.type}`;
    
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }

    let fileId = photo.google_drive_id;
    let filename = photo.filename;

    // Logique pour les photos de post (Mastodon)
    if (!fileId && photo.url) {
        filename = photo.url.split('/').pop();
    }

    if (fileId) {
      const finalUrl = await this.tryMultipleUrlFormats(fileId, size, photo);
      this.urlCache.set(cacheKey, finalUrl);
      return finalUrl;
    } else if (filename) {
      // Recherche par nom de fichier
      this.logDebug(`🔍 Photo sans ID, recherche par nom: ${filename}`);
      const foundId = await this.fallbackImageSearch(filename);
      if (foundId) {
        const finalUrl = await this.tryMultipleUrlFormats(foundId, size, photo);
        this.urlCache.set(cacheKey, finalUrl);
        return finalUrl;
      }
    }

    const placeholderUrl = this.getPlaceholderImageUrl();
    this.urlCache.set(cacheKey, placeholderUrl);
    return placeholderUrl;
  }

  // ✅ NOUVEAU: Test multiple formats d'URL avec debugging
  async tryMultipleUrlFormats(fileId, size, photo) {
    this.logDebug(`🧪 Test multiple formats pour ${photo.filename || 'photo'} (${this.deviceInfo.type})`);
    
    // Différents formats d'URL à tester
    const urlFormats = [
      // Format 1: Standard Google Drive thumbnail
      `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`,
      
      // Format 2: Ordre des paramètres inversé (pour Safari)
      `https://drive.google.com/thumbnail?sz=${size}&id=${fileId}`,
      
      // Format 3: Format uc export pour mobile
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      
      // Format 4: Format lh3 (utilisé parfois par Google)
      `https://lh3.googleusercontent.com/d/${fileId}=w${size.replace('w', '')}-h${size.replace('w', '')}`,
      
      // Format 5: Si mobile, tentative sans authentification
      ...(this.deviceInfo.isMobile ? [
        `https://drive.google.com/file/d/${fileId}/view`,
        `https://docs.google.com/uc?export=download&id=${fileId}`
      ] : [])
    ];

    // Test chaque format
    for (let i = 0; i < urlFormats.length; i++) {
      const url = urlFormats[i];
      this.logDebug(`📱 Test format ${i + 1}/${urlFormats.length}: ${url.substring(0, 80)}...`);
      
      const testResult = await this.testImageUrl(url, 3000);
      
      if (testResult.success) {
        this.logDebug(`✅ Format ${i + 1} SUCCÈS (${testResult.width}x${testResult.height})`);
        return url;
      } else {
        this.logDebug(`❌ Format ${i + 1} échec: ${testResult.error}`);
      }
    }

    // Si aucun format ne fonctionne
    this.logDebug(`🚨 AUCUN format ne fonctionne pour ${photo.filename || fileId}`);
    
    // Log détaillé pour debug
    console.group('📱 DEBUG Mobile Image Loading');
    console.log('Device Info:', this.deviceInfo);
    console.log('Photo:', photo);
    console.log('FileID:', fileId);
    console.log('Tested URLs:', urlFormats);
    console.groupEnd();
    
    return this.getPlaceholderImageUrl();
  }

  // ✅ AMÉLIORATION: Fallback search avec retry adaptatif
  async fallbackImageSearch(filename) {
    try {
      if (!window.gapi?.client?.drive || !filename) return null;
      
      this.logDebug(`🔍 Recherche Drive API pour: name='${filename}' (${this.deviceInfo.type})`);
      
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
      
      // Retry spécial pour mobile
      if (this.deviceInfo.isMobile && error.status === 403) {
        console.log('📱 Retry spécial mobile...');
        await new Promise(resolve => setTimeout(resolve, 2000));
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
          console.error('❌ Retry mobile aussi échoué:', retryError);
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

  // ✅ NOUVEAU: Debug stats pour mobile
  getDebugStats() {
    return {
      device: this.deviceInfo,
      cacheSize: this.urlCache.size,
      isLoaded: this.isLoaded,
      masterIndexVersion: this.masterIndex?.version,
      authStatus: !!window.gapi?.client?.getToken(),
    };
  }

  // ✅ NOUVEAU: Forcer test d'une photo spécifique
  async debugPhoto(photo) {
    console.group(`🔬 DEBUG PHOTO: ${photo.filename || 'Unknown'}`);
    console.log('Photo object:', photo);
    console.log('Device info:', this.deviceInfo);
    
    if (photo.google_drive_id) {
      const url = await this.tryMultipleUrlFormats(photo.google_drive_id, 'w400', photo);
      console.log('Resolved URL:', url);
    } else {
      console.log('No google_drive_id, searching...');
      const foundId = await this.fallbackImageSearch(photo.filename);
      console.log('Found ID:', foundId);
    }
    
    console.groupEnd();
  }

  getStats() {
      if (!this.isLoaded) return { isLoaded: false };
      return { 
        isLoaded: true, 
        device: this.deviceInfo,
        ...this.masterIndex.metadata 
      };
  }
}

// Export et exposition sur window avec debug
export const photoDataV2 = new PhotoDataV2();
if (typeof window !== 'undefined') { 
  window.photoDataV2 = photoDataV2;
  
  // ✅ NOUVEAU: Fonction de debug globale
  window.debugPhoto = (photo) => photoDataV2.debugPhoto(photo);
  window.photoDebugStats = () => photoDataV2.getDebugStats();
}