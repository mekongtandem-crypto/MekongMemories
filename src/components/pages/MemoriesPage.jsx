/**
 * MemoriesPage.jsx v6.4 - Phase 16 - Corrections bugs
 * ✅ Bug 1&2 : Header posts cohérent (📸 N · 🏷️ M · 💬)
 * ✅ Bug 3 : Header photos moment "N Photos de..." (pas redondant)
 */

import React, { useState, useEffect, useRef, memo, useCallback, useImperativeHandle } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, X, Tag
} from 'lucide-react';
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';
import SessionCreationModal from '../SessionCreationModal.jsx';
import ThemeModal from '../ThemeModal.jsx';
import { generatePostKey, generatePhotoMomentKey, generatePhotoMastodonKey } from '../../utils/themeUtils.js';

function MemoriesPage({ 
  isTimelineVisible,
  setIsTimelineVisible,
  isSearchOpen,
  setIsSearchOpen,
  currentDay,
  setCurrentDay,
  displayOptions,
  isThemeBarVisible // ✅ NOUVEAU
}, ref) {

  const app = useAppState();
  
  const [selectedMoments, setSelectedMoments] = useState([]);
  const [displayMode, setDisplayMode] = useState('focus');
  const [searchQuery, setSearchQuery] = useState('');
  const [momentFilter, setMomentFilter] = useState('all');
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null, gallery: [], contextMoment: null 
  });
  const [sessionModal, setSessionModal] = useState(null);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef(null);

  // États pour le tagging
  const [themeModal, setThemeModal] = useState({
    isOpen: false,
    contentKey: null,
    contentType: null,
    currentThemes: []
  });

  const [selectedPhotos, setSelectedPhotos] = useState([]); // Photos cochées
  const [activePhotoGrid, setActivePhotoGrid] = useState(null); // Quelle grille est en mode sélection
  
  // ✅ NOUVEAU : Filtre par thème
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  const momentRefs = useRef({});
  
  // ========================================
  // CALLBACKS TAGGING
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

  const handleOpenThemeModal = useCallback((contentKey, contentType, currentThemes = []) => {
    setThemeModal({
      isOpen: true,
      contentKey,
      contentType,
      currentThemes
    });
  }, []);

  const handleSaveThemes = useCallback(async (selectedThemes) => {
    if (!themeModal.contentKey || !app.currentUser) return;
    
    await window.themeAssignments.assignThemes(
      themeModal.contentKey,
      selectedThemes,
      app.currentUser.id
    );
    
    setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [] });
    setViewerState(prev => ({ ...prev }));
  }, [themeModal, app.currentUser]);

  const handleCloseThemeModal = useCallback(() => {
    setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [] });
  }, []);

  // ✅ MODIFIÉ : Activation mode sélection pour une grille spécifique
  const activatePhotoSelection = useCallback((gridId) => {
    setActivePhotoGrid(gridId);
    setSelectedPhotos([]);
  }, []);

  // Sélection photo
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

  // Bulk tag
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

  const handleSaveBulkThemes = useCallback(async (selectedThemes) => {
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
    
    setThemeModal({ isOpen: false, contentKey: null, contentType: null, currentThemes: [] });
    setSelectedPhotos([]);
    setActivePhotoGrid(null);
    setViewerState(prev => ({ ...prev }));
  }, [themeModal, app.currentUser]);

  const cancelSelection = useCallback(() => {
    setSelectedPhotos([]);
    setActivePhotoGrid(null);
  }, []);

  const filteredMoments = getFilteredMoments(momentsData, searchQuery, momentFilter, app.sessions, selectedTheme);

  // ========================================
  // EFFECTS
  // ========================================
  
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
    
    const sessionTitle = options.title || (
      source.filename 
        ? `Souvenirs de ${contextMoment.displayTitle}`
        : source.content 
          ? `Souvenirs de l'article : ${source.content.split('\n')[0].substring(0, 40)}...`
          : `Souvenirs du moment : ${source.displayTitle}`
    );
    
    let sessionData = {
      id: source.google_drive_id || source.id || source.url,
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

  const handleOpenSessionModal = useCallback((source, contextMoment) => {
    setSessionModal({ source, contextMoment });
  }, []);

  if (!app.isInitialized || !momentsData) {
    return <div className="p-12 text-center">Chargement des données...</div>;
  }

  if (momentsData.length === 0) {
    return <div className="p-12 text-center text-red-500">Aucun moment à afficher.</div>;
  }

  // ✅ NOUVEAU : Calculer les stats des thèmes
  const availableThemes = app.masterIndex?.themes || [];
  const themeStats = availableThemes.map(theme => {
    const contents = window.themeAssignments?.getAllContentsByTheme(theme.id) || [];
    return {
      ...theme,
      count: contents.length
    };
  }).filter(t => t.count > 0);

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
            momentRefs={momentRefs}
            activePhotoGrid={activePhotoGrid}
            selectedPhotos={selectedPhotos}
            onActivateSelection={activatePhotoSelection}
            onTogglePhotoSelection={togglePhotoSelection}
            onBulkTagPhotos={handleBulkTagPhotos}
            onCancelSelection={cancelSelection}
          />
        </div>
      </main>

      {/* ThemeModal */}
      <ThemeModal
        isOpen={themeModal.isOpen}
        onClose={handleCloseThemeModal}
        availableThemes={availableThemes}
        currentThemes={themeModal.currentThemes}
        onSave={themeModal.bulkPhotos ? handleSaveBulkThemes : handleSaveThemes}
        title={themeModal.bulkPhotos ? "Assigner des thèmes aux photos" : "Assigner des thèmes"}
        contentType={themeModal.contentType}
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

      {viewerState.isOpen && (
        <PhotoViewer 
          photo={viewerState.photo}
          gallery={viewerState.gallery}
          contextMoment={viewerState.contextMoment}
          onClose={closePhotoViewer}
          onCreateSession={handleOpenSessionModal}
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
  onBulkTagPhotos, onCancelSelection
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
          />
        );
      })}
    </div>
  );
});

