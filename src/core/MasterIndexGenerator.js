/**
 * MasterIndexGenerator.js v4.1 - Mapping photos Mastodon aplaties
 * Photos Mastodon dans : Medias/Mastodon/Mastodon_Photos/
 */

import { driveSync } from './DriveSync.js';
import { mastodonData } from './MastodonData.js';

class MasterIndexGenerator {
  constructor() {
    this.debugMode = true;
    this.version = '4.1-mastodon-flat';
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

  async generateMomentsStructure() {
    try {
      console.log('🚀 Démarrage de la génération de l\'index par moments...');
      await this.mastodonData.importFromGoogleDrive();
      
      console.log('📸 Analyse photo moments...');
      const photoMoments = await this.analyzePhotoMoments();
      console.log(`✅ ${photoMoments.length} photo moments`);
      
      console.log('📝 Analyse posts...');
      const postsByDay = this.analyzeMastodonPostsByDay();
      console.log(`✅ Posts analysés`);
      
      console.log('🔗 Création moments unifiés...');
      const unifiedMoments = await this.createUnifiedMoments(photoMoments, postsByDay);
      console.log(`✅ ${unifiedMoments.length} moments unifiés`);
      
      console.log('📦 Construction structure finale...');
      const finalStructure = this.buildFinalStructure(unifiedMoments);

      console.log('💾 Sauvegarde sur Drive...');
      await this.driveSync.saveFile('mekong_master_index_v3_moments.json', JSON.stringify(finalStructure, null, 2));
      
      console.log(`✅ Index généré avec succès: ${finalStructure.metadata.total_moments} moments.`);
      return { success: true, structure: finalStructure };
    } catch (error) {
      console.error('❌ Erreur critique lors de la génération de l\'index:', error);
      console.error('Stack trace:', error.stack);
      return { success: false, error: error.message };
    }
  }

  async analyzePhotoMoments() {
    console.log('🔍 Analyse des dossiers de photos pour créer les moments...');
    const allFolders = await this.searchAllFoldersInPhotos();
    const photoMoments = [];

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

  async buildMastodonPhotoMapping() {
    console.log('🖼️ Mapping photos Mastodon (structure aplatie)...');
    
    try {
      const folderResponse = await this.driveSync.searchFileByName('Mastodon_Photos', 'application/vnd.google-apps.folder');
      if (!folderResponse || folderResponse.length === 0) {
        console.warn('⚠️ Dossier Mastodon_Photos introuvable');
        return {};
      }
      
      console.log('📂 Dossier Mastodon_Photos trouvé');
      
      // UNE SEULE requête pour toutes les photos
      const allPhotos = await this.driveSync.listFiles({
        q: `'${folderResponse[0].id}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: 'files(id, name)',
        pageSize: 1000  // ✅ AJOUT
      });
      
      console.log(`📸 ${allPhotos.length} photos trouvées dans Mastodon_Photos`);
      
      // Créer mapping par nom de fichier
      const mapping = {};
      for (const photo of allPhotos) {
        mapping[photo.name] = {
          google_drive_id: photo.id,
          filename: photo.name
        };
      }
      
      console.log(`✅ Mapping créé pour ${Object.keys(mapping).length} photos`);
      return mapping;
      
    } catch (error) {
      console.error('❌ Erreur mapping Mastodon:', error);
      return {};
    }
  }

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

  buildFinalStructure(unifiedMoments) {
    const total_posts = unifiedMoments.reduce((sum, m) => sum + (m.posts?.length || 0), 0);
    const total_photos_day = unifiedMoments.reduce((sum, m) => sum + (m.dayPhotos?.length || 0), 0);
    const total_photos_post = unifiedMoments.reduce((sum, m) => sum + (m.postPhotos?.length || 0), 0);

    return {
      version: this.version,
      generated_at: new Date().toISOString(),
      metadata: {
        total_moments: unifiedMoments.length,
        total_posts: total_posts,
        total_photos_from_days: total_photos_day,
        total_photos_from_posts: total_photos_post,
        total_photos: total_photos_day + total_photos_post,
      },
      moments: unifiedMoments
    };
  }
}

export const masterIndexGenerator = new MasterIndexGenerator();
if (typeof window !== 'undefined') {
  window.masterIndexGenerator = masterIndexGenerator;
}