/**
 * PhotoDataV2.js v3.7 - OPTIMISÉ MOBILE + Support photos importées (v3.0)
 * ✅ FIX: Format lh3.googleusercontent.com en priorité pour mobile
 * ✅ PERFORMANCE: Moins de tests d'URL, résolution plus rapide
 * ✅ FALLBACKS: Autres formats en cas d'échec
 *
 * ⭐ v3.0 Extension :
 * - Support photos importées avec source: 'imported'
 * - Les objets photo portent maintenant :
 *   - source: 'mastodon' | 'moment' | 'imported'
 *   - momentId: string | null (null = photo non associée, en attente)
 * - PhotoDataV2 reste un résolveur d'URL agnostique de la source
 */

import { stateManager } from './StateManager.js';

class PhotoDataV2 {
  constructor() {
    this.masterIndex = null;
    this.isLoaded = false;
    this.loadedAt = null;
    this.urlCache = new Map();
    this.debugMode = false; // Désactivé en production
    this.deviceInfo = this.detectDevice();
    
    console.log(`📸 PhotoDataV2 v3.6 (Mobile Optimized): ${this.deviceInfo.type}`);
    this.init();
  }

  detectDevice() {
    if (typeof navigator === 'undefined') return { type: 'server', isMobile: false };
    
    const userAgent = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    return { type: isMobile ? 'mobile' : 'desktop', isMobile, isIOS, isAndroid, isSafari };
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

  // ✅ SOLUTION OPTIMISÉE: Format mobile en priorité
  async resolveImageUrl(photo, isThumbnail = false) {
    if (!photo) return this.getPlaceholderImageUrl();

    const size = isThumbnail ? 'w400' : 'w800';
    const cacheKey = `${this.getPhotoCacheKey(photo)}_${size}_v36`;
    
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
      const finalUrl = this.buildOptimalUrl(fileId, size);
      this.urlCache.set(cacheKey, finalUrl);
      return finalUrl;
    } else if (filename) {
      // Recherche par nom de fichier
      this.logDebug(`🔍 Photo sans ID, recherche par nom: ${filename}`);
      const foundId = await this.fallbackImageSearch(filename);
      if (foundId) {
        const finalUrl = this.buildOptimalUrl(foundId, size);
        this.urlCache.set(cacheKey, finalUrl);
        return finalUrl;
      }
    }

    const placeholderUrl = this.getPlaceholderImageUrl();
    this.urlCache.set(cacheKey, placeholderUrl);
    return placeholderUrl;
  }

  // ✅ NOUVEAU: Construction d'URL optimale selon le device
  buildOptimalUrl(fileId, size) {
    const sizeNumber = size.replace('w', ''); // w400 -> 400

    if (this.deviceInfo.isMobile) {
      // ✅ MOBILE: Format lh3 en priorité (celui qui fonctionne)
      return `https://lh3.googleusercontent.com/d/${fileId}=w${sizeNumber}-h${sizeNumber}`;
    } else {
      // ✅ DESKTOP: Format standard Drive
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
    }
  }

  // ✅ FALLBACK: Version avec test si l'URL optimale échoue
  async resolveImageUrlWithFallback(photo, isThumbnail = false) {
    const primaryUrl = await this.resolveImageUrl(photo, isThumbnail);
    
    // Si c'est déjà un placeholder, pas besoin de test
    if (primaryUrl.startsWith('data:image/svg+xml')) {
      return primaryUrl;
    }

    // Test rapide de l'URL primaire
    const testResult = await this.testImageUrl(primaryUrl, 2000);
    
    if (testResult.success) {
      return primaryUrl;
    }

    // Si échec, essayer les formats alternatifs
    this.logDebug(`⚠️ URL primaire échouée, test des fallbacks...`);
    
    let fileId = photo.google_drive_id;
    if (!fileId && photo.url) {
      const foundId = await this.fallbackImageSearch(photo.url.split('/').pop());
      if (foundId) fileId = foundId;
    }

    if (fileId) {
      const size = isThumbnail ? 'w400' : 'w800';
      const fallbackUrls = this.getFallbackUrls(fileId, size);
      
      for (const url of fallbackUrls) {
        const test = await this.testImageUrl(url, 2000);
        if (test.success) {
          this.logDebug(`✅ Fallback réussi: ${url.substring(0, 50)}...`);
          // Mettre à jour le cache avec l'URL qui fonctionne
          const cacheKey = `${this.getPhotoCacheKey(photo)}_${size}_v36`;
          this.urlCache.set(cacheKey, url);
          return url;
        }
      }
    }

    return this.getPlaceholderImageUrl();
  }

