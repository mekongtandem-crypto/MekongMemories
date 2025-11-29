/**
 * MemoriesPage.jsx v7 -Phase 2
 */

// ========================================
// 1. IMPORTS (ajouter en haut)
// ========================================
import { useMemoriesState } from '../memories/hooks/useMemoriesState.js';
import { useMemoriesFilters } from '../memories/hooks/useMemoriesFilters.js';
import { useMemoriesScroll } from '../memories/hooks/useMemoriesScroll.js';
import React, { useState, useEffect, useRef, forwardRef, memo, useCallback, useImperativeHandle } from 'react';
import SessionListModal from '../SessionListModal.jsx';
import { getSessionsForContent } from '../../utils/sessionUtils.js';
import { useAppState } from '../../hooks/useAppState.js';
import MomentsList from '../memories/layout/MomentsList.jsx';
import PhotoContextMenu from '../memories/shared/PhotoContextMenu.jsx';
import PhotoViewer from '../PhotoViewer.jsx';
import SessionCreationModal from '../SessionCreationModal.jsx';
import ThemeModal from '../ThemeModal.jsx';
import PhotoToMemoryModal from '../PhotoToMemoryModal.jsx';  // ⭐ v2.8f
import EditMomentModal from '../EditMomentModal.jsx';  // ⭐ v2.9
import EditPostModal from '../EditPostModal.jsx';  // ⭐ v2.9
import ConfirmDeleteModal from '../ConfirmDeleteModal.jsx';  // ⭐ v2.9s - Modal 1 "Effacer le souvenir"
import CrossRefsWarningModal from '../CrossRefsWarningModal.jsx';  // ⭐ v2.9s - Modal 2 "Photos utilisées ailleurs"
import { openFilePicker, processAndUploadImage } from '../../utils/imageCompression.js';  // ⭐ v2.8f
import { dataManager } from '../../core/dataManager.js';  // ⭐ v2.8f
import { logger } from '../../utils/logger.js';  // ⭐ v2.8f
import { enrichMomentsWithData } from '../memories/layout/helpers.js';
//import TimelineRuleV2 from '../TimelineRule.jsx';
import {
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, X, Tag, Link,
  MessageCircle, MessageCirclePlus, MessageCircleMore, Edit2, Edit, Trash2
} from 'lucide-react';
import { 
  sortThemes, 
  generatePostKey, 
  generatePhotoMomentKey, 
  generatePhotoMastodonKey,
  generateMomentKey,
  getMomentChildrenKeys,
  getPostChildrenKeys
} from '../../utils/themeUtils.js';


// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function MemoriesPage({
  isTimelineVisible,
  setIsTimelineVisible,
  isSearchOpen,
  setIsSearchOpen,
  currentDay,
  setCurrentDay,
  displayOptions,
  isThemeBarVisible,
  navigationContext,
  onNavigateBack,
  onAttachToChat,
  selectionMode,
  onContentSelected,
  onOpenSessionFromMemories,
  editionMode,
  onCancelEditionMode
}, ref) {

const app = useAppState();
const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  
  // ========================================
  // Hooks
  // ========================================
    const memoryState = useMemoriesState();
    const memoryFilters = useMemoriesFilters(momentsData, app.sessions);
    const memoryScroll = useMemoriesScroll(navigationContext, onNavigateBack);
  
  // États legacy à conserver temporairement (compatibilité TopBar)
  const [selectedMoments, setSelectedMoments] = useState([]);
  const [displayMode, setDisplayMode] = useState('focus');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ⭐ v2.8f : Modal PhotoToMemoryModal
  // ⭐ v2.9j : Stocke soit photoData (old flow) soit file (new flow)
  const [photoToMemoryModal, setPhotoToMemoryModal] = useState({
    isOpen: false,
    photoData: null,
    file: null  // ⭐ v2.9j : Fichier brut avant traitement
  });

  // ⭐ v2.9 : Modals édition
  const [editMomentModal, setEditMomentModal] = useState({ isOpen: false, moment: null });
  const [editPostModal, setEditPostModal] = useState({ isOpen: false, post: null, momentId: null });

  // ⭐ v2.9s : MODAL 1 - "Effacer le souvenir"
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({
    isOpen: false,
    itemName: null,
    itemType: null,
    itemIcon: null,
    childrenDetails: null,
    onConfirmMemoryOnly: null,  // Effacer de la mémoire seulement
    onConfirmWithDrive: null    // Demande suppression Drive (→ Modal 2 ou direct)
  });

  // ⭐ v2.9s : MODAL 2 - "Photos utilisées ailleurs"
  const [crossRefsModal, setCrossRefsModal] = useState({
    isOpen: false,
    itemName: null,
    itemType: null,
    crossRefsWarnings: null,
    deleteContext: null,        // Contexte de suppression mémorisé
    onConfirmMemoryOnly: null,  // "Laisser sur Drive"
    onConfirmWithDrive: null    // "Supprimer du Drive" (si plus de cross-refs)
  });


  // ========================================
  // Déstructuration
  // ========================================

  const {
  // États
  openMomentId,
  openPosts,
  themeModal,
  sessionModal,
  sessionListModal,
  viewerState,
  photoContextMenu,
  selectedPhotos,
  activePhotoGrid,
  
  // Handlers
  toggleMoment,
  togglePostText,
  togglePostPhotos,
  isPostTextOpen,
  isPostPhotosOpen,
  toggleMomentPhotos,
  openThemeModal,
  closeThemeModal,
  openSessionModal,
  closeSessionModal,
  openSessionListModal,
  closeSessionListModal,
  openPhotoViewer,
  closePhotoViewer,
  openPhotoContextMenu,
  closePhotoContextMenu,
  togglePhotoSelection,
  clearPhotoSelection,
  isPhotoSelected,
  setActivePhotoGrid,
  hasOverride,
  toggleOverride
} = memoryState;

const {
  moments: filteredMoments,
  showMoments,
  showPosts,
  showPhotos,
  searchQuery,
  selectedTheme,
  momentFilter,
  sortOrder,
  setSearchQuery,
  setSelectedTheme,
  setMomentfilter,
  shouldShowElement
} = memoryFilters;

const {
  scrollContainerRef,
  momentRefs,
  registerMomentRef,
  scrollToMoment,
  executeScrollToElement
} = memoryScroll;


// ========================================
// HANDLERS MANQUANTS
// ========================================

// Handler pour ouvrir le modal de session
const handleOpenSessionModal = useCallback((source, contextMoment) => {
  openSessionModal({ source, contextMoment });
}, [openSessionModal]);

// Handler pour fermer le modal de session
const handleCloseSessionModal = useCallback(() => {
  closeSessionModal();
}, [closeSessionModal]);

// Handler pour fermer le menu contextuel photo
const handleClosePhotoContextMenu = useCallback(() => {
  closePhotoContextMenu();
}, [closePhotoContextMenu]);

// Handler pour ouvrir le menu contextuel photo
const handleOpenPhotoContextMenu = useCallback((photo, event) => {
  event.preventDefault();
  event.stopPropagation();
  
  openPhotoContextMenu(photo, {
    x: event.clientX || event.touches?.[0]?.clientX || 0,
    y: event.clientY || event.touches?.[0]?.clientY || 0
  });
}, [openPhotoContextMenu]);

// Handler pour attacher une photo au chat
const handleAttachPhotoToChat = useCallback((photo) => {
  if (!photo || !onAttachToChat) return;
  
  handleClosePhotoContextMenu();
  onAttachToChat({
    type: 'photo',
    data: photo
  });
}, [onAttachToChat, handleClosePhotoContextMenu]);

// Handler pour ouvrir le modal de thème (wrapper)
const handleOpenThemeModal = useCallback((contentKey, contentType, currentThemes = [], extraData = null) => {
  openThemeModal(contentKey, contentType, currentThemes, extraData);
}, [openThemeModal]);

// Handler pour fermer le modal de thème
const handleCloseThemeModal = useCallback(() => {
  closeThemeModal();
}, [closeThemeModal]);

// ⭐ v2.9j : Handler pour ajouter photo souvenir (REFACTO: confirmation AVANT upload)
const handleAddPhotoSouvenir = useCallback(async () => {
  try {
    logger.info('📷 Ouverture file picker pour photo souvenir');
    const files = await openFilePicker(false);

    // ⭐ v2.9j : Ouvrir modal DIRECTEMENT avec le fichier (pas encore traité)
    setPhotoToMemoryModal({
      isOpen: true,
      photoData: null,
      file: files[0]  // Fichier brut
    });
  } catch (error) {
    logger.error('❌ Erreur sélection photo:', error);
    if (error.message !== 'Sélection annulée') {
      alert(`Erreur lors de la sélection de la photo:\n${error.message}`);
    }
  }
}, []);

// ⭐ v2.9j : Handler pour conversion photo → souvenir (REFACTO: traitement après confirmation)
const handleConvertPhotoToMemory = useCallback(async (conversionData) => {
  const { photoData, file } = photoToMemoryModal;

  try {
    let finalPhotoData = photoData;

    // ⭐ v2.9j : Si on a un fichier brut, le traiter maintenant (UN SEUL spinner)
    if (file) {
      // Étape 1: Conversion de l'image
      dataManager.setLoadingOperation(true, 'Traitement du souvenir...', 'Conversion de l\'image', 'monkey');

      // Importer les fonctions de traitement
      const { compressImage, generateThumbnail, uploadImageToDrive, generateUploadFilename, validateImageFile } = await import('../../utils/imageCompression.js');

      // Validation
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Compression
      const compressedBlob = await compressImage(file);

      // Étape 2: Génération thumbnail
      dataManager.setLoadingOperation(true, 'Traitement du souvenir...', 'Génération du thumbnail', 'monkey');
      const thumbBlob = await generateThumbnail(compressedBlob);

      // Génération nom de fichier
      const filename = generateUploadFilename(app.currentUser, file.name);

      // Étape 3: Écriture sur le cloud
      dataManager.setLoadingOperation(true, 'Traitement du souvenir...', 'Écriture sur le cloud', 'monkey');
      const uploadResult = await uploadImageToDrive(compressedBlob, thumbBlob, filename, app.currentUser);

      // Créer photoData
      finalPhotoData = {
        google_drive_id: uploadResult.fileId,
        filename: uploadResult.filename,
        url: uploadResult.url,
        thumb_url: uploadResult.thumbUrl,
        source: 'imported',
        momentId: null,
        uploadedBy: app.currentUser,
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: compressedBlob.size,
        type: compressedBlob.type
      };
    }

    if (!finalPhotoData) {
      throw new Error('Aucune donnée photo disponible');
    }

    // Étape 4: Insertion de l'image
    dataManager.setLoadingOperation(true, 'Traitement du souvenir...', 'Insertion de l\'image', 'monkey');
    const result = await dataManager.addImportedPhotoToMasterIndex(finalPhotoData, conversionData);

    if (!result.success) {
      throw new Error(result.error || 'Échec de l\'insertion');
    }

    // Étape 5: Création du souvenir (si nouveau moment)
    if (conversionData.newMoment) {
      dataManager.setLoadingOperation(true, 'Traitement du souvenir...', 'Création d\'un nouveau souvenir', 'monkey');
    }

    setPhotoToMemoryModal({ isOpen: false, photoData: null, file: null });
    logger.success('🎉 Photo souvenir ajoutée depuis Memories');

    // Recharger le master index pour afficher la nouvelle photo
    await dataManager.reloadMasterIndex();

    dataManager.setLoadingOperation(false);

  } catch (error) {
    logger.error('❌ Erreur traitement photo:', error);
    dataManager.setLoadingOperation(false);
    alert(`Erreur lors du traitement:\n${error.message}`);
  }
}, [photoToMemoryModal, app.currentUser]);

// ========================================
// ⭐ v2.9 : HANDLERS ÉDITION
// ========================================

const handleEditMoment = useCallback((moment) => {
  setEditMomentModal({ isOpen: true, moment });
}, []);

const handleSaveMoment = useCallback(async (updatedMoment) => {
  try {
    await app.updateMoment(updatedMoment);
    setEditMomentModal({ isOpen: false, moment: null });
  } catch (error) {
    alert('Erreur lors de la modification : ' + error.message);
  }
}, [app]);

const handleDeleteMoment = useCallback((moment) => {
  // ⭐ v2.9s : MODAL 1 simplifié → Choix d'abord, vérification ensuite
  const impact = app.analyzeDeleteImpact('moment', { momentId: moment.id });

  // Formater cross-refs pour Modal 2 (si nécessaire)
  const formatCrossRefs = () => {
    const crossRefsWarnings = [];
    if (impact.crossRefs.total > 0) {
      const photoMap = new Map();
      impact.crossRefs.moments.forEach(m => {
        if (!photoMap.has(m.photoId)) {
          photoMap.set(m.photoId, { photoId: m.photoId, filename: m.photoId, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(m.photoId).crossRefs.push(...m.refs);
      });
      impact.crossRefs.sessions.forEach(s => {
        if (!photoMap.has(s.photoId)) {
          photoMap.set(s.photoId, { photoId: s.photoId, filename: s.photoId, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(s.photoId).sessionRefs.push(...s.refs);
      });
      crossRefsWarnings.push(...Array.from(photoMap.values()));
    }
    return crossRefsWarnings;
  };

  // ⭐ OUVRIR MODAL 1
  setConfirmDeleteModal({
    isOpen: true,
    itemName: moment.title,
    itemType: 'Moment',
    itemIcon: '📅',
    childrenDetails: impact.nestedElements,

    // BOUTON BLEU : Effacer de la mémoire (garde photos Drive)
    onConfirmMemoryOnly: async () => {
      try {
        await app.deleteMoment(moment.id, { deleteFiles: false });
        setConfirmDeleteModal({ isOpen: false });
      } catch (error) {
        alert('Erreur lors de la suppression : ' + error.message);
      }
    },

    // BOUTON ROUGE : Supprimer du Drive
    onConfirmWithDrive: () => {
      const crossRefsWarnings = formatCrossRefs();

      // Option A validée : Si PAS de cross-refs → Suppression directe
      if (crossRefsWarnings.length === 0) {
        (async () => {
          try {
            await app.deleteMoment(moment.id, { deleteFiles: true });
            setConfirmDeleteModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        })();
        return;
      }

      // Si cross-refs → Fermer Modal 1, ouvrir Modal 2
      setConfirmDeleteModal({ isOpen: false });
      setCrossRefsModal({
        isOpen: true,
        itemName: moment.title,
        itemType: 'Moment',
        crossRefsWarnings,
        deleteContext: { type: 'moment', momentId: moment.id },

        // Modal 2 - BOUTON BLEU : Laisser sur Drive
        onConfirmMemoryOnly: async () => {
          try {
            await app.deleteMoment(moment.id, { deleteFiles: false });
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        },

        // Modal 2 - BOUTON ROUGE : Supprimer du Drive (actif si plus de cross-refs)
        onConfirmWithDrive: async () => {
          try {
            await app.deleteMoment(moment.id, { deleteFiles: true });
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        }
      });
    }
  });
}, [app]);

const handleEditPost = useCallback((post, momentId) => {
  setEditPostModal({ isOpen: true, post, momentId });
}, []);

const handleSavePost = useCallback(async (updatedPost) => {
  try {
    await app.updatePost(editPostModal.momentId, updatedPost);
    setEditPostModal({ isOpen: false, post: null, momentId: null });
  } catch (error) {
    alert('Erreur lors de la modification : ' + error.message);
  }
}, [app, editPostModal.momentId]);

const handleDeletePost = useCallback((momentId, postId, postTitle) => {
  // ⭐ v2.9s : MODAL 1 simplifié (même logique que moments)
  const impact = app.analyzeDeleteImpact('post', { momentId, postId });

  const formatCrossRefs = () => {
    const crossRefsWarnings = [];
    if (impact.crossRefs.total > 0) {
      const photoMap = new Map();
      impact.crossRefs.moments.forEach(m => {
        if (!photoMap.has(m.photoId)) {
          photoMap.set(m.photoId, { photoId: m.photoId, filename: m.filename, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(m.photoId).crossRefs.push(...m.refs);
      });
      impact.crossRefs.sessions.forEach(s => {
        if (!photoMap.has(s.photoId)) {
          photoMap.set(s.photoId, { photoId: s.photoId, filename: s.filename, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(s.photoId).sessionRefs.push(...s.refs);
      });
      crossRefsWarnings.push(...Array.from(photoMap.values()));
    }
    return crossRefsWarnings;
  };

  setConfirmDeleteModal({
    isOpen: true,
    itemName: postTitle,
    itemType: 'Photo Note',
    itemIcon: '📝',
    childrenDetails: impact.nestedElements,

    onConfirmMemoryOnly: async () => {
      try {
        await app.deletePost(momentId, postId, { deleteFiles: false });
        setConfirmDeleteModal({ isOpen: false });
      } catch (error) {
        alert('Erreur lors de la suppression : ' + error.message);
      }
    },

    onConfirmWithDrive: () => {
      const crossRefsWarnings = formatCrossRefs();

      if (crossRefsWarnings.length === 0) {
        (async () => {
          try {
            await app.deletePost(momentId, postId, { deleteFiles: true });
            setConfirmDeleteModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        })();
        return;
      }

      setConfirmDeleteModal({ isOpen: false });
      setCrossRefsModal({
        isOpen: true,
        itemName: postTitle,
        itemType: 'Photo Note',
        crossRefsWarnings,
        deleteContext: { type: 'post', momentId, postId },
        onConfirmMemoryOnly: async () => {
          try {
            await app.deletePost(momentId, postId, { deleteFiles: false });
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        },
        onConfirmWithDrive: async () => {
          try {
            await app.deletePost(momentId, postId, { deleteFiles: true });
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        }
      });
    }
  });
}, [app]);

const handleDeletePhoto = useCallback((momentId, photoId, photoFilename) => {
  // ⭐ v2.9s : MODAL 1 pour photo (sans éléments fils, donc pas de childrenDetails)
  const impact = app.analyzeDeleteImpact('photo', { momentId, photoId, filename: photoFilename });

  const formatCrossRefs = () => {
    const crossRefsWarnings = [];
    if (impact.crossRefs.total > 0) {
      crossRefsWarnings.push({
        photoId,
        filename: photoFilename,
        crossRefs: impact.crossRefs.moments.flatMap(m => m.refs),
        sessionRefs: impact.crossRefs.sessions.flatMap(s => s.refs)
      });
    }
    return crossRefsWarnings;
  };

  setConfirmDeleteModal({
    isOpen: true,
    itemName: photoFilename,
    itemType: 'Photo',
    itemIcon: '📸',
    childrenDetails: null,  // Pas d'éléments fils pour photo

    // BOUTON BLEU : "Retirer de ce moment" (garde sur Drive)
    onConfirmMemoryOnly: async () => {
      try {
        await app.deletePhoto(momentId, photoId, photoFilename, false);
        setConfirmDeleteModal({ isOpen: false });
      } catch (error) {
        alert('Erreur lors du retrait : ' + error.message);
      }
    },

    // BOUTON ROUGE : "Supprimer du Drive"
    onConfirmWithDrive: () => {
      const crossRefsWarnings = formatCrossRefs();

      if (crossRefsWarnings.length === 0) {
        (async () => {
          try {
            await app.deletePhoto(momentId, photoId, photoFilename, true);
            setConfirmDeleteModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        })();
        return;
      }

      setConfirmDeleteModal({ isOpen: false });
      setCrossRefsModal({
        isOpen: true,
        itemName: photoFilename,
        itemType: 'Photo',
        crossRefsWarnings,
        deleteContext: { type: 'photo', momentId, photoId, photoFilename },
        onConfirmMemoryOnly: async () => {
          try {
            await app.deletePhoto(momentId, photoId, photoFilename, false);
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors du retrait : ' + error.message);
          }
        },
        onConfirmWithDrive: async () => {
          try {
            await app.deletePhoto(momentId, photoId, photoFilename, true);
            setCrossRefsModal({ isOpen: false });
          } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
          }
        }
      });
    }
  });
}, [app]);

// Handler pour sauvegarder les thèmes d'un post
const handleSavePostThemes = useCallback(async (selectedThemes, propagationOptions, postData) => {
  if (!postData || !app.currentUser) return;
  
  const keysToTag = [];
  
  // 1. Toujours tagger le post lui-même
  const postKey = generatePostKey(postData.post);
  keysToTag.push(postKey);
  
  // 2. Optionnellement tagger les photos du post
  if (propagationOptions.applyToPhotos && postData.photoCount > 0) {
    const photoKeys = getPostChildrenKeys(postData.post);
    keysToTag.push(...photoKeys);
  }
  
  // 3. Batch assignation
  const result = await window.themeAssignments.assignThemesBatch(
    keysToTag,
    selectedThemes,
    app.currentUser.id
  );
  
  if (result.success) {
    console.log(`✅ Post taggué (${result.count} élément${result.count > 1 ? 's' : ''})`);
  }
  
  closeThemeModal();
}, [app.currentUser, closeThemeModal]);

// Handler pour sauvegarder les thèmes d'un moment
const handleSaveMomentThemes = useCallback(async (selectedThemes, propagationOptions, momentData) => {
  if (!momentData || !app.currentUser) return;
  
  const keysToTag = [];
  
  // 1. Toujours tagger le moment lui-même
  const momentKey = generateMomentKey(momentData.moment);
  keysToTag.push(momentKey);
  
  // 2. Collecter les enfants selon options
  const childrenKeys = getMomentChildrenKeys(momentData.moment);
  
  if (propagationOptions.applyToPosts) {
    keysToTag.push(...childrenKeys.posts);
  }
  
  if (propagationOptions.applyToPostPhotos) {
    keysToTag.push(...childrenKeys.postPhotos);
  }
  
  if (propagationOptions.applyToMomentPhotos) {
    keysToTag.push(...childrenKeys.momentPhotos);
  }
  
  // 3. Batch assignation
  const result = await window.themeAssignments.assignThemesBatch(
    keysToTag,
    selectedThemes,
    app.currentUser.id
  );
  
  if (result.success) {
    console.log(`✅ Moment taggué (${result.count} élément${result.count > 1 ? 's' : ''})`);
  }
  
  closeThemeModal();
}, [app.currentUser, closeThemeModal]);

// Handler pour sauvegarder les thèmes en bulk (photos multiples)
const handleSaveBulkThemes = useCallback(async (selectedThemes, propagationOptions) => {
  if (!themeModal.bulkPhotos || !app.currentUser) return;
  
  for (const photo of themeModal.bulkPhotos) {
    const key = generatePhotoMomentKey(photo);
    if (key) {
      await window.themeAssignments.assignThemes(
        key,
        selectedThemes,
        app.currentUser.id
      );
    }
  }
  
  closeThemeModal();
  clearPhotoSelection();
}, [themeModal.bulkPhotos, app.currentUser, closeThemeModal, clearPhotoSelection]);

// Handler principal de sauvegarde des thèmes (router)
const handleSaveThemes = useCallback(async (selectedThemes, propagationOptions) => {
  if (!themeModal.contentKey && !themeModal.momentData && !themeModal.postData && !themeModal.bulkPhotos) {
    console.error('❌ Aucune donnée à sauvegarder');
    return;
  }
  
  // Router selon le type
  if (themeModal.momentData) {
    await handleSaveMomentThemes(selectedThemes, propagationOptions, themeModal.momentData);
  } else if (themeModal.postData) {
    await handleSavePostThemes(selectedThemes, propagationOptions, themeModal.postData);
  } else if (themeModal.bulkPhotos) {
    await handleSaveBulkThemes(selectedThemes, propagationOptions);
  } else {
    // Single content (photo individuelle)
    await window.themeAssignments.assignThemes(
      themeModal.contentKey,
      selectedThemes,
      app.currentUser.id
    );
    closeThemeModal();
  }
}, [
  themeModal, 
  app.currentUser, 
  handleSaveMomentThemes, 
  handleSavePostThemes, 
  handleSaveBulkThemes,
  closeThemeModal
]);

// Handler pour activer la sélection de photos
const activatePhotoSelection = useCallback((gridId) => {
  setActivePhotoGrid(gridId);
  clearPhotoSelection();
}, [setActivePhotoGrid, clearPhotoSelection]);

// Handler pour tagger en bulk
const handleBulkTagPhotos = useCallback(() => {
  if (selectedPhotos.length === 0) return;
  
  openThemeModal(null, 'photos', [], { bulkPhotos: selectedPhotos });
}, [selectedPhotos, openThemeModal]);

// Handler pour annuler la sélection
const cancelSelection = useCallback(() => {
  clearPhotoSelection();
  setActivePhotoGrid(null);
}, [clearPhotoSelection, setActivePhotoGrid]);

// Handler pour la sélection de contenu (mode lien)
const handleLongPressForSelection = useCallback((element, type) => {
  if (!selectionMode?.active) return;
  
  console.log('🔗 Sélection:', type, element);
  
  let contentData;
  
  switch(type) {
    case 'moment':
      contentData = {
        type: 'moment',
        id: element.id,
        title: element.displayTitle || `Jour ${element.dayStart}${element.dayEnd > element.dayStart ? `-${element.dayEnd}` : ''}`
      };
      break;
    
    case 'post':
      contentData = {
        type: 'post',
        id: element.id,
        title: element.content?.split('\n')[0] || 'Article sans titre'
      };
      break;
    
    case 'photo':
      contentData = {
        type: 'photo',
        id: element.filename,
        title: element.filename,
        google_drive_id: element.google_drive_id,
        url: element.url,
        width: element.width,
        height: element.height,
        mime_type: element.mime_type || element.mediaType,
        photoType: element.type || 'day_photo'
      };
      break;
    
    default:
      return;
  }
  
  onContentSelected?.(contentData);
}, [selectionMode, onContentSelected]);

// Handler pour afficher les sessions
const handleShowSessions = useCallback((contentType, contentId, contentTitle) => {
  const sessions = getSessionsForContent(app.sessions, contentType, contentId);
  openSessionListModal({ sessions, contentTitle });
}, [app.sessions, openSessionListModal]);

// Handler pour créer une session depuis un contenu
const handleCreateSessionFromContent = useCallback(async (content, momentId, contentType) => {
  try {
    const moment = app.masterIndex?.moments.find(m => m.id === momentId);
    if (!moment) {
      console.error('Moment parent introuvable');
      return;
    }
    
    handleOpenSessionModal(content, moment);
  } catch (error) {
    console.error('Erreur création session:', error);
  }
}, [app.masterIndex, handleOpenSessionModal]);

// Handler pour sélectionner une session depuis le modal
const handleSelectSession = useCallback((session) => {
  console.log('🎯 Sélection session depuis modal:', session.id);
  closeSessionListModal();
  
  if (onOpenSessionFromMemories) {
    onOpenSessionFromMemories(session);
  } else {
    console.warn('⚠️ onOpenSessionFromMemories non fourni, fallback basique');
    app.openChatSession(session);
  }
}, [app, onOpenSessionFromMemories, closeSessionListModal]);

// Handler pour sélectionner un moment
const handleSelectMoment = useCallback((moment, forceOpen = false) => {
  setSelectedMoments(prev => {
    const isAlreadySelected = prev.some(m => m.id === moment.id);
    
    if (displayMode === 'focus') {
      if (isAlreadySelected && prev.length === 1) {
        return [];
      }
      return [moment];
    } else {
      if (isAlreadySelected) {
        return prev.filter(m => m.id !== moment.id);
      }
      return [...prev, moment];
    }
  });
}, [displayMode]);

// Handler pour créer et ouvrir une session
const handleCreateAndOpenSession = useCallback(async (source, contextMoment, options = {}) => {
  if (!source) return;
  
  const sortOrder = localStorage.getItem('mekong_theme_sort_order') || 'usage';
  const rawThemes = app.masterIndex?.themes || [];
  const availableThemes = sortThemes(rawThemes, window.themeAssignments, sortOrder);
    
  const sessionTitle = options.title || (
    source.filename 
      ? `Souvenirs de ${contextMoment.displayTitle}`
      : source.content 
        ? `Souvenirs de l'article : ${source.content.split('\n')[0].substring(0, 40)}...`
        : `Souvenirs du moment : ${source.displayTitle}`
  );
  
  let sourceId;
  let sourceType;
  
  if (source.filename || source.google_drive_id) {
    sourceId = source.google_drive_id || source.filename;
    sourceType = 'photo';
  } else if (source.content) {
    sourceId = source.id || source.created_at;
    sourceType = 'post';
  } else {
    sourceId = contextMoment.id;
    sourceType = 'moment';
  }
  
  let sessionData = {
    id: sourceId,
    momentId: contextMoment.id,
    title: sessionTitle,
    description: source.filename 
      ? `Basée sur la photo "${source.filename}"`
      : source.content
        ? `Basée sur un article`
        : `Basée sur le moment "${source.displayTitle}"`,
  };
  
  if (source.filename) {
    sessionData.systemMessage = `📸 Session basée sur la photo : "${source.filename}".`;
  } else if (source.content) {
    const title = source.content.split('\n')[0].substring(0, 40);
    sessionData.systemMessage = `📄 Session basée sur l'article : "${title}...".`;
  } else {
    sessionData.systemMessage = `💬 Session basée sur le moment : "${source.displayTitle}".`;
  }
    
  try {
    const sourcePhoto = source.filename ? source : null;
    const newSession = await app.createSession(sessionData, options.initialText, sourcePhoto);
    
    if (newSession) {
      if (viewerState.isOpen) closePhotoViewer();
      
      if (options.shouldOpen) {
        await app.openChatSession(newSession);
      } else {
        console.log('✅ Session créée:', newSession.gameTitle);
      }
    }
  } catch (error) {
    console.error('Erreur création de session:', error);
    alert(`Impossible de créer la session : ${error.message}`);
  }
}, [app, viewerState.isOpen, closePhotoViewer]);

// Ref pour la navigation (éviter traitement multiple)
const navigationProcessedRef = useRef(null);


  // ========================================
  // EFFECTS
  // ========================================
  
  // Fermer menu contextuel au clic outside
  useEffect(() => {
    if (photoContextMenu.isOpen) {
      const handleClickOutside = () => handleClosePhotoContextMenu();
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [photoContextMenu.isOpen, handleClosePhotoContextMenu]);
  
  useEffect(() => {
    window.memoriesPageFilters = {
      setMomentFilter: (filter) => {
        setMomentFilter(filter);
        setTimeout(() => {
          const firstFiltered = document.querySelector('[data-filtered="true"]');
          if (firstFiltered) {
            firstFiltered.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    window.memoriesPageActions = {
      openThemeModal: handleOpenThemeModal,
      togglePhotoSelection: togglePhotoSelection,
      activatePhotoSelection: activatePhotoSelection,
      addPhotoSouvenir: handleAddPhotoSouvenir,  // ⭐ v2.8f : Ajouter photo souvenir
      // ⭐ v2.9 : Actions édition
      editMoment: handleEditMoment,
      deleteMoment: handleDeleteMoment,
      editPost: handleEditPost,
      deletePost: handleDeletePost,
      deletePhoto: handleDeletePhoto
    };

    window.memoriesPageState = {
      activePhotoGrid,
      selectedPhotos
    };

    return () => {
      delete window.memoriesPageFilters;
      delete window.memoriesPageActions;
      delete window.memoriesPageState;
    };
  }, [handleOpenThemeModal, togglePhotoSelection, activatePhotoSelection, activePhotoGrid, selectedPhotos, handleAddPhotoSouvenir, handleEditMoment, handleDeleteMoment, handleEditPost, handleDeletePost, handleDeletePhoto]);
  
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  useImperativeHandle(ref, () => ({
  jumpToRandomMoment: () => {
    if (momentsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * momentsData.length);
      const randomMoment = momentsData[randomIndex];
      handleSelectMoment(randomMoment);
      setCurrentDay(randomMoment.dayStart);
      
      // Scroll vers le moment sélectionné
      setTimeout(() => {
        scrollToMoment(randomMoment.id);
      }, 100);
    }
  },
  jumpToDay: (day) => {
    const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
    if (targetMoment) {
      handleSelectMoment(targetMoment);
      setCurrentDay(day);
      
      // Scroll vers le moment
      setTimeout(() => {
        scrollToMoment(targetMoment.id);
      }, 100);
    }
  }
}), [momentsData, setCurrentDay, scrollToMoment, handleSelectMoment]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 't':
        case 'T':
          setIsTimelineVisible(prev => !prev);
          break;
        case '/':
          e.preventDefault();
          setIsSearchOpen(true);
          break;
        case 'f':
        case 'F':
          setDisplayMode(prev => prev === 'focus' ? 'multi' : 'focus');
          break;
        case 'Escape':
          if (activePhotoGrid) {
            cancelSelection();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsTimelineVisible, setIsSearchOpen, activePhotoGrid, cancelSelection]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop;
          
          if (Math.abs(currentScrollY - lastScrollY) < 30) {
            ticking = false;
            return;
          }

          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsHeaderVisible(true);
          }

          if (currentScrollY < 50) {
            setIsHeaderVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (selectedMoments.length > 0) {
      const lastSelected = selectedMoments[selectedMoments.length - 1];
      scrollToMoment(lastSelected.id, 'start');
    }
  }, [selectedMoments]);
  
  useEffect(() => {
  window.createSessionFromModal = () => {
    if (sessionListModal) {
      // Créer session pour le contenu du modal
      // Le contexte est stocké dans sessionListModal
      // Il faut récupérer le moment depuis masterIndex
      const moment = app.masterIndex?.moments?.find(m => m.id === sessionListModal.contentId);
      if (moment) {
        handleOpenSessionModal(moment, moment);
      }
    }
  };
  
  return () => {
    delete window.createSessionFromModal;
  };
}, [sessionListModal, app.masterIndex]);
  

  // ========================================
  // PHASE 19E : NAVIGATION DEPUIS CHAT (Auto-ouvrir contenu cible)
  // ========================================
  useEffect(() => {
  // ✅ GARDE : Ne rien faire si pas de contexte de navigation
  if (!navigationContext) {
    return;
  }
  
  // Récupérer les paramètres de navigation
  const targetContent = navigationContext?.targetContent;
  const momentId = navigationContext?.sessionMomentId;
  
  // ⭐ Créer une clé unique pour cette navigation
  const navKey = targetContent 
    ? `${targetContent.type}-${targetContent.id}`
    : momentId 
      ? `moment-${momentId}`
      : null;
  
  // ⭐ Si on a déjà traité cette navigation, ignorer
  if (navKey && navKey === navigationProcessedRef.current) {
    return;
  }
  
  if ((targetContent || momentId) && momentsData.length > 0) {
  let targetMoment; // ← AJOUTER CETTE LIGNE
  
  // ========================================
  // CAS 1 : LIEN VERS POST → Trouver moment parent
  // ========================================
  if (targetContent?.type === 'post') {
    targetMoment = momentsData.find(m =>
        m.posts?.some(p => p.id === targetContent.id)
      );
      
      if (targetMoment) {
        const mode = selectionMode?.active ? '[MODE SÉLECTION]' : '[MODE NORMAL]';
        console.log(`🎯 ${mode} Ouverture post dans moment:`, targetMoment.displayTitle);
        
        // Ouvrir le moment
        setSelectedMoments([targetMoment]);
        
        // Scroll vers post spécifique
const postId = targetContent.id;
setTimeout(() => {
  const postElement = document.querySelector(`[data-post-id="${postId}"]`);
  if (postElement) {
    executeScrollToElement(postElement);
  }
}, 300);
      }
      // ⭐ Marquer comme traité
		navigationProcessedRef.current = navKey;
    }
    
    // ========================================
    // CAS 2 : LIEN VERS MOMENT DIRECT
    // ========================================
    else if (targetContent?.type === 'moment' || momentId) {
      const searchId = targetContent?.id || momentId;
      targetMoment = momentsData.find(m => m.id === searchId);
      
      if (targetMoment) {
        const mode = selectionMode?.active ? '[MODE SÉLECTION]' : '[MODE NORMAL]';
        console.log(`🎯 ${mode} Ouverture moment:`, targetMoment.displayTitle);
        
        // Ouvrir le moment
        setSelectedMoments([targetMoment]);
        
        // Scroll vers moment
const momentId = targetMoment.id;
setTimeout(() => {
  const element = momentRefs.current[momentId];
  if (element) executeScrollToElement(element);
}, 300);
      }
      // ⭐ AJOUTER ICI
      navigationProcessedRef.current = navKey;
    }
    
    // ========================================
    // CAS 3 : LIEN VERS PHOTO → Trouver moment parent + ouvrir viewer
    // ========================================
    else if (targetContent?.type === 'photo') {
      console.log('📷 Navigation vers photo:', targetContent.id);
      
      // Trouver le moment parent de la photo
      for (const moment of momentsData) {
        // Chercher dans dayPhotos
        const dayPhoto = moment.dayPhotos?.find(p => 
          p.filename === targetContent.id || 
          p.google_drive_id === targetContent.id
        );
        
        if (dayPhoto) {
          targetMoment = moment;
          console.log('✅ Photo trouvée dans dayPhotos du moment:', moment.displayTitle);
          
          // Ouvrir le moment
          setSelectedMoments([moment]);
          
          // Construire galerie complète
          const gallery = [
            ...(moment.dayPhotos || []),
            ...(moment.postPhotos || [])
          ];
          
          // Scroll vers le thumbnail de la photo (pas de PhotoViewer)
			setTimeout(() => {
  			const photoElement = document.querySelector(`[data-photo-filename="${targetContent.id}"]`);
  			if (photoElement) {
    			executeScrollToElement(photoElement);
  			}
			}, 300);

			break;
        }
        
        // Chercher dans postPhotos
        if (moment.posts) {
          for (const post of moment.posts) {
            const postPhoto = post.photos?.find(p => 
              p.filename === targetContent.id || 
              p.google_drive_id === targetContent.id
            );
            
            if (postPhoto) {
              targetMoment = moment;
              console.log('✅ Photo trouvée dans post du moment:', moment.displayTitle);
              
              // Ouvrir le moment
              setSelectedMoments([moment]);
              
              // Construire galerie complète
              const gallery = [
                ...(moment.dayPhotos || []),
                ...(moment.postPhotos || [])
              ];
              
              // Ouvrir PhotoViewer avec la photo ciblée
              setTimeout(() => {
  				const photoElement = document.querySelector(`[data-photo-filename="${targetContent.id}"]`);
  				if (photoElement) {
    				executeScrollToElement(photoElement);
  					}
				}, 300);
              
              break;
            }
          }
        }
        
        if (targetMoment) break;
      }
      
      // ⭐ AJOUTER ICI
      navigationProcessedRef.current = navKey;
      
      if (!targetMoment) {
        console.warn('⚠️ Photo non trouvée dans les moments');
      }
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [navigationContext?.sessionMomentId, navigationContext?.targetContent, momentsData, selectionMode]);
// Note: openPhotoViewer est stable (useCallback) et peut être omis des dépendances


  // ⭐ v2.9s : Restaurer modal cross-refs au retour
  useEffect(() => {
    if (navigationContext?.returnContext?.type === 'cross_refs_modal') {
      const { scrollPosition, openMomentId: savedMomentId, editionMode: savedEditionMode, crossRefsModal: savedModal } = navigationContext.returnContext;

      // Restaurer état page
      if (savedMomentId) {
        setSelectedMoments(momentsData.filter(m => m.id === savedMomentId));
      }

      // Actualiser cross-refs
      const deleteContext = savedModal.deleteContext;
      if (deleteContext) {
        let updatedCrossRefs = [];

        // Ré-analyser pour obtenir les cross-refs actuels
        if (deleteContext.type === 'moment') {
          const impact = app.analyzeDeleteImpact('moment', { momentId: deleteContext.momentId });
          updatedCrossRefs = formatCrossRefsFromImpact(impact);
        } else if (deleteContext.type === 'post') {
          const impact = app.analyzeDeleteImpact('post', { momentId: deleteContext.momentId, postId: deleteContext.postId });
          updatedCrossRefs = formatCrossRefsFromImpact(impact);
        } else if (deleteContext.type === 'photo') {
          const impact = app.analyzeDeleteImpact('photo', {
            momentId: deleteContext.momentId,
            photoId: deleteContext.photoId,
            filename: deleteContext.photoFilename
          });
          updatedCrossRefs = [{
            photoId: deleteContext.photoId,
            filename: deleteContext.photoFilename,
            crossRefs: impact.crossRefs.moments.flatMap(m => m.refs),
            sessionRefs: impact.crossRefs.sessions.flatMap(s => s.refs)
          }].filter(w => w.crossRefs.length > 0 || w.sessionRefs.length > 0);
        }

        // Rouvrir modal avec cross-refs actualisés
        setCrossRefsModal({
          ...savedModal,
          crossRefsWarnings: updatedCrossRefs,
          isOpen: true
        });
      }

      // Restaurer scroll
      setTimeout(() => {
        window.scrollTo(0, scrollPosition || 0);
      }, 300);

      // Clear navigationContext
      onNavigateBack();
    }
  }, [navigationContext]);

  // Helper pour formater cross-refs depuis impact
  const formatCrossRefsFromImpact = (impact) => {
    const crossRefsWarnings = [];
    if (impact.crossRefs.total > 0) {
      const photoMap = new Map();
      impact.crossRefs.moments.forEach(m => {
        if (!photoMap.has(m.photoId)) {
          photoMap.set(m.photoId, { photoId: m.photoId, filename: m.filename || m.photoId, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(m.photoId).crossRefs.push(...m.refs);
      });
      impact.crossRefs.sessions.forEach(s => {
        if (!photoMap.has(s.photoId)) {
          photoMap.set(s.photoId, { photoId: s.photoId, filename: s.filename || s.photoId, crossRefs: [], sessionRefs: [] });
        }
        photoMap.get(s.photoId).sessionRefs.push(...s.refs);
      });
      crossRefsWarnings.push(...Array.from(photoMap.values()));
    }
    return crossRefsWarnings;
  };

  const jumpToDay = useCallback((day) => {
    const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
    if (targetMoment) {
      handleSelectMoment(targetMoment);
      setCurrentDay(day);
    }
  }, [momentsData, setCurrentDay]);



  if (!app.isInitialized || !momentsData) {
    return <div className="p-12 text-center">Chargement des données...</div>;
  }

  if (momentsData.length === 0) {
    return <div className="p-12 text-center text-red-500">Aucun moment à afficher.</div>;
  }

 const availableThemes = app.masterIndex?.themes || [];

// ✅ Calcul direct sans useMemo
const themeStats = window.themeAssignments && availableThemes.length > 0
  ? availableThemes
      .map(theme => {
        const contents = window.themeAssignments.getAllContentsByTheme(theme.id) || [];
        return {
          id: theme.id,
          name: theme.name,
          icon: theme.icon,
          color: theme.color,
          count: contents.length
        };
      })
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count)
  : [];
  
  return (
	<div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden relative transition-colors duration-200">
      
      
      {/* Barre de recherche */}
      {isSearchOpen && (
        <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 transition-colors duration-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            placeholder="Rechercher un texte, un titre... (Echap pour fermer)"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Effacer la recherche"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* ⭐ v2.9 : Barre Mode Édition */}
      {editionMode?.active && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3 transition-colors duration-200">
          {/* Ligne 1 : Titre + Bouton X */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 text-center flex-1">
              Mode Édition
            </h3>
            <div className="flex-1 flex justify-end">
              <button
                onClick={onCancelEditionMode}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors"
                title="Quitter le mode édition"
              >
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>

          {/* Ligne 2 : Instructions avec icônes */}
          <div className="flex items-center justify-center space-x-4 text-sm text-red-600 dark:text-red-400">
            <span className="flex items-center space-x-1.5">
              <span>Cliquez sur</span>
              <Edit className="w-4 h-4 inline text-green-600 dark:text-green-400" />
              <span>pour modifier ou</span>
              <Trash2 className="w-4 h-4 inline text-red-600 dark:text-red-400" />
              <span>pour supprimer</span>
            </span>
          </div>
        </div>
      )}

      {/* ✅ Filtres par thème (conditionnel) */}
      {isThemeBarVisible && themeStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-200">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setSelectedTheme(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
  				selectedTheme === null
    				? 'bg-amber-500 text-white'
    				: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
				}`}
            >
              Tous
            </button>
            {themeStats.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id === selectedTheme ? null : theme.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex items-center space-x-1 transition-colors ${
  				selectedTheme === theme.id
    				? 'bg-amber-500 text-white'
    				: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
				}`}
              >
                <span>{theme.icon}</span>
                <span>{theme.name}</span>
                <span className="text-xs opacity-75">({theme.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Contenu principal */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scroll-pt-32"
      >
        <div className="container mx-auto px-4 py-4">
          <MomentsList 
            moments={filteredMoments}
            selectedMoments={selectedMoments}
            displayOptions={displayOptions}
            momentFilter={momentFilter}
            sessions={app.sessions}
            onMomentSelect={handleSelectMoment}
            onPhotoClick={openPhotoViewer}
            onCreateSession={handleOpenSessionModal}
			onShowSessions={handleShowSessions}  
            momentRefs={momentRefs}
            activePhotoGrid={activePhotoGrid}
            selectedPhotos={selectedPhotos}
            onActivateSelection={activatePhotoSelection}
            onTogglePhotoSelection={togglePhotoSelection}
            onBulkTagPhotos={handleBulkTagPhotos}
            onCancelSelection={cancelSelection}
            isFromChat={navigationContext?.previousPage === 'chat'}
            onOpenPhotoContextMenu={handleOpenPhotoContextMenu}
            selectionMode={selectionMode}
  			onContentSelected={handleLongPressForSelection}
  			onCreateSessionFromContent={handleCreateSessionFromContent}
			editionMode={editionMode}
			/>
        </div>
      </main>

      {/* Menu contextuel photo */}
      {photoContextMenu.isOpen && photoContextMenu.photo && (
        <PhotoContextMenu
          photo={photoContextMenu.photo}
          position={photoContextMenu.position}
          isFromChat={navigationContext?.previousPage === 'chat'}
          onViewFull={() => {
            handleClosePhotoContextMenu();
            openPhotoViewer(photoContextMenu.photo, null, [photoContextMenu.photo]);
          }}
          onAssignThemes={() => {
            handleClosePhotoContextMenu();
            const photoKey = photoContextMenu.photo.type === 'day_photo' 
              ? generatePhotoMomentKey(photoContextMenu.photo)
              : generatePhotoMastodonKey(photoContextMenu.photo);
            const currentThemes = photoKey ? (window.themeAssignments?.getThemesForContent(photoKey) || []) : [];
            
            if (window.memoriesPageActions?.openThemeModal) {
              window.memoriesPageActions.openThemeModal(
                photoKey,
                'photo',
                currentThemes
              );
            }
          }}
          onAttachToChat={() => handleAttachPhotoToChat(photoContextMenu.photo)}
          onClose={handleClosePhotoContextMenu}
        />
      )}

      {/* ThemeModal */}
      <ThemeModal
        isOpen={themeModal.isOpen}
        onClose={handleCloseThemeModal}
        availableThemes={availableThemes}
        currentThemes={themeModal.currentThemes}
        onSave={themeModal.bulkPhotos ? handleSaveBulkThemes : handleSaveThemes}
        title={themeModal.bulkPhotos ? "Assigner des thèmes aux photos" : "Assigner des thèmes"}
        contentType={themeModal.contentType}
        momentData={themeModal.momentData}
		postData={themeModal.postData}
      />

      {sessionModal && (
        <SessionCreationModal
          source={sessionModal.source}
          contextMoment={sessionModal.contextMoment}
          currentUser={app.currentUser}
          onClose={closeSessionModal}
          onConfirm={(options) => handleCreateAndOpenSession(
            sessionModal.source, 
            sessionModal.contextMoment,
            options
          )}
        />
      )}
      
      {/*  Modal liste sessions */}
      {sessionListModal && (
        <SessionListModal
          isOpen={true}
          onClose={closeSessionListModal}
          sessions={sessionListModal.sessions}
          contentTitle={sessionListModal.contentTitle}
          onSelectSession={handleSelectSession}
        />
      )}

      {viewerState.isOpen && (
  <PhotoViewer
    photo={viewerState.photo}
    gallery={viewerState.gallery}
    contextMoment={viewerState.contextMoment}
    onClose={closePhotoViewer}
    onCreateSession={handleOpenSessionModal}
    onOpenSession={onOpenSessionFromMemories}
    globalSelectionMode={selectionMode}
    onContentSelected={handleLongPressForSelection}
  />
)}

      {/* ⭐ v2.8f : Modal PhotoToMemoryModal */}
      {photoToMemoryModal.isOpen && (
        <PhotoToMemoryModal
          isOpen={photoToMemoryModal.isOpen}
          photoData={photoToMemoryModal.photoData}
          file={photoToMemoryModal.file}
          onClose={() => setPhotoToMemoryModal({ isOpen: false, photoData: null, file: null })}
          moments={app.masterIndex?.moments || []}
          onConvert={handleConvertPhotoToMemory}
        />
      )}

      {/* ⭐ v2.9 : Modals édition */}
      <EditMomentModal
        isOpen={editMomentModal.isOpen}
        moment={editMomentModal.moment}
        onClose={() => setEditMomentModal({ isOpen: false, moment: null })}
        onSave={handleSaveMoment}
      />

      <EditPostModal
        isOpen={editPostModal.isOpen}
        post={editPostModal.post}
        onClose={() => setEditPostModal({ isOpen: false, post: null, momentId: null })}
        onSave={handleSavePost}
      />

      {/* ⭐ v2.9s : MODAL 1 - "Effacer le souvenir" */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({
          isOpen: false,
          itemName: null,
          itemType: null,
          itemIcon: null,
          childrenDetails: null,
          onConfirmMemoryOnly: null,
          onConfirmWithDrive: null
        })}
        itemName={confirmDeleteModal.itemName}
        itemType={confirmDeleteModal.itemType}
        itemIcon={confirmDeleteModal.itemIcon}
        childrenDetails={confirmDeleteModal.childrenDetails}
        onConfirmMemoryOnly={confirmDeleteModal.onConfirmMemoryOnly}
        onConfirmWithDrive={confirmDeleteModal.onConfirmWithDrive}
      />

      {/* ⭐ v2.9s : MODAL 2 - "Photos utilisées ailleurs" */}
      <CrossRefsWarningModal
        isOpen={crossRefsModal.isOpen}
        onClose={() => setCrossRefsModal({
          isOpen: false,
          itemName: null,
          itemType: null,
          crossRefsWarnings: null,
          deleteContext: null,
          onConfirmMemoryOnly: null,
          onConfirmWithDrive: null
        })}
        itemName={crossRefsModal.itemName}
        itemType={crossRefsModal.itemType}
        crossRefsWarnings={crossRefsModal.crossRefsWarnings}
        onConfirmMemoryOnly={crossRefsModal.onConfirmMemoryOnly}
        onConfirmWithDrive={crossRefsModal.onConfirmWithDrive}
        onNavigateToMoment={(momentId) => {
          // ⭐ v2.9s : Mémoriser état complet et naviguer
          const returnContext = {
            type: 'cross_refs_modal',
            scrollPosition: window.scrollY,
            openMomentId,
            editionMode,
            crossRefsModal: { ...crossRefsModal, isOpen: true },
            returnPage: 'memories'
          };
          app.navigateToMoment(momentId, returnContext);
          setCrossRefsModal({ isOpen: false });
        }}
        onNavigateToSession={(sessionId) => {
          // ⭐ v2.9s : Mémoriser état complet et naviguer
          const returnContext = {
            type: 'cross_refs_modal',
            scrollPosition: window.scrollY,
            openMomentId,
            editionMode,
            crossRefsModal: { ...crossRefsModal, isOpen: true },
            returnPage: 'memories'
          };
          app.navigateToSession(sessionId, returnContext);
          setCrossRefsModal({ isOpen: false });
        }}
      />

    </div>
  );
}

// ====================================================================
// COMPOSANTS
// ====================================================================

// ✨ PHASE 19D : Badge compteur sessions
const SessionBadge = memo(({ contentType, contentId, contentTitle, sessions, onShowSessions, onCreateSession, moment }) => {
  const linkedSessions = getSessionsForContent(sessions, contentType, contentId);
  const count = linkedSessions.length;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (count === 0) {
      // Aucune session → Créer directement
      onCreateSession(moment, moment);
    } else {
      // Sessions existantes → Voir liste
      onShowSessions(contentType, contentId, contentTitle);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        count === 0 
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'  // Gris si 0
          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'  // Violet si sessions
      }`}
      title={count === 0 ? 'Créer une session' : `${count} session${count > 1 ? 's' : ''} - Cliquer pour voir`}
    >
      {count === 0 ? (
        <>
          <span><MessageCircle className="w-4 h-4" /></span><span>  </span>
        </>
      ) : (
        <>
          <span><MessageCircle className="w-4 h-4" /></span>
          <span>{count}</span>
        </>
      )}
    </button>
  );
});


// ====================================================================
// HELPERS
// ====================================================================


function getFilteredMoments(momentsData, searchQuery, momentFilter, sessions, selectedTheme) {
  let filtered = momentsData;
  
  // Filtre par recherche textuelle
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(m => 
      m.displayTitle.toLowerCase().includes(query) ||
      m.posts?.some(p => p.content && p.content.toLowerCase().includes(query))
    );
  }
  
  // Filtre par type de moment
  if (momentFilter !== 'all') {
    const exploredIds = new Set(sessions?.map(s => s.gameId) || []);
    
    switch (momentFilter) {
      case 'unexplored':
        filtered = filtered.filter(m => !exploredIds.has(m.id));
        break;
      case 'with_posts':
        filtered = filtered.filter(m => m.posts?.length > 0);
        break;
      case 'with_photos':
        filtered = filtered.filter(m => m.dayPhotoCount > 0);
        break;
    }
  }
  
  // ✅ NOUVEAU : Filtre par thème
  if (selectedTheme) {
    filtered = filtered.filter(moment => {
      // Vérifier posts
      const hasTaggedPost = moment.posts?.some(post => {
        const key = generatePostKey(post);
        const themes = window.themeAssignments?.getThemesForContent(key) || [];
        return themes.includes(selectedTheme);
      });
      
      // Vérifier photos moment
      const hasTaggedDayPhoto = moment.dayPhotos?.some(photo => {
        const key = generatePhotoMomentKey(photo);
        if (!key) return false;
        const themes = window.themeAssignments?.getThemesForContent(key) || [];
        return themes.includes(selectedTheme);
      });
      
      // Vérifier photos Mastodon
      const hasTaggedMastodonPhoto = moment.posts?.some(post => 
        post.photos?.some(photo => {
          const key = generatePhotoMastodonKey(photo);
          if (!key) return false;
          const themes = window.themeAssignments?.getThemesForContent(key) || [];
          return themes.includes(selectedTheme);
        })
      );
      
      return hasTaggedPost || hasTaggedDayPhoto || hasTaggedMastodonPhoto;
    });
  }
  
  return filtered;
}


export default React.forwardRef(MemoriesPage);
