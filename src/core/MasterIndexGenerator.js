/**
 * ==============================================================================
 * MasterIndexGenerator.js v5.3 - Préservation Données Utilisateur (v2.18)
 * ==============================================================================
 *
 * RESPONSABILITÉS :
 * - Génération du MasterIndex (moments unifiés)
 * - Fusion photos + posts Mastodon
 * - Mapping photos Mastodon avec google_drive_id
 * - ⭐ Préservation COMPLÈTE données utilisateur entre régénérations (v5.3)
 * - Préservation thèmes entre régénérations (v5.1)
 * - Reporting progression temps réel
 *
 * ⚠️ PRÉREQUIS MANUEL SUR GOOGLE DRIVE :
 *
 * STRUCTURE ATTENDUE POUR LES PHOTOS MASTODON :
 *
 * Medias/
 * └── Mastodon/
 *     └── Mastodon_Photos/          ← Dossier unique (structure APLATIE)
 *         ├── photo1.jpg
 *         ├── photo2.jpg
 *         └── photo3.jpg
 *
 * Les photos Mastodon doivent être TOUTES dans le dossier "Mastodon_Photos".
 * Ne pas conserver l'arborescence complexe type "/media_attachments/files/109/..."
 *
 * IMPORTANT : Cette restructuration doit être faite MANUELLEMENT sur Drive
 * avant de générer le MasterIndex, car elle évite les chemins longs et complexes.
 *
 * ==============================================================================
 *
 * CHANGELOG :
 * ✅ v5.3 (App v2.18) : Préservation données utilisateur
 *    - Moments importés (source='imported')
 *    - Notes de photos (category='user_added')
 *    - Photos importées (source='imported')
 * ✅ v5.2 : Progression incrémentale scan photos
 * ✅ v5.1 : Préservation thèmes
 * ✅ v5.0 : Logger intégré + suppression URLs relatives Mastodon
 *
 * ==============================================================================
 */

import { driveSync } from './DriveSync.js';
import { mastodonData } from './MastodonData.js';
import { logger } from '../utils/logger.js';

class MasterIndexGenerator {
  
  // ========================================
  // CONSTRUCTOR
  // ========================================
  
  constructor() {
    this.debugMode = true;
    this.version = '5.3-user-data-preservation';
    this.progressCallback = null;

    logger.info(`MasterIndexGenerator ${this.version}: Ready`);
  }

  // ========================================
  // INITIALISATION
  // ========================================

  initialize({ driveSync, mastodonData }) {
    this.driveSync = driveSync;
    this.mastodonData = mastodonData;
    logger.debug('MasterIndexGenerator: Dependencies injected');
  }

  log(message, data = null) {
    if (this.debugMode) {
      logger.debug(`MIG: ${message}`, data || '');
    }
  }
  
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  reportProgress(step, message, progress = null) {
    logger.info(`[${step}] ${message}`);
    if (this.progressCallback) {
      this.progressCallback({ step, message, progress });
    }
  }

  // ========================================
  // PRÉSERVATION THÈMES (v5.1)
  // ========================================

  /**
   * Charge les thèmes depuis l'ancien MasterIndex
   * Appelé AVANT régénération pour ne pas perdre les thèmes
   * 
   * @returns {Promise<Array>} Liste des thèmes ou []
   */
  async loadExistingThemes() {
    try {
      logger.info('Chargement thèmes existants...');
      
      const oldIndex = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');
      
      if (oldIndex && oldIndex.themes) {
        logger.success(`${oldIndex.themes.length} thèmes préservés`);
        return oldIndex.themes;
      }
      
      logger.info('Aucun thème existant (première génération)');
      return [];
      
    } catch (error) {
      logger.warn('Erreur chargement thèmes', error.message);
      return [];
    }
  }

