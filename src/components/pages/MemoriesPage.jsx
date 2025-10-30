/**
 * MemoriesPage.jsx v6.5 - PARTIE 1/2 - Tagging hiérarchique
 * ✅ Badges UNIQUEMENT niveau actuel
 * ✅ Propagation optionnelle avec checkboxes
 * ✅ Moment → Posts + Photos
 * ✅ Post → Photos
 * 
 * STRUCTURE FICHIER :
 * - PARTIE 1 : Imports, États, Handlers tagging (CE FICHIER)
 * - PARTIE 2 : Composants d'affichage (fichier suivant)
 */

// ========================================
// 1. IMPORTS (ajouter en haut)
// ========================================

import React, { useState, useEffect, useRef, forwardRef, memo, useCallback, useImperativeHandle } from 'react';
import SessionListModal from '../SessionListModal.jsx';
import { getSessionsForContent } from '../../utils/sessionUtils.js';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, X, Tag, Link, 
  MessageCircle, MessageCirclePlus, MessageCircleMore,
} from 'lucide-react';
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';
import SessionCreationModal from '../SessionCreationModal.jsx';
import ThemeModal from '../ThemeModal.jsx';
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
// COMPOSANTS BADGE SESSIONS (Phase 19D)
// ========================================

// Badge sessions pour Post (inline dans footer card)
const SessionBadgePost = memo(({ post, momentId, sessions, onShowSessions, onCreateSession }) => {
  const linkedSessions = getSessionsForContent(sessions, 'post', post.id);
  const count = linkedSessions.length;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (count === 0) {
      onCreateSession(post, momentId, 'post');
    } else {
      onShowSessions('post', post.id, post.title || 'Article');
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
        count === 0
          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
      title={count === 0 ? 'Créer une session' : `${count} session${count > 1 ? 's' : ''}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {count > 0 && <span>{count}</span>}
    </div>
  );
});

// Pastille sessions pour Photo thumbnail (overlay circle)
const SessionBadgePhotoThumb = memo(({ photo, momentId, sessions, onShowSessions }) => {
  const linkedSessions = getSessionsForContent(
    sessions, 
    'photo', 
    photo.filename || photo.google_drive_id
  );
  const count = linkedSessions.length;
  
  if (count === 0) return null;
  
  const handleClick = (e) => {
    e.stopPropagation();
    const photoTitle = photo.filename || photo.google_drive_id || 'Photo';
    onShowSessions('photo', photo.filename || photo.google_drive_id, photoTitle);
  };
  
  return (
    <div
      onClick={handleClick}
      className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-purple-700 transition-colors z-10 cursor-pointer"
      title={`${count} session${count > 1 ? 's' : ''}`}
    >
      {count}
    </div>
  );
});

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
  onOpenSessionFromMemories
}, ref) {

  
// ========================================
// 2. STATE, les états 
// ========================================


  const app = useAppState();
    
  
  const [selectedMoments, setSelectedMoments] = useState([]);
  const [displayMode, setDisplayMode] = useState('focus');
  const [searchQuery, setSearchQuery] = useState('');
  const [momentFilter, setMomentFilter] = useState('all');
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null, gallery: [], contextMoment: null 
  });
  const [sessionModal, setSessionModal] = useState(null);
  const [sessionListModal, setSessionListModal] = useState(null);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef(null);

  // États pour le tagging
  const [themeModal, setThemeModal] = useState({
    isOpen: false,
    contentKey: null,
    contentType: null,
    currentThemes: [],
    momentData: null,
    postData: null
  });

  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activePhotoGrid, setActivePhotoGrid] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  
  
  // ✅ NOUVEAU Phase 17b : Menu contextuel photo
  const [photoContextMenu, setPhotoContextMenu] = useState({
    isOpen: false,
    photo: null,
    position: { x: 0, y: 0 }
  });
  

  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  
  const momentRefs = useRef({});
  const navigationProcessedRef = useRef(null);
  
  // ========================================
  // CALLBACKS-HANDLE TAGGING HIÉRARCHIQUE
  // ========================================

  const executeScrollToElement = useCallback((element) => {
    const topBarElement = document.querySelector('.fixed.top-0.z-40');
    const scrollContainer = scrollContainerRef.current;

    if (element && topBarElement && scrollContainer) {
      const topBarHeight = topBarElement.offsetHeight;
      const offsetPosition = element.offsetTop - topBarHeight - 64;
      scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  // ✅ MODIFIÉ : accepte momentData et postData
  const handleOpenThemeModal = useCallback((contentKey, contentType, currentThemes = [], extraData = null) => {
    setThemeModal({
      isOpen: true,
      contentKey,
      contentType,
      currentThemes,
      momentData: contentType === 'moment' ? extraData : null,
      postData: contentType === 'post' ? extraData : null
    });
  }, []);

  // ✅ NOUVEAU : Handler POST avec propagation
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
    
    setThemeModal({ 
      isOpen: false, 
      contentKey: null, 
      contentType: null, 
      currentThemes: [], 
      postData: null 
    });
    setViewerState(prev => ({ ...prev }));
  }, [app.currentUser]);

  // ✅ MODIFIÉ : Handler MOMENT avec propagation + clé moment
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
    
    // 3. Confirmation si propagation
    const needsConfirmation = keysToTag.length > 1;
    if (needsConfirmation) {
      // ✅ NOUVEAU : Version compacte
const parts = ['1 moment'];
if (propagationOptions.applyToPosts) 
  parts.push(`${childrenKeys.posts.length} post${childrenKeys.posts.length > 1 ? 's' : ''}`);
if (propagationOptions.applyToPostPhotos) 
  parts.push(`${childrenKeys.postPhotos.length} photo${childrenKeys.postPhotos.length > 1 ? 's' : ''} (articles)`);
if (propagationOptions.applyToMomentPhotos) 
  parts.push(`${childrenKeys.momentPhotos.length} photo${childrenKeys.momentPhotos.length > 1 ? 's' : ''} (moment)`);

const confirmMessage = 
  `Appliquer ${selectedThemes.length} thème${selectedThemes.length > 1 ? 's' : ''} à :\n` +
  `• ${parts.join(' + ')} (${keysToTag.length} total)\n\n` +
  `Continuer ?`;
      
      if (!confirm(confirmMessage)) {
        setThemeModal({ 
          isOpen: false, 
          contentKey: null, 
          contentType: null, 
          currentThemes: [], 
          momentData: null 
        });
        return;
      }
    }
    
    // 4. Batch assignation
    const result = await window.themeAssignments.assignThemesBatch(
      keysToTag,
      selectedThemes,
      app.currentUser.id
    );
    
    if (result.success) {
      alert(`✅ ${result.count} élément${result.count > 1 ? 's' : ''} taggué${result.count > 1 ? 's' : ''} !`);
    }
    
    setThemeModal({ 
      isOpen: false, 
      contentKey: null, 
      contentType: null, 
      currentThemes: [], 
      momentData: null 
    });
    setViewerState(prev => ({ ...prev }));
  }, [app.currentUser]);

  // Handler bulk photos (inchangé)
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
    
    setThemeModal({ 
      isOpen: false, 
      contentKey: null, 
      contentType: null, 
      currentThemes: [] 
    });
    setSelectedPhotos([]);
    setActivePhotoGrid(null);
    setViewerState(prev => ({ ...prev }));
  }, [themeModal.bulkPhotos, app.currentUser]);

  // ✅ MODIFIÉ : Handler principal avec routing
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
      setThemeModal({ 
        isOpen: false, 
        contentKey: null, 
        contentType: null, 
        currentThemes: [] 
      });
      setViewerState(prev => ({ ...prev }));
    }
  }, [
    themeModal, 
    app.currentUser, 
    handleSaveMomentThemes, 
    handleSavePostThemes, 
    handleSaveBulkThemes
  ]);

  const handleCloseThemeModal = useCallback(() => {
    setThemeModal({ 
      isOpen: false, 
      contentKey: null, 
      contentType: null, 
      currentThemes: [], 
      momentData: null, 
      postData: null 
    });
  }, []);

  // Autres handlers (inchangés)
  const activatePhotoSelection = useCallback((gridId) => {
    setActivePhotoGrid(gridId);
    setSelectedPhotos([]);
  }, []);

  const togglePhotoSelection = useCallback((photo) => {
    setSelectedPhotos(prev => {
      const key = photo.google_drive_id;
      if (prev.some(p => p.google_drive_id === key)) {
        return prev.filter(p => p.google_drive_id !== key);
      } else {
        return [...prev, photo];
      }
    });
  }, []);

  const handleBulkTagPhotos = useCallback(() => {
    if (selectedPhotos.length === 0) return;
    
    setThemeModal({
      isOpen: true,
      contentKey: null,
      contentType: 'photos',
      currentThemes: [],
      bulkPhotos: selectedPhotos
    });
  }, [selectedPhotos]);

  const cancelSelection = useCallback(() => {
    setSelectedPhotos([]);
    setActivePhotoGrid(null);
  }, []);
  
  // ⭐ NOUVEAU Phase 18b : Handler appui long pour sélection
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
    // ⭐ AJOUTER toutes les métadonnées
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

  // ✅ NOUVEAU Phase 17b : Handlers menu contextuel photo
  const handleOpenPhotoContextMenu = useCallback((photo, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setPhotoContextMenu({
      isOpen: true,
      photo: photo,
      position: {
        x: event.clientX || event.touches?.[0]?.clientX || 0,
        y: event.clientY || event.touches?.[0]?.clientY || 0
      }
    });
  }, []);

  const handleClosePhotoContextMenu = useCallback(() => {
    setPhotoContextMenu({
      isOpen: false,
      photo: null,
      position: { x: 0, y: 0 }
    });
  }, []);

  const handleAttachPhotoToChat = useCallback((photo) => {
    if (!photo || !onAttachToChat) return;
    
    // Fermer menu
    handleClosePhotoContextMenu();
    
    // Attacher photo et retourner au chat
    onAttachToChat({
      type: 'photo',
      data: photo
    });
  }, [onAttachToChat, handleClosePhotoContextMenu]);

  const filteredMoments = getFilteredMoments(momentsData, searchQuery, momentFilter, app.sessions, selectedTheme);

const handleShowSessions = useCallback((contentType, contentId, contentTitle) => {
  const sessions = getSessionsForContent(app.sessions, contentType, contentId);
  setSessionListModal({ sessions, contentTitle });
}, [app.sessions]);

// Handler création session depuis post
const handleCreateSessionFromPost = async (post, momentId) => {
  try {
    const moment = masterIndex.moments.find(m => m.id === momentId);
    if (!moment) {
      console.error('Moment parent introuvable');
      return;
    }
    
    await onCreateSession(post, moment, 'post');
  } catch (error) {
    console.error('Erreur création session post:', error);
  }
};

// Handler création session depuis photo thumbnail
const handleCreateSessionFromPhotoThumb = async (photo, momentId) => {
  try {
    const moment = masterIndex.moments.find(m => m.id === momentId);
    if (!moment) {
      console.error('Moment parent introuvable');
      return;
    }
    
    await onCreateSession(photo, moment, 'photo');
  } catch (error) {
    console.error('Erreur création session photo:', error);
  }
};

const handleSelectSession = useCallback((session) => {
  console.log('🎯 Sélection session depuis modal:', session.id);
  setSessionListModal(null);
  
  // ⭐ Utiliser handler avec contexte de navigation
  if (onOpenSessionFromMemories) {
    onOpenSessionFromMemories(session);
  } else {
    // Fallback si handler non fourni
    console.warn('⚠️ onOpenSessionFromMemories non fourni, fallback basique');
    app.openChatSession(session);
  }
}, [app, onOpenSessionFromMemories]);

const SessionBadge = memo(({ contentType, contentId, contentTitle, sessions, onShowSessions, onCreateSession, moment }) => {
  const linkedSessions = getSessionsForContent(sessions, contentType, contentId);
  const count = linkedSessions.length;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (count === 0) {
      onCreateSession(moment, moment);
    } else {
      onShowSessions(contentType, contentId, contentTitle);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        count === 0 
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
      }`}
      title={count === 0 ? 'Créer une session' : `${count} session${count > 1 ? 's' : ''} - Cliquer pour voir`}
    >
      {count === 0 ? (
        <MessageCirclePlus className="w-4 h-4" />
      ) : (
        <>
          <span>💬</span>
          <span>{count}</span>
        </>
      )}
    </button>
  );
});

