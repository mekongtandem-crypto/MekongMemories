/**
 * imageCompression.js v3.0b - Utilitaires de compression et upload d'images
 * ✅ Compression automatique si > 2MB
 * ✅ Génération de thumbnails
 * ✅ Upload vers Google Drive (/Medias/imported/)
 * ✅ Support JPEG, PNG, HEIC, WebP
 */

import { logger } from './logger.js';

// ========================================
// CONSTANTES
// ========================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max
const COMPRESS_THRESHOLD = 2 * 1024 * 1024; // Compression si > 2MB
const JPEG_QUALITY = 0.85;
const MAX_DIMENSION = 2048; // Côté le plus long
const THUMB_DIMENSION = 400;
const THUMB_QUALITY = 0.7;

// ========================================
// VALIDATION
// ========================================

/**
 * Valider un fichier image avant traitement
 * @param {File} file - Fichier à valider
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  // Vérifier type MIME
  const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté: ${file.type}. Formats acceptés: JPEG, PNG, HEIC, WebP`
    };
  }

  // Vérifier taille max
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `Fichier trop volumineux: ${sizeMB}MB (max 10MB)`
    };
  }

  return { valid: true, error: null };
}

// ========================================
// COMPRESSION
// ========================================

/**
 * Compresser une image si elle dépasse le seuil
 * @param {File} file - Fichier image source
 * @param {Object} options - Options de compression
 * @returns {Promise<Blob>} Image compressée
 */
export async function compressImage(file, options = {}) {
  const {
    quality = JPEG_QUALITY,
    maxDimension = MAX_DIMENSION,
    forceCompress = false
  } = options;

  logger.info(`📸 Compression image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

  // Si pas de compression nécessaire (< 2MB et pas forcé)
  if (file.size < COMPRESS_THRESHOLD && !forceCompress) {
    logger.info('✅ Taille OK, pas de compression nécessaire');
    return file;
  }

  try {
    // Charger image dans un canvas
    const img = await loadImage(file);

    // Calculer nouvelles dimensions
    const { width, height } = calculateDimensions(img.width, img.height, maxDimension);

    // Créer canvas et redimensionner
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Convertir en Blob
    const blob = await canvasToBlob(canvas, quality);

    logger.success(`✅ Image compressée: ${(blob.size / 1024).toFixed(1)}KB (réduction: ${((1 - blob.size / file.size) * 100).toFixed(1)}%)`);

    return blob;
  } catch (error) {
    logger.error('❌ Erreur compression image:', error);
    throw error;
  }
}

/**
 * Générer un thumbnail pour une image
 * @param {File|Blob} file - Fichier image source
 * @returns {Promise<Blob>} Thumbnail
 */
export async function generateThumbnail(file) {
  logger.info(`🖼️ Génération thumbnail: ${file.name || 'image'}`);

  try {
    const img = await loadImage(file);
    const { width, height } = calculateDimensions(img.width, img.height, THUMB_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, THUMB_QUALITY);

    logger.success(`✅ Thumbnail généré: ${width}x${height} (${(blob.size / 1024).toFixed(1)}KB)`);

    return blob;
  } catch (error) {
    logger.error('❌ Erreur génération thumbnail:', error);
    throw error;
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Charger une image dans un élément Image
 * @param {File|Blob} file - Fichier image
 * @returns {Promise<HTMLImageElement>} Image chargée
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de charger l\'image'));
    };

    img.src = url;
  });
}

/**
 * Calculer nouvelles dimensions en conservant le ratio
 * @param {number} width - Largeur originale
 * @param {number} height - Hauteur originale
 * @param {number} maxDimension - Dimension max (côté le plus long)
 * @returns {Object} { width, height }
 */
function calculateDimensions(width, height, maxDimension) {
  // Si déjà plus petit, garder dimensions originales
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  // Calculer ratio
  const ratio = width / height;

  if (width > height) {
    // Paysage
    return {
      width: maxDimension,
      height: Math.round(maxDimension / ratio)
    };
  } else {
    // Portrait
    return {
      width: Math.round(maxDimension * ratio),
      height: maxDimension
    };
  }
}

/**
 * Convertir canvas en Blob
 * @param {HTMLCanvasElement} canvas - Canvas à convertir
 * @param {number} quality - Qualité JPEG (0-1)
 * @returns {Promise<Blob>} Blob image
 */
function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Impossible de convertir canvas en blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

// ========================================
// UPLOAD GOOGLE DRIVE
// ========================================

/**
 * Générer un nom de fichier unique pour l'upload
 * @param {string} userId - ID de l'utilisateur
 * @param {string} originalName - Nom original du fichier
 * @returns {string} Nom formaté: upload_YYYYMMDD_HHMMSS_userId.jpg
 */
export function generateUploadFilename(userId, originalName) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];

  // Extraire extension (par défaut .jpg)
  const ext = originalName.split('.').pop().toLowerCase();
  const validExt = ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext) ? ext : 'jpg';

  return `upload_${timestamp}_${userId}.${validExt}`;
}

/**
 * Uploader une image vers Google Drive (/Medias/imported/)
 * @param {Blob} imageBlob - Image à uploader
 * @param {Blob} thumbBlob - Thumbnail
 * @param {string} filename - Nom du fichier
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} { fileId, thumbFileId, url, thumbUrl }
 */
export async function uploadImageToDrive(imageBlob, thumbBlob, filename, userId) {
  logger.info(`☁️ Upload vers Drive: ${filename}`);

  try {
    // Vérifier que gapi est disponible
    if (!window.gapi?.client?.drive) {
      throw new Error('Google Drive API non disponible');
    }

    // 1. Créer le dossier /Medias/imported/ s'il n'existe pas
    const importedFolderId = await getOrCreateImportedFolder();

    // 2. Uploader l'image principale
    const fileId = await uploadFileToDrive(
      imageBlob,
      filename,
      importedFolderId
    );

    // 3. Uploader le thumbnail
    const thumbFilename = filename.replace(/\.(\w+)$/, '_thumb.$1');
    const thumbFileId = await uploadFileToDrive(
      thumbBlob,
      thumbFilename,
      importedFolderId
    );

    logger.success(`✅ Upload réussi: ${filename} (ID: ${fileId})`);

    // 4. Construire les URLs
    const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const thumbUrl = `https://drive.google.com/uc?export=view&id=${thumbFileId}`;

    return {
      fileId,
      thumbFileId,
      url,
      thumbUrl,
      filename
    };
  } catch (error) {
    logger.error('❌ Erreur upload Drive:', error);
    throw error;
  }
}