  /**
   * ⭐ v2.17j : Charge les contenus ajoutés par l'utilisateur
   * À préserver lors de la régénération du masterIndex
   *
   * @returns {Promise<Object>} { importedMoments: [], userContentByMomentId: Map }
   */
  async loadUserAddedContent() {
    try {
      logger.info('Chargement contenus utilisateur...');

      const oldIndex = await this.driveSync.loadFile('mekong_master_index_v3_moments.json');

      if (!oldIndex || !oldIndex.moments) {
        logger.info('Aucun contenu existant (première génération)');
        return { importedMoments: [], userContentByMomentId: new Map() };
      }

      const importedMoments = [];
      const userContentByMomentId = new Map();

      // Parcourir tous les moments de l'ancien index
      for (const moment of oldIndex.moments) {

        // 1. Préserver moments importés COMPLETS (source='imported')
        if (moment.source === 'imported') {
          importedMoments.push(moment);
          logger.debug(`Moment importé préservé: ${moment.id} (${moment.title})`);
          continue;
        }

        // 2. Pour moments Mastodon: extraire posts user_added + photos imported
        const userContent = {
          userAddedPosts: [],
          importedPhotos: []
        };

        // Extraire posts user_added (Notes de photos)
        if (moment.posts && Array.isArray(moment.posts)) {
          const userPosts = moment.posts.filter(p => p.category === 'user_added');
          if (userPosts.length > 0) {
            userContent.userAddedPosts = userPosts;
            logger.debug(`${userPosts.length} notes de photos dans ${moment.id}`);
          }
        }

        // Extraire photos imported (sans texte, dans dayPhotos[])
        if (moment.dayPhotos && Array.isArray(moment.dayPhotos)) {
          const importedPhotos = moment.dayPhotos.filter(p => p.source === 'imported');
          if (importedPhotos.length > 0) {
            userContent.importedPhotos = importedPhotos;
            logger.debug(`${importedPhotos.length} photos importées dans ${moment.id}`);
          }
        }

        // Stocker si du contenu utilisateur trouvé
        if (userContent.userAddedPosts.length > 0 || userContent.importedPhotos.length > 0) {
          userContentByMomentId.set(moment.id, userContent);
        }
      }

      logger.success(
        `Préservation: ${importedMoments.length} moments importés, ` +
        `${userContentByMomentId.size} moments avec contenu utilisateur`
      );

      return { importedMoments, userContentByMomentId };

    } catch (error) {
      logger.warn('Erreur chargement contenus utilisateur', error.message);
      return { importedMoments: [], userContentByMomentId: new Map() };
    }
  }