  // ✅ NOUVEAU: URLs de fallback selon le device
  getFallbackUrls(fileId, size) {
    const sizeNumber = size.replace('w', '');
    
    if (this.deviceInfo.isMobile) {
      return [
        // Autres formats pour mobile
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/thumbnail?sz=${size}&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`,
      ];
    } else {
      return [
        // Autres formats pour desktop
        `https://lh3.googleusercontent.com/d/${fileId}=w${sizeNumber}-h${sizeNumber}`,
        `https://drive.google.com/thumbnail?sz=${size}&id=${fileId}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
      ];
    }
  }

  // ✅ Test rapide d'URL
  async testImageUrl(url, timeout = 3000) {
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
      
      img.onerror = () => {
        clearTimeout(timer);
        resolve({ success: false, error: 'load_error' });
      };
      
      img.src = url;
    });
  }

  async fallbackImageSearch(filename) {
    try {
      if (!window.gapi?.client?.drive || !filename) return null;
      
      this.logDebug(`🔍 Recherche Drive API pour: name='${filename}'`);
      
      const response = await window.gapi.client.drive.files.list({
        q: `name='${filename}' and trashed=false and mimeType contains 'image'`,
        fields: 'files(id)', 
        pageSize: 1
      });
      
      if (response.result.files && response.result.files.length > 0) {
        const fileId = response.result.files[0].id;
        this.logDebug(`✅ Fichier trouvé: ${filename} -> ${fileId}`);
        return fileId;
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Erreur recherche fallback pour ${filename}:`, error);
      return null;
    }
  }

  getPhotoCacheKey(photo) {
    return photo.google_drive_id || photo.url || photo.filename || `key_${Math.random()}`;
  }
  
  getPlaceholderImageUrl() {
     return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPj9JbWFnZT88L3RleHQ+PC9zdmc+`;
  }

  // ✅ NOUVEAU: Méthode pour forcer l'utilisation des fallbacks (debug)
  async debugPhoto(photo) {
    console.group(`🔬 DEBUG PHOTO: ${photo.filename || 'Unknown'}`);
    console.log('Photo object:', photo);
    console.log('Device info:', this.deviceInfo);
    
    if (photo.google_drive_id) {
      const primaryUrl = this.buildOptimalUrl(photo.google_drive_id, 'w400');
      console.log('Primary URL (optimal):', primaryUrl);
      
      const primaryTest = await this.testImageUrl(primaryUrl, 3000);
      console.log('Primary test result:', primaryTest);
      
      if (!primaryTest.success) {
        console.log('Testing fallbacks...');
        const fallbacks = this.getFallbackUrls(photo.google_drive_id, 'w400');
        for (let i = 0; i < fallbacks.length; i++) {
          const fallbackTest = await this.testImageUrl(fallbacks[i], 3000);
          console.log(`Fallback ${i + 1} (${fallbacks[i]}):`, fallbackTest);
        }
      }
    }
    
    console.groupEnd();
  }

  getStats() {
      if (!this.isLoaded) return { isLoaded: false };
      return { 
        isLoaded: true, 
        device: this.deviceInfo,
        cacheSize: this.urlCache.size,
        ...this.masterIndex.metadata 
      };
  }

  // ✅ NOUVEAU: Vider le cache pour forcer le rechargement avec la nouvelle logique
  clearUrlCache() {
    this.urlCache.clear();
    console.log('📸 Cache URL vidé, prochaines images utiliseront la nouvelle logique');
  }
}

// Export et exposition sur window
export const photoDataV2 = new PhotoDataV2();
if (typeof window !== 'undefined') { 
  window.photoDataV2 = photoDataV2;
  
  // Fonctions de debug
  window.debugPhoto = (photo) => photoDataV2.debugPhoto(photo);
  window.clearPhotoCache = () => photoDataV2.clearUrlCache();
}