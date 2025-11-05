/**
 * MasterIndexGenerator.js v5.0 - Avec Thèmes
 * Photos Mastodon dans : Medias/Mastodon/Mastodon_Photos/
 */

import { driveSync } from './DriveSync.js';
import { mastodonData } from './MastodonData.js';

class MasterIndexGenerator {
  constructor() {
    this.debugMode = true;
    this.version = '5.2-themes-fix-progress';
    this.progressCallback = null;
    console.log(`🗂️ MasterIndexGenerator ${this.version}: Prêt.`);
  }


  initialize({ driveSync, mastodonData }) {
    this.driveSync = driveSync;
    this.mastodonData = mastodonData;
    console.log('🗂️ MasterIndexGenerator: Dépendances injectées.');
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`MIG_DEBUG: ${message}`, data || '');
    }
  }
  
  // ✅ Méthode pour enregistrer callback
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  // ✅ Helper pour reporter progression
  reportProgress(step, message, progress = null) {
    console.log(`🔄 [${step}] ${message}`);
    if (this.progressCallback) {
      this.progressCallback({ step, message, progress });
    }
  }

  /**
   * ⭐ v5.1 : Charge la liste des thèmes depuis l'ancien MasterIndex
   * Appelé AVANT la régénération pour ne pas perdre les thèmes
   * 
   * @returns {Promise<Array>} Liste des thèmes ou []
   */
  async loadExistingThemes() {
    try {
      console.log('🏷️ Chargement des thèmes existants...');
      
      const oldIndex = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
      
      if (oldIndex && oldIndex.themes) {
        console.log(`✅ ${oldIndex.themes.length} thèmes préservés depuis l'ancien index`);
        return oldIndex.themes;
      }
      
      console.log('ℹ️ Aucun thème existant trouvé (première génération ou ancien format)');
      return [];
      
    } catch (error) {
      console.warn('⚠️ Erreur chargement thèmes existants:', error.message);
      console.warn('→ Les thèmes ne seront pas préservés (si fichier corrompu/absent)');
      return [];
    }
  }

  async generateMomentsStructure() {
    try {
      this.reportProgress('init', 'Démarrage de la génération...', 0);
      
      // ⭐ v5.1 : Charger thèmes existants AVANT régénération
      this.reportProgress('themes', 'Préservation des thèmes...', 5);
      const existingThemes = await this.loadExistingThemes();
      
      this.reportProgress('mastodon', 'Import des posts Mastodon...', 10);
      await this.mastodonData.importFromGoogleDrive();
      
      // ✅ FIX v5.2 : Reporter seulement début, la méthode reporte elle-même la progression
      this.reportProgress('photos', 'Analyse des photo moments...', 25);
      const photoMoments = await this.analyzePhotoMoments();
      // Pas de report ici, déjà fait par analyzePhotoMoments()
      
      this.reportProgress('posts', 'Analyse des posts Mastodon...', 50);
      const postsByDay = this.analyzeMastodonPostsByDay();
      this.reportProgress('posts', `✅ Posts analysés par jour`, 60);
      
      this.reportProgress('mapping', 'Mapping des photos Mastodon...', 70);
      const mastodonPhotoMapping = await this.buildMastodonPhotoMapping();
      this.reportProgress('mapping', `✅ ${Object.keys(mastodonPhotoMapping).length} photos mappées`, 75);
      
      this.reportProgress('merge', 'Création des moments unifiés...', 80);
      const unifiedMoments = await this.createUnifiedMoments(photoMoments, postsByDay);
      this.reportProgress('merge', `✅ ${unifiedMoments.length} moments unifiés`, 90);
      
      this.reportProgress('build', 'Construction de la structure finale...', 95);
      // ⭐ v5.1 : Passer les thèmes existants
      const finalStructure = this.buildFinalStructure(unifiedMoments, existingThemes);

      this.reportProgress('save', 'Sauvegarde sur Google Drive...', 97);
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', JSON.stringify(finalStructure, null, 2));
      
      this.reportProgress('complete', `✅ Index généré : ${finalStructure.metadata.total_moments} moments`, 100);
      
      return { success: true, structure: finalStructure };
      
    } catch (error) {
      this.reportProgress('error', `❌ Erreur : ${error.message}`, -1);
      console.error('❌ Erreur critique:', error);
      return { success: false, error: error.message };
    }
  }

  async analyzePhotoMoments() {
    console.log('🔍 Analyse des dossiers de photos pour créer les moments...');
    const allFolders = await this.searchAllFoldersInPhotos();
    const photoMoments = [];
    
    // ✅ FIX v5.2 : Reporter progression pendant le scan
    const totalFolders = allFolders.length;
    let processedFolders = 0;

    for (const folder of allFolders) {
      const moment = this.parseFolderToMoment(folder.name);
      if (moment) {
        const photos = await this.getPhotosInFolder(folder.id);
        if (photos.length > 0) {
          photoMoments.push({
            ...moment,
            folderId: folder.id,
            folderName: folder.name,
            dayPhotos: photos,
            photoCount: photos.length,
            source: 'photo_folder'
          });
        }
      }
      
      // ✅ Reporter progression (25% → 40% = 15 points à distribuer)
      processedFolders++;
      const progressPercent = 25 + Math.floor((processedFolders / totalFolders) * 15);
      this.reportProgress(
        'photos', 
        `Scan photos : ${processedFolders}/${totalFolders} dossiers`, 
        progressPercent
      );
    }
    
    photoMoments.sort((a, b) => a.dayStart - b.dayStart);
    console.log(`✅ ${photoMoments.length} moments basés sur les photos ont été trouvés.`);
    return photoMoments;
  }

  async searchAllFoldersInPhotos() {
    console.log('Recherche des dossiers dans le répertoire "Photos"...');
    const photosFolderResponse = await this.driveSync.searchFileByName('Photos', 'application/vnd.google-apps.folder');
    if (!photosFolderResponse || photosFolderResponse.length === 0) {
      throw new Error('Le dossier racine "Photos" est introuvable sur votre Google Drive.');
    }
    const photosFolderId = photosFolderResponse[0].id;
    console.log(`Dossier "Photos" trouvé avec l'ID: ${photosFolderId}`);

    const subFolders = await this.driveSync.listFiles({
      q: `'${photosFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    console.log(`${subFolders.length} sous-dossiers trouvés dans "Photos".`);
    return subFolders;
  }

  async getPhotosInFolder(folderId) {
    const files = await this.driveSync.listFiles({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
      fields: 'files(id, name, mimeType, imageMediaMetadata(width, height))'
    });

    return files
      .filter(file => !file.name.startsWith('.'))
      .map(file => ({
        filename: file.name,
        google_drive_id: file.id,
        type: 'day_photo',
        mime_type: file.mimeType,
        width: file.imageMediaMetadata?.width,
        height: file.imageMediaMetadata?.height
      }));
  }

  // ✅ Mapping avec reporting
  async buildMastodonPhotoMapping() {
    this.reportProgress('mapping', 'Recherche du dossier Mastodon_Photos...');
    
    try {
      const folderResponse = await this.driveSync.searchFileByName('Mastodon_Photos', 'application/vnd.google-apps.folder');
      if (!folderResponse || folderResponse.length === 0) {
        this.reportProgress('mapping', '⚠️ Dossier Mastodon_Photos introuvable');
        return {};
      }
      
      this.reportProgress('mapping', '📂 Dossier trouvé, chargement des photos...');
      
      const allPhotos = await this.driveSync.listFiles({
        q: `'${folderResponse[0].id}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1000
      });
      
      this.reportProgress('mapping', `📸 ${allPhotos.length} photos trouvées, création du mapping...`);
      
      const mapping = {};
      for (const photo of allPhotos) {
        mapping[photo.name] = {
          google_drive_id: photo.id,
          filename: photo.name
        };
      }
      
      return mapping;
      
    } catch (error) {
      this.reportProgress('mapping', `❌ Erreur mapping : ${error.message}`);
      return {};
    }
  }

  // ✅ CORRECTION : Cette méthode doit rester DANS la classe
  parseFolderToMoment(folderName) {
    const extendedPatterns = [
      { regex: /^(\d{1,3})-(\d{1,3})\.(.+)$/, name: 'PLAGE_POINT', extract: 'range' },
      { regex: /^(\d{1,3})\.(.+)$/, name: 'SIMPLE_POINT', extract: 'simple' },
      { regex: /^(\d{1,3})\s+(.+)$/, name: 'ESPACE', extract: 'simple' },
      { regex: /^(\d{1,3}):(.+)$/, name: 'DEUX_POINTS', extract: 'simple' },
      { regex: /^(\d{1,3})-(\d{1,3}):(.+)$/, name: 'PLAGE_DEUX_POINTS', extract: 'range' },
    ];
    
    for (const pattern of extendedPatterns) {
      const match = folderName.trim().match(pattern.regex);
      if (match) {
        if (pattern.extract === 'range' && match.length === 4) {
          return { 
            dayStart: parseInt(match[1]), 
            dayEnd: parseInt(match[2]), 
            title: match[3].trim(), 
            isRange: true, 
            pattern: pattern.name 
          };
        } else if (pattern.extract === 'simple' && match.length >= 3) {
          const day = parseInt(match[1]);
          return { 
            dayStart: day, 
            dayEnd: day, 
            title: match[2].trim(), 
            isRange: false, 
            pattern: pattern.name 
          };
        }
      }
    }
    this.log(`Aucun pattern trouvé pour le dossier: "${folderName}"`);
    return null;
  }

  analyzeMastodonPostsByDay() {
    console.log('🔍 Analyse des posts Mastodon...');
    const posts = this.mastodonData.getPosts() || [];
    const postsByDay = {};
    posts.forEach(post => {
      const day = post.dayNumber > 137 ? 0 : post.dayNumber;
      if (day !== null && day >= 0) {
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push({ ...post, dayNumber: day });
      }
    });
    console.log(`✅ ${posts.length} posts Mastodon répartis par jour.`);
    return postsByDay;
  }

  async createUnifiedMoments(photoMoments, postsByDay) {
    console.log('🔗 Fusion des moments photos et des posts...');
    
    const mastodonPhotoMapping = await this.buildMastodonPhotoMapping();
    
    const unifiedMoments = [...photoMoments];
    const processedDays = new Set(photoMoments.flatMap(m => 
      Array.from({length: m.dayEnd - m.dayStart + 1}, (_, i) => m.dayStart + i)
    ));

    unifiedMoments.forEach(moment => {
      moment.posts = [];
      moment.postPhotos = [];
      for (let day = moment.dayStart; day <= moment.dayEnd; day++) {
        if (postsByDay[day]) {
          const enrichedPosts = postsByDay[day].map(post => 
            this.enrichPostWithPhotoIds(post, mastodonPhotoMapping)
          );
          
          moment.posts.push(...enrichedPosts);
          enrichedPosts.forEach(post => {
            moment.postPhotos.push(...(post.photos || []).map(p => ({...p, type: 'post_photo'})));
          });
        }
      }
    });

    Object.keys(postsByDay).forEach(dayStr => {
      const day = parseInt(dayStr);
      if (!processedDays.has(day)) {
        const dayPosts = postsByDay[day];
        
        const enrichedPosts = dayPosts.map(post => 
          this.enrichPostWithPhotoIds(post, mastodonPhotoMapping)
        );
        
        const postPhotos = enrichedPosts.flatMap(p => 
          (p.photos || []).map(photo => ({...photo, type: 'post_photo'}))
        );
        
        unifiedMoments.push({
          id: `moment_${day}_post_only`,
          title: dayPosts[0].content.split('\n')[0].substring(0, 50),
          dayStart: day, 
          dayEnd: day, 
          isRange: false, 
          type: 'post_moment',
          dayPhotos: [], 
          photoCount: 0,
          posts: enrichedPosts, 
          postPhotos: postPhotos,
        });
      }
    });

    unifiedMoments.sort((a, b) => a.dayStart - b.dayStart);
    console.log(`✅ ${unifiedMoments.length} moments unifiés créés.`);
    return unifiedMoments;
  }

  enrichPostWithPhotoIds(post, mastodonPhotoMapping) {
    if (!post.photos || post.photos.length === 0) {
      return post;
    }
    
    const enrichedPhotos = post.photos.map(photo => {
      const filename = this.extractFilenameFromUrl(photo.url);
      const mappingInfo = mastodonPhotoMapping[filename];
      
      if (mappingInfo) {
        return {
          ...photo,
          google_drive_id: mappingInfo.google_drive_id,
          filename: mappingInfo.filename
        };
      } else {
        console.warn(`⚠️ Photo Mastodon non trouvée: ${filename}`);
        return photo;
      }
    });
    
    return {
      ...post,
      photos: enrichedPhotos
    };
  }

  extractFilenameFromUrl(url) {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'photo.jpg';
  }

  /**
   * Construit la structure finale du MasterIndex
   * 
   * @param {Array} unifiedMoments - Moments unifiés
   * @param {Array} existingThemes - Thèmes préservés (v5.1)
   * @returns {Object} Structure complète
   */
  buildFinalStructure(unifiedMoments, existingThemes = []) {
    const total_posts = unifiedMoments.reduce((sum, m) => sum + (m.posts?.length || 0), 0);
    const total_photos_day = unifiedMoments.reduce((sum, m) => sum + (m.dayPhotos?.length || 0), 0);
    const total_photos_post = unifiedMoments.reduce((sum, m) => sum + (m.postPhotos?.length || 0), 0);

    return {
      version: "5.2-themes-fix-progress",
      generated_at: new Date().toISOString(),
      
      // ✅ v5.1 : Préserver les thèmes existants au lieu de réinitialiser à []
      themes: existingThemes,
      
      metadata: {
        total_moments: unifiedMoments.length,
        total_posts: total_posts,
        total_photos_from_days: total_photos_day,
        total_photos_from_posts: total_photos_post,
        total_photos: total_photos_day + total_photos_post,
        themes_count: existingThemes.length // ✅ v5.1 : compteur thèmes
      },
      moments: unifiedMoments
    };
  }
}

export const masterIndexGenerator = new MasterIndexGenerator();
if (typeof window !== 'undefined') {
  window.masterIndexGenerator = masterIndexGenerator;
}