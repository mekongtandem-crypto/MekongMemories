/**
 * MemoriesPage.jsx v6.2 - Phase 14.3
 * ✅ Filtrage intelligent (Tous/Non explorés/Avec articles/Avec photos)
 * ✅ Callbacks exposés pour TopBar
 * ✅ Icônes 💬 pour sessions (amber)
 * ✅ Scroll auto vers moments filtrés
 */

import React, { useState, useEffect, useRef, memo, useCallback, useImperativeHandle } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown
} from 'lucide-react';
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';
import SessionCreationModal from '../SessionCreationModal.jsx';

function MemoriesPage({ 
  isTimelineVisible,
  setIsTimelineVisible,
  isSearchOpen,
  setIsSearchOpen,
  currentDay,
  setCurrentDay,
  displayOptions
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

  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  const momentRefs = useRef({});
  
  const executeScrollToElement = useCallback((element) => {
    // 1. On trouve la barre de navigation
    const topBarElement = document.querySelector('.fixed.top-0.z-40');
    const scrollContainer = scrollContainerRef.current;

    if (element && topBarElement && scrollContainer) {
      // 2. On mesure sa hauteur exacte
      const topBarHeight = topBarElement.offsetHeight;
      
      // 3. On calcule la position de destination...
      //    ET ON SOUSTRAIT LA HAUTEUR DE LA BARRE !
      const offsetPosition = element.offsetTop - topBarHeight - 64; // 16px de marge

      // 4. On scrolle à la position calculée
      scrollContainer.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } // ...
  }, []);
  
  
  // Exposer callbacks pour TopBar
  useEffect(() => {
    window.memoriesPageFilters = {
      setMomentFilter: (filter) => {
        setMomentFilter(filter);
        // Scroll vers premier moment filtré après render
        setTimeout(() => {
          const firstFiltered = document.querySelector('[data-filtered="true"]');
          if (firstFiltered) {
            firstFiltered.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };
    
    return () => {
      delete window.memoriesPageFilters;
    };
  }, []);
  
  // Exposer fonctions via ref
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsTimelineVisible, setIsSearchOpen]);

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
      // On utilise notre nouvelle fonction de scroll
      executeScrollToElement(element);
    }
  }, [executeScrollToElement]); // <-- On ajoute la dépendance
  

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

  // ✅ NOUVELLE SIGNATURE (on ajoute un paramètre "forceOpen")
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
      sessionData.systemMessage = `📝 Session basée sur l'article : "${title}...".`;
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

  const filteredMoments = getFilteredMoments(momentsData, searchQuery, momentFilter, app.sessions);

  if (!app.isInitialized || !momentsData) {
    return <div className="p-12 text-center">Chargement des données...</div>;
  }

  if (momentsData.length === 0) {
    return <div className="p-12 text-center text-red-500">Aucun moment à afficher.</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
      
      {/* Timeline (si visible) */}
      {isTimelineVisible && (
        <div className="border-b border-gray-200 bg-white">
          <TimelineRuleV2 
            selectedMoment={selectedMoments[0] || null}
            onMomentSelect={handleSelectMoment}
          />
        </div>
      )}

      {/* Barre de recherche (si ouverte) */}
      {isSearchOpen && (
        <div className="bg-white border-b border-gray-200 p-3">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setSearchQuery('');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Rechercher un texte, un titre... (Echap pour fermer)"
            autoFocus
          />
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
          />
        </div>
      </main>

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
  onMomentSelect, onPhotoClick, onCreateSession, momentRefs
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
          />
        );
      })}
    </div>
  );
});

const MomentCard = memo(React.forwardRef(({ 
  moment, isSelected, isExplored, matchesFilter, displayOptions, 
  onSelect, onPhotoClick, onCreateSession
}, ref) => { 
  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;
  
  // ✅ NOUVEAU CODE (synchronisé avec la TopBar)
  const [localDisplay, setLocalDisplay] = useState({
  // ✅ Initialise l'état des posts en respectant les options globales
  showPosts: displayOptions.showPostText,
  showDayPhotos: displayOptions.showMomentPhotos
});

// ✅ Synchronise les DEUX états locaux lorsque les options globales changent
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
          className="flex items-center space-x-1.5 font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-700 ml-auto pl-2 px-2 py-1 rounded transition-colors"
        >
          <span className="text-base">💬</span>
          <span>Session</span>
        </button>
      </div>
    </>
  );
});

const MomentContent = memo(({ 
  moment, displayOptions, localDisplay, visibleDayPhotos, photosPerLoad, 
  onPhotoClick, onCreateSession, onLoadMorePhotos, onToggleDayPhotos  
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
      />
    ))}
    
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
            <div className="flex items-center gap-x-3 flex-1">
              <Camera className={`w-4 h-4 transition-colors ${
                localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'
              }`} />
              <h4 className="font-semibold text-gray-800 text-sm">
                Photos de "{moment.displayTitle}"
              </h4>
            </div>
            <div className="flex items-center gap-x-2 text-sm text-gray-600">
              <span>{moment.dayPhotoCount} photo{moment.dayPhotoCount > 1 ? 's' : ''}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${
                localDisplay.showDayPhotos ? 'rotate-180' : ''
              }`} />
            </div>
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

const PostArticle = memo(({ post, moment, displayOptions, onPhotoClick, onCreateSession }) => {
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

  const hasPhotos = post.photos && post.photos.length > 0;
  const photosAreVisible = showThisPostPhotos && hasPhotos;

  return (
   // <div className="mt-2 border-b border-gray-100 pb-2 last:border-b-0">
      <div className="mt-2">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200">
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
          
          <div className="flex items-center gap-x-3 flex-shrink-0 ml-2">
            {hasPhotos && (
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {post.photos.length} photo{post.photos.length > 1 ? 's' : ''}
              </span>
            )}
            
            <button 
              onClick={handleCreateSession} 
              className="p-1.5 rounded hover:bg-amber-50 transition-colors" 
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
        />
      )}
    </div>
  );
});

const PhotoGrid = memo(({ photos, moment, onPhotoClick, allPhotos }) => (
  <div className="mt-2">
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {photos.map((photo, idx) => (
        <PhotoThumbnail 
          key={photo.google_drive_id || photo.url || idx} 
          photo={photo} 
          moment={moment} 
          onClick={(p) => onPhotoClick(p, moment, allPhotos || photos)} 
        />
      ))}
    </div>
  </div>
));

const PhotoThumbnail = memo(({ photo, moment, onClick }) => {
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

  return (
    <div 
      className="aspect-square bg-gray-200 rounded-md group relative cursor-pointer overflow-hidden" 
      onClick={() => status === 'loaded' && onClick(photo, moment)}
    >
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
      {status === 'loaded' && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
});

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

function getFilteredMoments(momentsData, searchQuery, momentFilter, sessions) {
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
  
  return filtered;
}

export default React.forwardRef(MemoriesPage);