const MomentCard = memo(React.forwardRef(({ 
  moment, isSelected, isExplored, matchesFilter, displayOptions, 
  onSelect, onPhotoClick, onCreateSession,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection
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
        />
      )}
    </div>
  );
}));

const MomentHeader = memo(({ 
  moment, isSelected, isExplored, onSelect, onOpenWith, onCreateSession, 
  localDisplay, onToggleLocal 
}) => {
  
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

  // Vérifier si session existe pour ce moment
  const sessions = window.app?.sessions || [];
  const hasSession = sessions.some(s => s.gameId === moment.id);

  return (
    <>
      <div onClick={handleChevronClick} className="cursor-pointer flex items-start justify-between">
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
            title={localDisplay.showPosts ? "Masquer les posts" : "Afficher les posts"}
          >
            <FileText className={`w-4 h-4 mr-1.5 transition-colors ${
              localDisplay.showPosts ? 'text-blue-600' : 'text-gray-400'
            }`} /> 
            {moment.postCount} post{moment.postCount > 1 ? 's' : ''}
          </button>
        )}
        
        {moment.dayPhotoCount > 0 && (
          <button
            onClick={(e) => handleLinkClick(e, 'photos')}
            className="flex items-center font-medium text-green-600 hover:text-green-700 transition-all"
            title={localDisplay.showDayPhotos ? "Masquer les photos du moment" : "Afficher les photos du moment"}
          >
            <Camera className={`w-4 h-4 mr-1.5 transition-colors ${
              localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'
            }`} /> 
            {moment.dayPhotoCount} photo{moment.dayPhotoCount > 1 ? 's' : ''}
          </button>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onCreateSession(moment, moment);
          }}
          className={`ml-auto p-1.5 rounded transition-colors ${
            hasSession 
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
              : 'hover:bg-amber-50 text-gray-600'
          }`}
          title={hasSession ? "Session existante" : "Créer une session"}
        >
          <span className="text-base">💬</span>
        </button>
      </div>
    </>
  );
});