  /**
   * ⭐ v2.18 FIX CRITIQUE : Fusionne les contenus utilisateur dans les moments Mastodon régénérés
   *
   * Stratégie de matching:
   * 1. Match par ID exact (moment_X_Y)
   * 2. Fallback: Match par dayStart/dayEnd si ID échoue
   *
   * @param {Array} unifiedMoments - Moments Mastodon fraîchement régénérés
   * @param {Map} userContentByMomentId - Contenus utilisateur groupés par momentId
   */
  mergeUserContentIntoMoments(unifiedMoments, userContentByMomentId) {
    if (userContentByMomentId.size === 0) {
      logger.info('Aucun contenu utilisateur à fusionner');
      return;
    }

    logger.info(`🔍 Fusion: ${userContentByMomentId.size} moments avec contenus à restaurer`);

    let mergedPosts = 0;
    let mergedPhotos = 0;
    let matchedByID = 0;
    let matchedByDay = 0;

    // Créer index dayStart/dayEnd pour fallback
    const momentsByDayRange = new Map();
    unifiedMoments.forEach(moment => {
      const key = `${moment.dayStart}_${moment.dayEnd}`;
      momentsByDayRange.set(key, moment);
    });

    // Parcourir les contenus utilisateur à restaurer
    for (const [oldMomentId, userContent] of userContentByMomentId.entries()) {

      // Stratégie 1: Match par ID exact
      let targetMoment = unifiedMoments.find(m => m.id === oldMomentId);

      if (targetMoment) {
        matchedByID++;
        logger.debug(`✅ Match par ID: ${oldMomentId}`);
      } else {
        // Stratégie 2: Match par dayStart/dayEnd (fallback)
        // Extraire dayStart/dayEnd de l'ancien ID si possible
        const idMatch = oldMomentId.match(/moment_(\d+)_(\d+)/);
        if (idMatch) {
          const dayStart = parseInt(idMatch[1]);
          const dayEnd = parseInt(idMatch[2]);
          const key = `${dayStart}_${dayEnd}`;
          targetMoment = momentsByDayRange.get(key);

          if (targetMoment) {
            matchedByDay++;
            logger.info(`✅ Match par jour: ${oldMomentId} → ${targetMoment.id} (J${dayStart}-J${dayEnd})`);
          }
        }
      }

      if (!targetMoment) {
        logger.warn(`❌ Aucun match trouvé pour ${oldMomentId}`);
        continue;
      }

      // Réinjecter posts user_added (Notes de photos)
      if (userContent.userAddedPosts.length > 0) {
        if (!targetMoment.posts) {
          targetMoment.posts = [];
        }
        targetMoment.posts.push(...userContent.userAddedPosts);
        mergedPosts += userContent.userAddedPosts.length;
        logger.info(`📝 ${userContent.userAddedPosts.length} notes réintégrées dans ${targetMoment.id}`);
      }

      // Réinjecter photos imported (dans dayPhotos[])
      if (userContent.importedPhotos.length > 0) {
        if (!targetMoment.dayPhotos) {
          targetMoment.dayPhotos = [];
        }
        targetMoment.dayPhotos.push(...userContent.importedPhotos);
        mergedPhotos += userContent.importedPhotos.length;
        logger.info(`📸 ${userContent.importedPhotos.length} photos réintégrées dans ${targetMoment.id}`);
      }
    }

    const totalMatched = matchedByID + matchedByDay;
    const totalExpected = userContentByMomentId.size;

    if (totalMatched < totalExpected) {
      logger.warn(`⚠️ ${totalExpected - totalMatched} moments avec contenus NON trouvés`);
    }

    logger.success(
      `Fusion terminée: ${mergedPosts} notes + ${mergedPhotos} photos réintégrées ` +
      `(${matchedByID} par ID + ${matchedByDay} par jour = ${totalMatched}/${totalExpected} moments)`
    );
  }

  // ========================================
  // GÉNÉRATION PRINCIPALE
  // ========================================