const handleOpenSessionModal = useCallback((source, contextMoment) => {
    setSessionModal({ source, contextMoment });
  }, []);

  // ========================================
  // PHOTO VIEWER HANDLERS
  // ========================================
  
  const openPhotoViewer = useCallback((clickedPhoto, contextMoment, photoList) => {
    setViewerState({ 
      isOpen: true, 
      photo: clickedPhoto, 
      gallery: Array.isArray(photoList) ? photoList : [], 
      contextMoment 
    });
  }, []);

  const closePhotoViewer = useCallback(() => {
    setViewerState({ isOpen: false, photo: null, gallery: [], contextMoment: null });
  }, []);

  // ========================================
  // EFFECTS
  // ========================================
  
  // ✅ NOUVEAU Phase 17b : Fermer menu contextuel au clic outside
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
      activatePhotoSelection: activatePhotoSelection
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
  }, [handleOpenThemeModal, togglePhotoSelection, activatePhotoSelection, activePhotoGrid, selectedPhotos]);
  
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
      }
    },
    jumpToDay: (day) => {
      const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
      if (targetMoment) {
        handleSelectMoment(targetMoment);
        setCurrentDay(day);
      }
    }
  }), [momentsData, setCurrentDay]);

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
    let targetMoment;
    
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
        setTimeout(() => {
          const postElement = document.querySelector(`[data-post-id="${targetContent.id}"]`);
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
        setTimeout(() => {
          const element = momentRefs.current[targetMoment.id];
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

  // Puis continuer avec les callbacks...
  const scrollToMoment = useCallback((momentId) => {
    const element = momentRefs.current[momentId];
    if (element) {
      executeScrollToElement(element);
    }
  }, [executeScrollToElement]);

  const jumpToDay = useCallback((day) => {
    const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
    if (targetMoment) {
      handleSelectMoment(targetMoment);
      setCurrentDay(day);
    }
  }, [momentsData, setCurrentDay]);

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
  
  // ========================================
  // DÉTERMINATION TYPE & ID SOURCE
  // ========================================
  
  let sourceId;
  let sourceType;
  
  if (source.filename || source.google_drive_id) {
    // Photo : utiliser google_drive_id comme identifiant unique
    sourceId = source.google_drive_id || source.filename;  // ✅ CORRECTION: ID réel de la photo
    sourceType = 'photo';
    
  } else if (source.content) {
    // Post : utiliser l'ID du post
    sourceId = source.id || source.created_at;
    sourceType = 'post';
    
  } else {
    // Moment : utiliser l'ID masterIndex
    sourceId = contextMoment.id;
    sourceType = 'moment';
  }
  
  let sessionData = {
    id: sourceId,                          // ✅ ID du contenu source
    momentId: contextMoment.id,            // ID du moment (toujours présent)
    title: sessionTitle,
    description: source.filename 
      ? `Basée sur la photo "${source.filename}"`
      : source.content
        ? `Basée sur un article`
        : `Basée sur le moment "${source.displayTitle}"`,
  };
  
  console.log('🎯 Création session - sourceType:', sourceType, 'sourceId:', sourceId, 'momentId:', contextMoment.id);
    
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
  
  // Handler création session depuis post/photo
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
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
      
      {/* Timeline */}
      {isTimelineVisible && (
        <div className="border-b border-gray-200 bg-white">
          <TimelineRuleV2 
            selectedMoment={selectedMoments[0] || null}
            onMomentSelect={handleSelectMoment}
          />
        </div>
      )}

      {/* Barre de recherche */}
      {isSearchOpen && (
        <div className="relative bg-white border-b border-gray-200 p-3">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
            placeholder="Rechercher un texte, un titre... (Echap pour fermer)"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400 hover:text-gray-600"
              title="Effacer la recherche"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      
      {/* ✅ Filtres par thème (conditionnel) */}
      {isThemeBarVisible && themeStats.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <button
              onClick={() => setSelectedTheme(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedTheme === null
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
			/>
        </div>
      </main>

      {/* ✅ NOUVEAU Phase 17b : Menu contextuel photo */}
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
          onClose={() => setSessionModal(null)}
          onConfirm={(options) => handleCreateAndOpenSession(
            sessionModal.source, 
            sessionModal.contextMoment,
            options
          )}
        />
      )}
      
      {/* ✨ PHASE 19D : Modal liste sessions */}
      {sessionListModal && (
        <SessionListModal
          isOpen={true}
          onClose={() => setSessionListModal(null)}
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
    globalSelectionMode={selectionMode}
    onContentSelected={handleLongPressForSelection}
  />
)}
    </div>
  );
}

// ====================================================================
// COMPOSANTS
// ====================================================================



const MomentsList = memo(({ 
  moments, selectedMoments, displayOptions, momentFilter, sessions, 
  onMomentSelect, onPhotoClick, onCreateSession, momentRefs,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection,
  isFromChat, onOpenPhotoContextMenu,
  selectionMode, onContentSelected,
  onShowSessions, onCreateSessionFromContent
}) => {
  return (
    <div className="space-y-3">
      {moments.map((moment) => {
        const isExplored = sessions?.some(s => s.gameId === moment.id);
        const matchesFilter = momentFilter === 'all' || 
          (momentFilter === 'unexplored' && !isExplored) ||
          (momentFilter === 'with_posts' && moment.posts?.length > 0) ||
          (momentFilter === 'with_photos' && moment.dayPhotoCount > 0);
        
        return (
          <MomentCard
            key={moment.id} 
            moment={moment} 
            isSelected={selectedMoments.some(m => m.id === moment.id)}
            isExplored={isExplored}
            matchesFilter={matchesFilter}
            displayOptions={displayOptions}
            onSelect={onMomentSelect}
            onPhotoClick={onPhotoClick}
            onCreateSession={onCreateSession}
            ref={el => momentRefs.current[moment.id] = el}
            activePhotoGrid={activePhotoGrid}
            selectedPhotos={selectedPhotos}
            onActivateSelection={onActivateSelection}
            onTogglePhotoSelection={onTogglePhotoSelection}
            onBulkTagPhotos={onBulkTagPhotos}
            onCancelSelection={onCancelSelection}
            isFromChat={isFromChat}
            onOpenPhotoContextMenu={onOpenPhotoContextMenu}
            sessions={sessions}             
			onShowSessions={onShowSessions}
			selectionMode={selectionMode}
  			onContentSelected={onContentSelected}
  			onCreateSessionFromContent={onCreateSessionFromContent}
			/>
        );
      })}
    </div>
  );
});

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


const MomentCard = memo(React.forwardRef(({ 
  moment, isSelected, isExplored, matchesFilter, displayOptions, 
  onSelect, onPhotoClick, onCreateSession,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection,
  isFromChat, onOpenPhotoContextMenu,
  selectionMode, onContentSelected,
  sessions, onShowSessions, onCreateSessionFromContent
}, ref) => {
  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;
  
  const [localDisplay, setLocalDisplay] = useState({
    showPosts: displayOptions.showPostText,
    showDayPhotos: displayOptions.showMomentPhotos
  });

  useEffect(() => {
    setLocalDisplay(prev => ({
      ...prev,
      showPosts: displayOptions.showPostText,
      showDayPhotos: displayOptions.showMomentPhotos
    }));
  }, [displayOptions.showPostText, displayOptions.showMomentPhotos]);
  
  const wasSelectedRef = useRef(isSelected);
  
  useEffect(() => {
    if (wasSelectedRef.current && !isSelected) {
      setLocalDisplay({
        showPosts: false,
        showDayPhotos: false
      });
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected]);
  
  const handleOpenWith = (options) => {
    if (!isSelected) {
      onSelect(moment);
    }
    setLocalDisplay(options);
  };
  
  const handleToggleLocal = (key) => {
    setLocalDisplay(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div 
      ref={ref} 
      id={moment.id}
      data-filtered={matchesFilter ? 'true' : 'false'}
      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${
        isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="px-3 pt-3 pb-0">
        <MomentHeader 
          moment={moment}
          isSelected={isSelected}
          isExplored={isExplored}
          onSelect={onSelect}
          onOpenWith={handleOpenWith}
          onCreateSession={onCreateSession}
          localDisplay={localDisplay}
          onToggleLocal={handleToggleLocal}
          selectionMode={selectionMode}
          onContentSelected={onContentSelected}
          sessions={sessions}
          onShowSessions={onShowSessions}
		/>
      </div>
      

      {isSelected && (
        <MomentContent 
          moment={moment}
          displayOptions={displayOptions}
          localDisplay={localDisplay}
          visibleDayPhotos={visibleDayPhotos}
          photosPerLoad={photosPerLoad}
          onPhotoClick={onPhotoClick}
          onCreateSession={onCreateSession}
          onLoadMorePhotos={() => setVisibleDayPhotos(prev => prev + photosPerLoad)}
          onToggleDayPhotos={() => handleToggleLocal('showDayPhotos')}
          activePhotoGrid={activePhotoGrid}
          selectedPhotos={selectedPhotos}
          onActivateSelection={onActivateSelection}
          onTogglePhotoSelection={onTogglePhotoSelection}
          onBulkTagPhotos={onBulkTagPhotos}
          onCancelSelection={onCancelSelection}
          isFromChat={isFromChat}
          onOpenPhotoContextMenu={onOpenPhotoContextMenu}
          selectionMode={selectionMode}
          onContentSelected={onContentSelected}
          sessions={sessions}
onShowSessions={onShowSessions}
          onCreateSessionFromContent={onCreateSessionFromContent}        	
		/>
      )}
    </div>
  );
}));




// ====================================================================
// COMPOSANT : MomentHeader (MODIFIÉ)
// ====================================================================

const MomentHeader = memo(({ 
  moment, isSelected, isExplored, onSelect, onOpenWith, onCreateSession, 
  localDisplay, onToggleLocal,
  selectionMode, onContentSelected,
  sessions, onShowSessions
}) => {
  
  // Badge moment : UNIQUEMENT le moment lui-même
  const momentKey = generateMomentKey(moment);
  const momentThemes = window.themeAssignments?.getThemesForContent(momentKey) || [];
  const hasMomentThemes = momentThemes.length > 0;
  
  // Handler pour tagger le moment
  const handleTagMoment = (e) => {
    e.stopPropagation();
    
    const childrenKeys = getMomentChildrenKeys(moment);
    
    // Stats pour le modal
    const stats = {
      postCount: childrenKeys.posts.length,
      photoMastodonCount: childrenKeys.postPhotos.length,
      photoMomentCount: childrenKeys.momentPhotos.length,
      totalCount: childrenKeys.all.length
    };
    
    // Ouvrir modal avec données moment
    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(
        momentKey,
        'moment',
        momentThemes,
        {
          moment: moment,
          momentId: moment.id,
          momentTitle: moment.displayTitle,
          contentKeys: childrenKeys.all,
          stats: stats
        }
      );
    }
  };
  
  const handleLinkClick = (e, contentType) => {
    e.stopPropagation();
    if (!isSelected) {
      if (contentType === 'posts') {
        onOpenWith({ showPosts: true, showDayPhotos: false });
      } else if (contentType === 'photos') {
        onOpenWith({ showPosts: false, showDayPhotos: true });
      }
    } else {
      onToggleLocal(contentType === 'posts' ? 'showPosts' : 'showDayPhotos');
    }
  };
  
  const handleChevronClick = () => {
    if (!isSelected) {
      onOpenWith({ showPosts: true, showDayPhotos: true });
    } else {
      onSelect(moment);
    }
  };


  return (
    <>
      {/* ⭐ MODIFIÉ : Ajout onContextMenu pour sélection */}
      <div 
		onClick={handleChevronClick}
        className="cursor-pointer flex items-start justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 rounded-lg font-bold text-xs bg-gray-100 text-gray-800">
              {moment.displaySubtitle}
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
              {moment.displayTitle}
            </h3>
            
            
          </div>
          {moment.location && (
            <span className="flex items-center text-xs text-gray-500 mt-1.5 ml-1">
              <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
              {moment.location}
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
          isSelected ? 'rotate-180' : ''
        }`} />
      </div>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mt-2 pt-0 border-t border-gray-100">
        {moment.postCount > 0 && (
          <button
            onClick={(e) => handleLinkClick(e, 'posts')}
            className="flex items-center font-medium text-blue-600 hover:text-blue-700 transition-all"
          >
            <FileText className={`w-4 h-4 mr-1.5 ${localDisplay.showPosts ? 'text-blue-600' : 'text-gray-400'}`} /> 
            {moment.postCount} post{moment.postCount > 1 ? 's' : ''}
          </button>
        )}
        
        {moment.dayPhotoCount > 0 && (
          <button
            onClick={(e) => handleLinkClick(e, 'photos')}
            className="flex items-center font-medium text-green-600 hover:text-green-700 transition-all"
          >
            <Camera className={`w-4 h-4 mr-1.5 ${localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'}`} /> 
            {moment.dayPhotoCount} photo{moment.dayPhotoCount > 1 ? 's' : ''}
          </button>
        )}
        
        {/* Boutons d'action à droite */}
<div className="ml-auto flex items-center space-x-2 flex-shrink-0">
  
  {/* Bouton thèmes avec badge intégré */}
  <button
    onClick={handleTagMoment}
    className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
      hasMomentThemes 
        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-200' 
        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
    }`}
    title="Thèmes"
  >
    <Tag className="w-4 h-4" />
    {hasMomentThemes && <span className="text-xs font-bold">{momentThemes.length}</span>}
  </button>
  
  {/* ✨ PHASE 19D : Badge sessions */}
  <SessionBadge 
    contentType="moment"
    contentId={moment.id}
    contentTitle={moment.displayTitle}
    sessions={sessions}
    onShowSessions={onShowSessions}
    onCreateSession={onCreateSession}
    moment={moment}
  />
  
  {/* ⭐ NOUVEAU : Bouton lier (si mode sélection) */}
  {selectionMode?.active && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onContentSelected?.(moment, 'moment');
      }}
      className="p-1.5 bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-400 rounded transition-colors"
      title="Lier ce moment"
    >
      <Link className="w-4 h-4" />
    </button>
  )}
</div>
</div> 
    </>
  );
});

const MomentContent = memo(({ 
  moment, displayOptions, localDisplay, visibleDayPhotos, photosPerLoad, 
  onPhotoClick, onCreateSession, onLoadMorePhotos, onToggleDayPhotos,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection,
  isFromChat, onOpenPhotoContextMenu,
  selectionMode, onContentSelected,
  sessions, onShowSessions, onCreateSessionFromContent
}) => (
  <div className="px-3 pb-3">
    {localDisplay.showPosts && moment.posts?.map(post => (
      <PostArticle 
  key={post.id}
  post={post}
  moment={moment}
  displayOptions={displayOptions}
  onPhotoClick={onPhotoClick}
  onCreateSession={onCreateSession}
  activePhotoGrid={activePhotoGrid}
  selectedPhotos={selectedPhotos}
  onActivateSelection={onActivateSelection}
  onTogglePhotoSelection={onTogglePhotoSelection}
  onBulkTagPhotos={onBulkTagPhotos}
  onCancelSelection={onCancelSelection}
  isFromChat={isFromChat}
  onOpenPhotoContextMenu={onOpenPhotoContextMenu}
  selectionMode={selectionMode}
  onContentSelected={onContentSelected}
  sessions={sessions}
  onShowSessions={onShowSessions}
onCreateSessionFromContent={onCreateSessionFromContent}
/>
    ))}
    
    {/* Header simplifié */}
    {moment.dayPhotoCount > 0 && (
  <div className="mt-2 border-b border-gray-100 pb-2">
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDayPhotos();
        }}
        className="w-full flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200 hover:bg-gray-100 transition-colors"
      >
        {/* Gauche : Titre */}
        <div className="flex items-center gap-x-3 flex-1">
          <Camera className={`w-4 h-4 ${
            localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'
          }`} />
          <h4 className="font-semibold text-gray-800 text-sm">
            {moment.dayPhotoCount} Photo{moment.dayPhotoCount > 1 ? 's' : ''} de "{moment.displayTitle}"
          </h4>
        </div>
        
        
        {/* ⭐ NOUVEAU : Boutons à droite */}
        <div className="flex items-center space-x-2 mr-2">
          
          {/* ⭐ Bouton toggle tagging multiple */}
<button
  onClick={(e) => {
    e.stopPropagation();
    const gridId = `moment_${moment.id}_day`;
    
    // Toggle : si déjà actif, annuler
    if (activePhotoGrid === gridId) {
      onCancelSelection();
    } else {
      onActivateSelection(gridId);
    }
  }}
  className={`p-1.5 rounded transition-colors ${
    activePhotoGrid === `moment_${moment.id}_day`
      ? 'bg-yellow-100 text-yellow-600'  // Actif
      : 'text-yellow-600 hover:bg-yellow-50'  // Inactif
  }`}
  title={
    activePhotoGrid === `moment_${moment.id}_day`
      ? "Annuler sélection"
      : "Sélectionner photos pour tagging"
  }
>
  <Tag className="w-4 h-4" />
</button>
          
          {/* Bouton lier (si mode sélection) */}
          {selectionMode?.active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Lier la première photo du moment comme représentant
                const firstPhoto = moment.dayPhotos[0];
                if (firstPhoto) {
                  onContentSelected?.(firstPhoto, 'photo');
                }
              }}
              className="p-1.5 bg-gray-100 text-purple-600 border border-gray-300 hover:bg-purple-50 rounded transition-colors"
              title="Lier une photo de ce moment"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* ChevronDown */}
        <ChevronDown className={`w-4 h-4 transition-transform ${
          localDisplay.showDayPhotos ? 'rotate-180' : ''
        }`} />
      </button>
    </div>
  </div>
)}
    
    {localDisplay.showDayPhotos && moment.dayPhotoCount > 0 && (
      <div className="mt-2">
        <PhotoGrid 
          photos={moment.dayPhotos.slice(0, visibleDayPhotos)}
          moment={moment}
          onPhotoClick={onPhotoClick}
          allPhotos={moment.dayPhotos}
          gridId={`moment_${moment.id}_day`}
          activePhotoGrid={activePhotoGrid}
          selectedPhotos={selectedPhotos}
          onActivateSelection={onActivateSelection}
          onTogglePhotoSelection={onTogglePhotoSelection}
          onBulkTagPhotos={onBulkTagPhotos}
          onCancelSelection={onCancelSelection}
          isFromChat={isFromChat}
          onOpenPhotoContextMenu={onOpenPhotoContextMenu}
        selectionMode={selectionMode}
  onContentSelected={onContentSelected}
  sessions={sessions}
onShowSessions={onShowSessions}
/>
        
        {visibleDayPhotos < moment.dayPhotoCount && (
          <div className="text-center mt-3">
            <button 
              onClick={onLoadMorePhotos}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              Afficher {Math.min(photosPerLoad, moment.dayPhotoCount - visibleDayPhotos)} de plus
            </button>
          </div>
        )}
      </div>
    )}
  </div>
));


// ====================================================================
// COMPOSANT : PostArticle (COMPLET - Phase 18b)
// ====================================================================

const PostArticle = memo(({ 
  post, moment, displayOptions, onPhotoClick, onCreateSession,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection,
  isFromChat, onOpenPhotoContextMenu,
  selectionMode, onContentSelected,
  sessions, onShowSessions, onCreateSessionFromContent
}) => {
  const [showThisPostPhotos, setShowThisPostPhotos] = useState(displayOptions.showPostPhotos);

  useEffect(() => {
    setShowThisPostPhotos(displayOptions.showPostPhotos);
  }, [displayOptions.showPostPhotos]);

  const contentParts = post.content ? post.content.trim().split('\n') : [];
  const title = contentParts.shift() || `Article du jour ${post.dayNumber}`;
  const body = contentParts.filter(part => part.trim() !== '').join('<br />');

  const handleCreateSession = (e) => {
    e.stopPropagation();
    onCreateSession(post, moment);
  };

  const handleTagPost = (e) => {
    e.stopPropagation();
    const postKey = generatePostKey(post);
    const currentThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
    
    // Préparer les données du post
    const postData = {
      post: post,
      postTitle: post.content?.split('\n')[0] || `Article du jour ${post.dayNumber}`,
      photoCount: post.photos?.length || 0
    };
    
    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(
        postKey, 
        'post', 
        currentThemes,
        postData
      );
    }
  };

  const postKey = generatePostKey(post);
  const postThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
  const hasThemes = postThemes.length > 0;

  const hasPhotos = post.photos && post.photos.length > 0;
  const photosAreVisible = showThisPostPhotos && hasPhotos;

  return (
    <div className="mt-2">
      <div 
        className="border border-gray-200 rounded-lg overflow-hidden"
      >
        <div className="flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200">
          
          {/* Gauche : Titre + indicateur photos inline */}
          <div className="flex items-center gap-x-3 flex-1 min-w-0">

            <h4 className="font-semibold text-gray-800 text-sm truncate flex-1">
              {title}
            </h4>
            {hasPhotos && (
              <button 
                onClick={() => setShowThisPostPhotos(!showThisPostPhotos)} 
                className="p-1 flex-shrink-0"
                title="Afficher/Masquer les photos"
              >
                <div className="flex items-center space-x-1 text-xs text-grey-400 bg-blue-50 px-2 py-1 rounded">
                <ImageIcon className={`w-4 h-4 transition-colors ${
                  showThisPostPhotos ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium transition-colors ${
                  showThisPostPhotos ? 'text-blue-600' : 'text-gray-400'
                }`}>{post.photos.length}</span>
                </div>
              </button>
            )}
                      
          </div>
          
          {/* Droite = Indicateurs compacts + Boutons */}
<div className="flex items-center gap-x-2 flex-shrink-0 ml-2">

  
  {/* 🏷️ Bouton Tag */}
  <button 
    onClick={handleTagPost} 
    className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
      hasThemes 
        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-200' 
        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
    }`}
    title="Thèmes"
  >
    <Tag className="w-4 h-4" />
    {hasThemes && <span className="text-xs font-bold">{postThemes.length}</span>}
  </button>
  
  {/* 💬 Badge Sessions */}
  <SessionBadgePost 
    post={post} 
    momentId={moment.id} 
    sessions={sessions}
    onShowSessions={onShowSessions}
    onCreateSession={onCreateSessionFromContent}
    />
  
  {/* ⭐ NOUVEAU : Bouton lier (si mode sélection) */}
  {selectionMode?.active && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onContentSelected?.(post, 'post');
      }}
      className="p-1.5 bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-400 rounded transition-colors"
      title="Lier cet article"
    >
      <Link className="w-4 h-4" />
    </button>
  )}
  
</div>
        </div>
        
        {displayOptions.showPostText && (
          <div className="prose prose-sm max-w-none bg-white p-3" 
               dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>

      {photosAreVisible && (
        <PhotoGrid 
          photos={post.photos}
          moment={moment}
          onPhotoClick={onPhotoClick}
          allPhotos={moment.dayPhotos}
          gridId={`moment_${moment.id}_day`}
          activePhotoGrid={activePhotoGrid}
          selectedPhotos={selectedPhotos}
          onActivateSelection={onActivateSelection}
          onTogglePhotoSelection={onTogglePhotoSelection}
          onBulkTagPhotos={onBulkTagPhotos}
          onCancelSelection={onCancelSelection}
          isFromChat={isFromChat}
          onOpenPhotoContextMenu={onOpenPhotoContextMenu}
          selectionMode={selectionMode}
          onContentSelected={onContentSelected}
          sessions={sessions}
onShowSessions={onShowSessions}
        />
      )}
    </div>
  );
});

const PhotoGrid = memo(({ 
  photos, moment, onPhotoClick, allPhotos, gridId,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection,
  isFromChat, onOpenPhotoContextMenu,
  selectionMode, onContentSelected,
  sessions, onShowSessions
}) => {
  const isThisGridActive = activePhotoGrid === gridId;
  const hasSelection = isThisGridActive && selectedPhotos.length > 0;

  return (
    <div className="mt-2">
      {/* ✅ Bouton contextuel (apparaît quand des photos sont sélectionnées) */}
      {hasSelection && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">
            {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} sélectionnée{selectedPhotos.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkTagPhotos}
              className="flex items-center space-x-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Tag className="w-3 h-3" />
              <span>Assigner thèmes</span>
            </button>
            <button
              onClick={onCancelSelection}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {photos.map((photo, idx) => {
          const isSelected = isThisGridActive && selectedPhotos.some(p => 
            p.google_drive_id === photo.google_drive_id
          );
          
          return (
            <PhotoThumbnail 
              key={photo.google_drive_id || photo.url || idx} 
              photo={photo} 
              moment={moment} 
              onClick={(p) => onPhotoClick(p, moment, allPhotos || photos)}
              gridId={gridId}
              selectionMode={isThisGridActive}
              isSelected={isSelected}
              onToggleSelect={onTogglePhotoSelection}
              onActivateSelection={onActivateSelection}
              isFromChat={isFromChat}
              onOpenContextMenu={onOpenPhotoContextMenu}
              globalSelectionMode={selectionMode}
              onContentSelected={onContentSelected}
              sessions={sessions}
              onShowSessions={onShowSessions}
            />
          );
        })}
      </div>
    </div>
  );
});

const PhotoThumbnail = memo(({ 
  photo, moment, onClick, gridId, selectionMode, isSelected, 
  onToggleSelect, onActivateSelection,
  isFromChat, onOpenContextMenu,
  globalSelectionMode, onContentSelected,
  sessions, onShowSessions
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;
    const resolveAndSetUrl = async () => {
      if (!photo) { 
        if (isMounted) setStatus('error'); 
        return; 
      }
      try {
        const thumbnailUrl = await window.photoDataV2.resolveImageUrl(photo, true);
        if (isMounted) {
          if (thumbnailUrl && !thumbnailUrl.startsWith('data:image/svg+xml')) {
            setImageUrl(thumbnailUrl);
          } else { 
            setStatus('error'); 
          }
        }
      } catch (e) { 
        if (isMounted) setStatus('error'); 
      }
    };
    resolveAndSetUrl();
    return () => { isMounted = false; };
  }, [photo]);

  // ⭐ SIMPLIFIÉ : Juste le clic
  const handleClick = (e) => {
    if (selectionMode) {
      // Mode sélection bulk (tagging) → toggle
      e.stopPropagation();
      onToggleSelect(photo);
    } else {
      // Mode normal → ouvrir visionneuse
      onClick(photo, moment);
    }
  };

  // ⭐ Menu contextuel sur clic droit (si depuis chat)
  const handleContextMenu = (e) => {
    if (isFromChat && onOpenContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onOpenContextMenu(photo, e);
    }
  };

  const photoKey = photo.type === 'day_photo' 
    ? generatePhotoMomentKey(photo)
    : generatePhotoMastodonKey(photo);
  const photoThemes = photoKey ? (window.themeAssignments?.getThemesForContent(photoKey) || []) : [];
  const hasThemes = photoThemes.length > 0;

  return (
    <div 
      className="aspect-square bg-gray-200 rounded-md group relative cursor-pointer overflow-hidden" 
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Checkbox visible uniquement en mode sélection bulk */}
      {selectionMode && (
        <div 
          className="absolute top-1 left-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(photo);
          }}
        >
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-amber-500 border-amber-600' 
              : 'bg-white/80 border-gray-400'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
      
      {/* ⭐ NOUVEAU : Pastille Link (si mode sélection global) */}
{globalSelectionMode?.active && !selectionMode && (
<button
  className="absolute top-1 right-1 z-10 w-6 h-6 bg-purple-300 hover:bg-purple-400 border-1 border-white rounded-full flex items-center justify-center shadow-lg transition-all"
  onClick={(e) => {
    e.stopPropagation();
    onContentSelected?.(photo, 'photo');
  }}
  title="Lier cette photo"
>
  <Link className="w-4 h-4 text-purple-800" />
</button>

)}

	{/* 💬 Pastille Sessions */}
      <SessionBadgePhotoThumb 
        photo={photo} 
        momentId={moment.id} 
        sessions={sessions}
onShowSessions={onShowSessions}
      />

      {status === 'loading' && (
        <div className="w-full h-full animate-pulse flex items-center justify-center">
          <Camera className="w-6 h-6 text-gray-400" />
        </div>
      )}
      {status === 'error' && (
        <div className="w-full h-full bg-red-100 flex items-center justify-center" title="Erreur de chargement">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
      )}
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={photo?.filename || 'photo de voyage'} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`} 
          onLoad={() => setStatus('loaded')} 
          onError={() => setStatus('error')} 
        />
      )}
      
      {/* Overlay hover (sauf en mode sélection) */}
      {!selectionMode && status === 'loaded' && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
});

// ====================================================================
// COMPOSANT : PhotoContextMenu (Phase 17b)
// ====================================================================

const PhotoContextMenu = memo(({ 
  photo, 
  position, 
  onViewFull, 
  onAttachToChat, 
  onAssignThemes, 
  onClose,
  isFromChat 
}) => {
  return (
    <div 
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-44">
        <button
          onClick={onViewFull}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
          <span>Voir en grand</span>
        </button>
        
        <button
          onClick={onAssignThemes}
          className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 flex items-center space-x-2 text-yellow-600"
        >
          <Tag className="w-4 h-4" />
          <span>Thèmes</span>
        </button>
        
        {isFromChat && (
          <button
            onClick={onAttachToChat}
            className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex items-center space-x-2 text-amber-600 border-t border-gray-200"
          >
            <span className="text-base">📎</span>
            <span className="font-medium">Envoyer au chat</span>
          </button>
        )}
      </div>
    </div>
  );
});


// ====================================================================
// HELPERS
// ====================================================================

function enrichMomentsWithData(rawMoments) {
  if (!rawMoments) return [];
  return rawMoments.map((moment, index) => {
    const enrichedPosts = moment.posts?.map(post => ({
      ...post,
      photos: post.photos?.map(photo => normalizePhoto(photo)) || []
    })) || [];
    
    return {
      ...moment,
      id: moment.id || `moment_${moment.dayStart}_${moment.dayEnd}_${index}`,
      posts: enrichedPosts,
      postCount: enrichedPosts.length,
      dayPhotoCount: moment.dayPhotos?.length || 0,
      postPhotoCount: moment.postPhotos?.length || 0,
      photoCount: (moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0),
      displayTitle: moment.title || `Moment du jour ${moment.dayStart}`,
      displaySubtitle: moment.dayEnd > moment.dayStart ? `J${moment.dayStart}-J${moment.dayEnd}` : `J${moment.dayStart}`,
      isEmpty: enrichedPosts.length === 0 && ((moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0)) === 0,
    };
  }).filter(moment => !moment.isEmpty);
}

function normalizePhoto(photo) {
  if (photo.filename && photo.google_drive_id) {
    return photo;
  }
  
  if (photo.url) {
    return {
      filename: photo.name || extractFilenameFromUrl(photo.url),
      url: photo.url,
      width: photo.width,
      height: photo.height,
      mime_type: photo.mediaType || 'image/jpeg',
      isMastodonPhoto: true
    };
  }
  
  return photo;
}

function extractFilenameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'photo.jpg';
}

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