/**
 * Obtenir ou créer le dossier /Medias/imported/
 * @returns {Promise<string>} ID du dossier
 */
async function getOrCreateImportedFolder() {
  try {
    // 1. Chercher le dossier "Medias" à la racine
    const mediaFolderResponse = await window.gapi.client.drive.files.list({
      q: "name='Medias' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 1
    });

    let mediaFolderId;

    if (mediaFolderResponse.result.files && mediaFolderResponse.result.files.length > 0) {
      mediaFolderId = mediaFolderResponse.result.files[0].id;
      logger.debug('📁 Dossier Medias trouvé:', mediaFolderId);
    } else {
      // Créer le dossier Medias
      const mediaFolder = await window.gapi.client.drive.files.create({
        resource: {
          name: 'Medias',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      mediaFolderId = mediaFolder.result.id;
      logger.info('📁 Dossier Medias créé:', mediaFolderId);
    }

    // 2. Chercher le sous-dossier "imported" dans Medias
    const importedFolderResponse = await window.gapi.client.drive.files.list({
      q: `name='imported' and '${mediaFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    if (importedFolderResponse.result.files && importedFolderResponse.result.files.length > 0) {
      const importedFolderId = importedFolderResponse.result.files[0].id;
      logger.debug('📁 Dossier imported trouvé:', importedFolderId);
      return importedFolderId;
    } else {
      // Créer le sous-dossier imported
      const importedFolder = await window.gapi.client.drive.files.create({
        resource: {
          name: 'imported',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [mediaFolderId]
        },
        fields: 'id'
      });
      logger.info('📁 Dossier imported créé:', importedFolder.result.id);
      return importedFolder.result.id;
    }
  } catch (error) {
    logger.error('❌ Erreur création dossier imported:', error);
    throw error;
  }
}

/**
 * Uploader un fichier vers Google Drive
 * @param {Blob} blob - Fichier à uploader
 * @param {string} filename - Nom du fichier
 * @param {string} parentFolderId - ID du dossier parent
 * @returns {Promise<string>} ID du fichier uploadé
 */
async function uploadFileToDrive(blob, filename, parentFolderId) {
  const metadata = {
    name: filename,
    mimeType: blob.type,
    parents: [parentFolderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: new Headers({
        'Authorization': 'Bearer ' + window.gapi.auth.getToken().access_token
      }),
      body: form
    }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

// ========================================
// WORKFLOW COMPLET
// ========================================

/**
 * ⭐ v2.9m : Traitement LOCAL uniquement (sans upload Drive)
 * Utilisé pour préparer une image avant confirmation utilisateur
 * @param {File} file - Fichier image à traiter
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données image en mémoire (Blobs + ObjectURL)
 */
export async function processImageLocally(file, userId) {
  logger.info(`🎨 Traitement LOCAL image: ${file.name}`);

  // 1. Validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Compression (si nécessaire)
  const compressedBlob = await compressImage(file);

  // 3. Génération thumbnail
  const thumbBlob = await generateThumbnail(compressedBlob);

  // 4. Génération nom de fichier
  const filename = generateUploadFilename(userId, file.name);

  // 5. Créer ObjectURL pour preview (à révoquer plus tard)
  const previewUrl = URL.createObjectURL(compressedBlob);
  const thumbPreviewUrl = URL.createObjectURL(thumbBlob);

  logger.success(`✅ Image traitée en mémoire: ${filename} (${(compressedBlob.size / 1024).toFixed(1)}KB)`);

  // 6. Retourner données en mémoire (PAS encore uploadé sur Drive)
  return {
    file,                  // File original (pour référence)
    compressedBlob,        // Image compressée (à uploader plus tard)
    thumbBlob,             // Thumbnail (à uploader plus tard)
    filename,              // Nom généré pour l'upload
    originalName: file.name,
    size: compressedBlob.size,
    type: compressedBlob.type,
    previewUrl,            // ObjectURL pour affichage immédiat
    thumbPreviewUrl,       // ObjectURL du thumbnail
    processedAt: new Date().toISOString()
  };
}

/**
 * ⭐ v2.9m : Upload d'une image déjà traitée localement
 * @param {Object} processedData - Résultat de processImageLocally()
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Métadonnées de l'image uploadée
 */
export async function uploadProcessedImage(processedData, userId) {
  logger.info(`☁️ Upload image prétraitée: ${processedData.filename}`);

  const { compressedBlob, thumbBlob, filename, originalName, size, type } = processedData;

  // 1. Upload vers Drive
  const uploadResult = await uploadImageToDrive(compressedBlob, thumbBlob, filename, userId);

  logger.success(`✅ Upload terminé: ${filename}`);

  // 2. Retourner métadonnées complètes
  return {
    google_drive_id: uploadResult.fileId,
    filename: uploadResult.filename,
    url: uploadResult.url,
    thumb_url: uploadResult.thumbUrl,
    source: 'imported',
    momentId: null, // Non associé à un moment
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
    originalName,
    size,
    type
  };
}

/**
 * Workflow complet: validation + compression + upload
 * @param {File} file - Fichier image à traiter
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Métadonnées de l'image uploadée
 */
export async function processAndUploadImage(file, userId) {
  logger.info(`🚀 Traitement image: ${file.name}`);

  // 1. Validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Compression (si nécessaire)
  const compressedBlob = await compressImage(file);

  // 3. Génération thumbnail
  const thumbBlob = await generateThumbnail(compressedBlob);

  // 4. Génération nom de fichier
  const filename = generateUploadFilename(userId, file.name);

  // 5. Upload vers Drive
  const uploadResult = await uploadImageToDrive(compressedBlob, thumbBlob, filename, userId);

  // 6. Retourner métadonnées complètes
  return {
    google_drive_id: uploadResult.fileId,
    filename: uploadResult.filename,
    url: uploadResult.url,
    thumb_url: uploadResult.thumbUrl,
    source: 'imported',
    momentId: null, // Non associé à un moment
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
    originalName: file.name,
    size: compressedBlob.size,
    type: compressedBlob.type
  };
}

/**
 * ⭐ v2.9m : Nettoyer les ObjectURLs d'une image traitée localement
 * @param {Object} processedData - Résultat de processImageLocally()
 */
export function cleanupProcessedImage(processedData) {
  if (!processedData) return;

  if (processedData.previewUrl) {
    URL.revokeObjectURL(processedData.previewUrl);
    logger.debug('🧹 ObjectURL révoqué: previewUrl');
  }

  if (processedData.thumbPreviewUrl) {
    URL.revokeObjectURL(processedData.thumbPreviewUrl);
    logger.debug('🧹 ObjectURL révoqué: thumbPreviewUrl');
  }
}

/**
 * Ouvrir le file picker natif
 * @param {boolean} multiple - Autoriser sélection multiple
 * @returns {Promise<FileList>} Fichiers sélectionnés
 */
export function openFilePicker(multiple = false) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/heic,image/heif,image/webp';
    input.multiple = multiple;

    input.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        resolve(files);
      } else {
        reject(new Error('Aucun fichier sélectionné'));
      }
    };

    input.oncancel = () => {
      reject(new Error('Sélection annulée'));
    };

    input.click();
  });
}