  async generateMomentsStructure() {
    try {
      this.reportProgress('init', 'Démarrage génération...', 0);

      // 1. Charger thèmes existants (v5.1)
      this.reportProgress('themes', 'Préservation thèmes...', 5);
      const existingThemes = await this.loadExistingThemes();

      // ⭐ v2.18 : Charger contenus utilisateur (moments importés + notes + photos)
      this.reportProgress('user-content', '🔒 Sauvegarde données utilisateur...', 7);
      const { importedMoments, userContentByMomentId } = await this.loadUserAddedContent();

      // Message détaillé après chargement
      const totalUserContent = importedMoments.length + userContentByMomentId.size;
      if (totalUserContent > 0) {
        this.reportProgress('user-content-loaded',
          `✅ ${importedMoments.length} moments + ${userContentByMomentId.size} moments avec notes/photos préservés`,
          8);
      }

      // 2. Import posts Mastodon
      this.reportProgress('mastodon', '📥 Import posts Mastodon...', 10);
      await this.mastodonData.importFromGoogleDrive();

      // 3. Analyse photo moments (avec progression v5.2)
      this.reportProgress('photos', 'Analyse photo moments...', 25);
      const photoMoments = await this.analyzePhotoMoments();

      // 4. Analyse posts par jour
      this.reportProgress('posts', 'Analyse posts Mastodon...', 50);
      const postsByDay = this.analyzeMastodonPostsByDay();
      this.reportProgress('posts', 'Posts analysés', 60);

      // 5. Mapping photos Mastodon
      this.reportProgress('mapping', 'Mapping photos Mastodon...', 70);
      const mastodonPhotoMapping = await this.buildMastodonPhotoMapping();
      this.reportProgress('mapping', `${Object.keys(mastodonPhotoMapping).length} photos mappées`, 75);

      // 6. Création moments unifiés
      this.reportProgress('merge', 'Création moments unifiés...', 80);
      const unifiedMoments = await this.createUnifiedMoments(photoMoments, postsByDay);
      this.reportProgress('merge', `${unifiedMoments.length} moments unifiés`, 85);

      // ⭐ v2.18 : Réinjecter contenus utilisateur dans moments Mastodon
      if (userContentByMomentId.size > 0 || importedMoments.length > 0) {
        this.reportProgress('user-merge', '🔄 Restauration notes et photos importées...', 87);
        this.mergeUserContentIntoMoments(unifiedMoments, userContentByMomentId);

        // ⭐ v2.18 : Ajouter moments importés complets
        if (importedMoments.length > 0) {
          unifiedMoments.push(...importedMoments);
          this.reportProgress('user-merge-moments', `✅ ${importedMoments.length} moments importés ajoutés`, 89);
        }
      }

      this.reportProgress('merge-complete', `✅ ${unifiedMoments.length} moments totaux`, 90);

      // 7. Construction structure finale (avec thèmes v5.1)
      this.reportProgress('build', 'Construction structure finale...', 95);
      const finalStructure = this.buildFinalStructure(unifiedMoments, existingThemes);

      // 8. Sauvegarde Drive
      this.reportProgress('save', 'Sauvegarde Google Drive...', 97);
      await this.driveSync.saveFile(
        'mekong_master_index_v3_moments.json', 
        JSON.stringify(finalStructure, null, 2)
      );
      
      this.reportProgress('complete', `Index généré: ${finalStructure.metadata.total_moments} moments`, 100);
      
      return { success: true, structure: finalStructure };
      
    } catch (error) {
      this.reportProgress('error', `Erreur: ${error.message}`, -1);
      logger.error('Erreur critique génération', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // ANALYSE PHOTO MOMENTS (v5.2)
  // ========================================

  /**
   * Analyse les dossiers photos et crée les moments
   * v5.2 : Progression incrémentale pendant le scan
   */
  async analyzePhotoMoments() {
    logger.info('Analyse dossiers photos...');
    
    const allFolders = await this.searchAllFoldersInPhotos();
    const photoMoments = [];
    
    // v5.2 : Reporter progression pendant le scan
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
      
      // Reporter progression (25% → 40% = 15 points)
      processedFolders++;
      const progressPercent = 25 + Math.floor((processedFolders / totalFolders) * 15);
      this.reportProgress(
        'photos', 
        `Scan photos: ${processedFolders}/${totalFolders}`, 
        progressPercent
      );
    }
    
    photoMoments.sort((a, b) => a.dayStart - b.dayStart);
    logger.success(`${photoMoments.length} photo moments trouvés`);
    
    return photoMoments;
  }

  async searchAllFoldersInPhotos() {
    logger.debug('Recherche dossiers "Photos"...');
    
    const photosFolderResponse = await this.driveSync.searchFileByName(
      'Photos', 
      'application/vnd.google-apps.folder'
    );
    
    if (!photosFolderResponse || photosFolderResponse.length === 0) {
      throw new Error('Dossier racine "Photos" introuvable');
    }
    
    const photosFolderId = photosFolderResponse[0].id;
    logger.debug(`Dossier "Photos" trouvé: ${photosFolderId}`);

    const subFolders = await this.driveSync.listFiles({
      q: `'${photosFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    logger.debug(`${subFolders.length} sous-dossiers trouvés`);
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

  // ========================================
  // MAPPING PHOTOS MASTODON
  // ========================================

  async buildMastodonPhotoMapping() {
    this.reportProgress('mapping', 'Recherche Mastodon_Photos...');
    
    try {
      const folderResponse = await this.driveSync.searchFileByName(
        'Mastodon_Photos', 
        'application/vnd.google-apps.folder'
      );
      
      if (!folderResponse || folderResponse.length === 0) {
        this.reportProgress('mapping', 'Dossier Mastodon_Photos introuvable');
        return {};
      }
      
      this.reportProgress('mapping', 'Chargement photos Mastodon...');
      
      const allPhotos = await this.driveSync.listFiles({
        q: `'${folderResponse[0].id}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1000
      });
      
      this.reportProgress('mapping', `${allPhotos.length} photos trouvées`);
      
      // Créer mapping filename → google_drive_id
      const mapping = {};
      for (const photo of allPhotos) {
        mapping[photo.name] = {
          google_drive_id: photo.id,
          filename: photo.name
        };
      }
      
      return mapping;
      
    } catch (error) {
      this.reportProgress('mapping', `Erreur mapping: ${error.message}`);
      return {};
    }
  }

  // ========================================
  // PARSING FOLDER NAMES
  // ========================================

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
    
    this.log(`Aucun pattern pour dossier: "${folderName}"`);
    return null;
  }