const MomentContent = memo(({ 
  moment, displayOptions, localDisplay, visibleDayPhotos, photosPerLoad, 
  onPhotoClick, onCreateSession, onLoadMorePhotos, onToggleDayPhotos,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection
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
      />
    ))}
    
    {/* ✅ CORRECTION BUG 3 : Header simplifié */}
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
            {/* ✅ Format: 📸 20 Photos de "Titre" */}
            <div className="flex items-center gap-x-3 flex-1">
              <Camera className={`w-4 h-4 ${
                localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'
              }`} />
              <h4 className="font-semibold text-gray-800 text-sm">
                {moment.dayPhotoCount} Photo{moment.dayPhotoCount > 1 ? 's' : ''} de "{moment.displayTitle}"
              </h4>
            </div>
            
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

const PostArticle = memo(({ 
  post, moment, displayOptions, onPhotoClick, onCreateSession,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection
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
    
    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(postKey, 'post', currentThemes);
    }
  };

  const postKey = generatePostKey(post);
  const postThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
  const hasThemes = postThemes.length > 0;

  const hasPhotos = post.photos && post.photos.length > 0;
  const photosAreVisible = showThisPostPhotos && hasPhotos;

  return (
    <div className="mt-2">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200">
          {/* Gauche : Titre + indicateur photos inline */}
          <div className="flex items-center gap-x-3 flex-1 min-w-0">
            {hasPhotos && (
              <button 
                onClick={() => setShowThisPostPhotos(!showThisPostPhotos)} 
                className="p-1 flex-shrink-0"
                title="Afficher/Masquer les photos"
              >
                <ImageIcon className={`w-4 h-4 transition-colors ${
                  showThisPostPhotos ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </button>
            )}
            
            <h4 className="font-semibold text-gray-800 text-sm truncate flex-1">
              {title}
            </h4>
          </div>
          
          {/* ✅ CORRECTION : Droite = Indicateurs compacts + Boutons */}
          <div className="flex items-center gap-x-2 flex-shrink-0 ml-2">
            {/* 📸 Indicateur photos (si hasPhotos) */}
            {hasPhotos && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <Camera className="w-3 h-3" />
                <span className="font-medium">{post.photos.length}</span>
              </div>
            )}
            
            {/* 🏷️ Bouton Tag avec compteur intégré */}
            <button 
              onClick={handleTagPost} 
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                hasThemes 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title="Assigner des thèmes"
            >
              <Tag className="w-4 h-4" />
              {hasThemes && <span className="text-xs font-bold">{postThemes.length}</span>}
            </button>
            
            {/* 💬 Bouton session */}
            <button 
              onClick={handleCreateSession} 
              className="px-2 py-1 rounded hover:bg-amber-50 transition-colors" 
              title="Créer une session"
            >
              <span className="text-base">💬</span>
            </button>
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
          allPhotos={post.photos}
          gridId={`post_${post.id}`}
          activePhotoGrid={activePhotoGrid}
          selectedPhotos={selectedPhotos}
          onActivateSelection={onActivateSelection}
          onTogglePhotoSelection={onTogglePhotoSelection}
          onBulkTagPhotos={onBulkTagPhotos}
          onCancelSelection={onCancelSelection}
        />
      )}
    </div>
  );
});

const PhotoGrid = memo(({ 
  photos, moment, onPhotoClick, allPhotos, gridId,
  activePhotoGrid, selectedPhotos, onActivateSelection, onTogglePhotoSelection,
  onBulkTagPhotos, onCancelSelection
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
            />
          );
        })}
      </div>
    </div>
  );
});

const PhotoThumbnail = memo(({ 
  photo, moment, onClick, gridId, selectionMode, isSelected, 
  onToggleSelect, onActivateSelection 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState('loading');
  const longPressTimerRef = useRef(null);

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

  // ✅ Longpress pour activer le mode sélection
  const handleTouchStart = (e) => {
    if (selectionMode) return; // Déjà en mode sélection
    
    longPressTimerRef.current = setTimeout(() => {
      onActivateSelection(gridId);
      onToggleSelect(photo);
    }, 500); // 500ms = longpress
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleClick = (e) => {
    if (selectionMode) {
      e.stopPropagation();
      onToggleSelect(photo);
    } else if (status === 'loaded') {
      onClick(photo, moment);
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* ✅ Checkbox visible uniquement en mode sélection */}
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

      {/* Badge thèmes */}
      {!selectionMode && hasThemes && (
        <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10">
          {photoThemes.length}
        </div>
      )}

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