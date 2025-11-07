/**
 * useMemoriesState.js v7.0
 * Hook centralisé pour gérer tous les états de MemoriesPage
 * 
 * Gère :
 * - Toggles hiérarchiques (moment, posts, photos)
 * - Overrides locaux (exceptions aux filtres globaux)
 * - États modals (theme, session, viewer, contextMenu)
 * - États sélection (photos, bulk)
 */

import { useState, useCallback } from 'react';

export function useMemoriesState() {
  
  // ========================================
  // ÉTATS TOGGLES HIÉRARCHIQUES
  // ========================================
  
  // Un seul moment ouvert à la fois (comportement actuel)
  const [openMomentId, setOpenMomentId] = useState(null);
  
  // États posts du moment ouvert uniquement
  const [openPosts, setOpenPosts] = useState({});
  // Structure: { 'post-id': { textOpen: false, photosOpen: false } }
  
  // Photos moment
  const [momentPhotosOpen, setMomentPhotosOpen] = useState(false);
  
  // ========================================
  // OVERRIDES LOCAUX (exceptions filtres globaux)
  // ========================================
  
  const [localOverrides, setLocalOverrides] = useState({});
  // Structure: { 'moment-id': { showPosts: true, showPhotos: false } }
  
  // ========================================
  // ÉTATS MODALS
  // ========================================
  
  // Theme Modal
  const [themeModal, setThemeModal] = useState({
    isOpen: false,
    contentKey: null,
    contentType: null,
    currentThemes: [],
    momentData: null,
    postData: null
  });
  
  // Session Creation Modal
  const [sessionModal, setSessionModal] = useState(null);
  
  // Session List Modal
  const [sessionListModal, setSessionListModal] = useState(null);
  
  // Photo Viewer
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, 
    photo: null, 
    gallery: [], 
    contextMoment: null 
  });
  
  // Photo Context Menu (clic droit)
  const [photoContextMenu, setPhotoContextMenu] = useState({
    isOpen: false,
    photo: null,
    position: { x: 0, y: 0 }
  });
  
  // ========================================
  // ÉTATS SÉLECTION
  // ========================================
  
  // Sélection bulk photos (pour tagging groupé)
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activePhotoGrid, setActivePhotoGrid] = useState(null);
  
  // ========================================
  // HANDLERS MOMENT
  // ========================================
  
  const toggleMoment = useCallback((momentId) => {
    setOpenMomentId(prev => {
      const newId = prev === momentId ? null : momentId;
      
      // Reset états posts si on ferme ou change de moment
      if (newId !== momentId) {
        setOpenPosts({});
        setMomentPhotosOpen(false);
      }
      
      return newId;
    });
  }, []);
  
  const closeMoment = useCallback(() => {
    setOpenMomentId(null);
    setOpenPosts({});
    setMomentPhotosOpen(false);
  }, []);
  
  // ========================================
  // HANDLERS POST
  // ========================================
  
  const togglePostText = useCallback((postId) => {
    setOpenPosts(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        textOpen: !prev[postId]?.textOpen
      }
    }));
  }, []);
  
  const togglePostPhotos = useCallback((postId) => {
    setOpenPosts(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        photosOpen: !prev[postId]?.photosOpen
      }
    }));
  }, []);
  
  const isPostTextOpen = useCallback((postId) => {
    return openPosts[postId]?.textOpen || false;
  }, [openPosts]);
  
  const isPostPhotosOpen = useCallback((postId) => {
    return openPosts[postId]?.photosOpen || false;
  }, [openPosts]);
  
  // ========================================
  // HANDLERS PHOTOS MOMENT
  // ========================================
  
  const toggleMomentPhotos = useCallback(() => {
    setMomentPhotosOpen(prev => !prev);
  }, []);
  
  // ========================================
  // HANDLERS OVERRIDES
  // ========================================
  
  const toggleOverride = useCallback((momentId, type) => {
    // type: 'posts' | 'photos'
    setLocalOverrides(prev => ({
      ...prev,
      [momentId]: {
        ...prev[momentId],
        [`show${type.charAt(0).toUpperCase() + type.slice(1)}`]: !prev[momentId]?.[`show${type.charAt(0).toUpperCase() + type.slice(1)}`]
      }
    }));
  }, []);
  
  const hasOverride = useCallback((momentId, type) => {
    const key = `show${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return localOverrides[momentId]?.[key] || false;
  }, [localOverrides]);
  
  const clearOverrides = useCallback((momentId) => {
    setLocalOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[momentId];
      return newOverrides;
    });
  }, []);
  
  // ========================================
  // HANDLERS THEME MODAL
  // ========================================
  
  const openThemeModal = useCallback((contentKey, contentType, currentThemes = [], extraData = null) => {
    setThemeModal({
      isOpen: true,
      contentKey,
      contentType,
      currentThemes,
      momentData: contentType === 'moment' ? extraData : null,
      postData: contentType === 'post' ? extraData : null
    });
  }, []);
  
  const closeThemeModal = useCallback(() => {
    setThemeModal({
      isOpen: false,
      contentKey: null,
      contentType: null,
      currentThemes: [],
      momentData: null,
      postData: null
    });
  }, []);
  
  // ========================================
  // HANDLERS SESSION MODALS
  // ========================================
  
  const openSessionModal = useCallback((data) => {
    setSessionModal(data);
  }, []);
  
  const closeSessionModal = useCallback(() => {
    setSessionModal(null);
  }, []);
  
  const openSessionListModal = useCallback((data) => {
    setSessionListModal(data);
  }, []);
  
  const closeSessionListModal = useCallback(() => {
    setSessionListModal(null);
  }, []);
  
  // ========================================
  // HANDLERS PHOTO VIEWER
  // ========================================
  
  const openPhotoViewer = useCallback((photo, gallery = [], contextMoment = null) => {
    setViewerState({
      isOpen: true,
      photo,
      gallery,
      contextMoment
    });
  }, []);
  
  const closePhotoViewer = useCallback(() => {
    setViewerState({
      isOpen: false,
      photo: null,
      gallery: [],
      contextMoment: null
    });
  }, []);
  
  // ========================================
  // HANDLERS PHOTO CONTEXT MENU
  // ========================================
  
  const openPhotoContextMenu = useCallback((photo, position) => {
    setPhotoContextMenu({
      isOpen: true,
      photo,
      position
    });
  }, []);
  
  const closePhotoContextMenu = useCallback(() => {
    setPhotoContextMenu({
      isOpen: false,
      photo: null,
      position: { x: 0, y: 0 }
    });
  }, []);
  
  // ========================================
  // HANDLERS SÉLECTION PHOTOS
  // ========================================
  
  const togglePhotoSelection = useCallback((photo) => {
    setSelectedPhotos(prev => {
      const photoId = photo.filename || photo.google_drive_id;
      const isSelected = prev.some(p => 
        (p.filename || p.google_drive_id) === photoId
      );
      
      if (isSelected) {
        return prev.filter(p => (p.filename || p.google_drive_id) !== photoId);
      } else {
        return [...prev, photo];
      }
    });
  }, []);
  
  const clearPhotoSelection = useCallback(() => {
    setSelectedPhotos([]);
    setActivePhotoGrid(null);
  }, []);
  
  const isPhotoSelected = useCallback((photo) => {
    const photoId = photo.filename || photo.google_drive_id;
    return selectedPhotos.some(p => 
      (p.filename || p.google_drive_id) === photoId
    );
  }, [selectedPhotos]);
  
  // ========================================
  // RETURN
  // ========================================
  
  return {
    // États
    openMomentId,
    openPosts,
    momentPhotosOpen,
    localOverrides,
    themeModal,
    sessionModal,
    sessionListModal,
    viewerState,
    photoContextMenu,
    selectedPhotos,
    activePhotoGrid,
    
    // Handlers Moment
    toggleMoment,
    closeMoment,
    
    // Handlers Post
    togglePostText,
    togglePostPhotos,
    isPostTextOpen,
    isPostPhotosOpen,
    
    // Handlers Photos Moment
    toggleMomentPhotos,
    
    // Handlers Overrides
    toggleOverride,
    hasOverride,
    clearOverrides,
    
    // Handlers Theme Modal
    openThemeModal,
    closeThemeModal,
    
    // Handlers Session Modals
    openSessionModal,
    closeSessionModal,
    openSessionListModal,
    closeSessionListModal,
    
    // Handlers Photo Viewer
    openPhotoViewer,
    closePhotoViewer,
    
    // Handlers Photo Context Menu
    openPhotoContextMenu,
    closePhotoContextMenu,
    
    // Handlers Sélection
    togglePhotoSelection,
    clearPhotoSelection,
    isPhotoSelected,
    setActivePhotoGrid
  };
}