  // ========================================
  // ANALYSE POSTS MASTODON
  // ========================================

  analyzeMastodonPostsByDay() {
    logger.info('Analyse posts Mastodon...');
    
    const posts = this.mastodonData.getPosts() || [];
    const postsByDay = {};
    
    posts.forEach(post => {
      const day = post.dayNumber > 137 ? 0 : post.dayNumber;
      
      if (day !== null && day >= 0) {
        if (!postsByDay[day]) postsByDay[day] = [];
        postsByDay[day].push({ ...post, dayNumber: day });
      }
    });
    
    logger.success(`${posts.length} posts répartis par jour`);
    return postsByDay;
  }

  // ========================================
  // CRÉATION MOMENTS UNIFIÉS
  // ========================================

  async createUnifiedMoments(photoMoments, postsByDay) {
    logger.info('Fusion moments photos + posts...');

    const mastodonPhotoMapping = await this.buildMastodonPhotoMapping();

    const unifiedMoments = [...photoMoments];
    const processedDays = new Set(
      photoMoments.flatMap(m =>
        Array.from({length: m.dayEnd - m.dayStart + 1}, (_, i) => m.dayStart + i)
      )
    );

    // ⭐ v2.18 FIX : Assigner IDs aux moments photo AVANT de merger les posts
    unifiedMoments.forEach(moment => {
      if (!moment.id) {
        moment.id = `moment_${moment.dayStart}_${moment.dayEnd}`;
      }
    });

    // Enrichir moments existants avec posts
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
            moment.postPhotos.push(
              ...(post.photos || []).map(p => ({...p, type: 'post_photo'}))
            );
          });
        }
      }
    });

    // Créer moments pour jours sans dossier photo
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
    logger.success(`${unifiedMoments.length} moments unifiés créés`);
    
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
      // ✅ IMPORTANT : Supprimer l'URL relative incorrecte
      // Les photos Mastodon doivent être chargées via google_drive_id uniquement
      // 
      // PRÉREQUIS MANUEL SUR DRIVE :
      // Toutes les photos Mastodon doivent être dans un dossier unique : 
      // "Medias/Mastodon/Mastodon_Photos/" (structure aplatie)
      // Les chemins longs type "/media_attachments/files/109/..." ne sont plus utilisés
      
      const { url, ...photoWithoutUrl } = photo; // Supprimer l'URL incorrecte
      
      return {
        ...photoWithoutUrl,
        google_drive_id: mappingInfo.google_drive_id,
        filename: mappingInfo.filename,
        // Ne pas inclure l'URL Mastodon originale (relative et incorrecte)
        // PhotoDataV2 utilisera google_drive_id pour générer l'URL correcte
      };
    } else {
      logger.warn(`Photo Mastodon non trouvée: ${filename}`);
      return photo; // Conserver tel quel si non trouvée
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

  // ========================================
  // STRUCTURE FINALE (v5.1)
  // ========================================

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
      
      // v5.1 : Préserver thèmes existants
      themes: existingThemes,
      
      metadata: {
        total_moments: unifiedMoments.length,
        total_posts: total_posts,
        total_photos_from_days: total_photos_day,
        total_photos_from_posts: total_photos_post,
        total_photos: total_photos_day + total_photos_post,
        themes_count: existingThemes.length
      },
      
      moments: unifiedMoments
    };
  }
}

// ========================================
// EXPORT & GLOBAL
// ========================================

export const masterIndexGenerator = new MasterIndexGenerator();

if (typeof window !== 'undefined') {
  window.masterIndexGenerator = masterIndexGenerator;
}