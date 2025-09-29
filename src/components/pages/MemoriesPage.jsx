/**
 * MemoriesPage.jsx v5.2 - TIMELINE MASQUABLE + JOUR FONCTIONNEL
 * ✅ NOUVEAU: Timeline peut être cachée/affichée
 * ✅ AMÉLIORATION: Sélecteur de jour avec navigation fléchées
 * ✅ UX: Scroll automatique vers le jour sélectionné
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, ChevronUp, Search, Dices, PlusCircle, Type, Map, Minimize2
} from 'lucide-react';
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';

// ====================================================================
// COMPOSANT PRINCIPAL
// ====================================================================
export default function MemoriesPage() {
  const app = useAppState();
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayOptions, setDisplayOptions] = useState({
    showPostText: true,
    showPostPhotos: true,
    showMomentPhotos: true
  });
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null, gallery: [], contextMoment: null 
  });

  // ✅ NOUVEAU: États pour timeline et jour
  const [isTimelineVisible, setIsTimelineVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef(null);

  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  const momentRefs = useRef({});

  // ✅ Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorer si on est dans un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 't':
        case 'T':
          setIsTimelineVisible(prev => !prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateDay(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDay(1);
          break;
        case 'PageUp':
          e.preventDefault();
          navigateDay(-5);
          break;
        case 'PageDown':
          e.preventDefault();
          navigateDay(5);
          break;
        case '/':
          e.preventDefault();
          setIsSearchOpen(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDay, momentsData]);

  // Gestion du scroll avec auto-hide
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

  // Scroll automatique vers le moment sélectionné
  useEffect(() => {
    if (selectedMoment) {
      scrollToMoment(selectedMoment.id, 'start');
    }
  }, [selectedMoment]);

  const scrollToMoment = useCallback((momentId, blockPosition = 'start') => {
    const element = momentRefs.current[momentId];
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: blockPosition });
        }, 50);
    }
  }, []);

  // ✅ NOUVEAU: Navigation par jour
  const navigateDay = useCallback((delta) => {
    const newDay = Math.max(0, Math.min(currentDay + delta, 200)); // Max J200
    setCurrentDay(newDay);
    jumpToDay(newDay);
  }, [currentDay, momentsData]);

  const jumpToDay = useCallback((day) => {
    const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
    if (targetMoment) {
      setSelectedMoment(targetMoment);
      setCurrentDay(day);
    }
  }, [momentsData]);

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

  const handleSelectMoment = useCallback((moment) => {
    setSelectedMoment(prev => (prev && prev.id === moment.id) ? null : moment);
    // ✅ Mettre à jour le jour courant
    if (moment) {
      setCurrentDay(moment.dayStart);
    }
  }, []);

  const handleCreateAndOpenSession = useCallback(async (source, contextMoment) => {
    if (!source) return;
    let sessionData = {};
    let initialMessage = '';
    
    if (source.filename) {
        sessionData = { 
          id: source.google_drive_id || source.url, 
          title: `Souvenirs de ${contextMoment.displayTitle}`, 
          description: `Basée sur la photo "${source.filename}"` 
        };
        initialMessage = `🖼️ Session initiée à partir de la photo : "${source.filename}".`;
    } else if (source.content) {
      const title = (source.content.trim().split('\n')[0] || `Article J${source.dayNumber}`).substring(0, 40);
      sessionData = { 
        id: source.id, 
        title: `Souvenirs de l'article : ${title}...`, 
        description: `Basée sur un article du moment "${contextMoment.displayTitle}"` 
      };
      initialMessage = `📝 Session initiée à partir de l'article : "${title}...".`;
    } else {
      sessionData = { 
        id: source.id, 
        title: `Souvenirs du moment : ${source.displayTitle}`, 
        description: `Basée sur le moment du ${source.displaySubtitle}` 
      };
      initialMessage = `💬 Session initiée à partir du moment : "${source.displayTitle}".`;
    }
    
    try {
      const newSession = await app.createSession(sessionData);
      if (newSession) {
        const initialNote = { 
          id: `${Date.now()}-system`, 
          content: initialMessage, 
          author: 'duo', 
          createdAt: new Date().toISOString() 
        };
        const sessionWithMessage = { ...newSession, notes: [initialNote] };
        await app.updateSession(sessionWithMessage);
        if (viewerState.isOpen) closePhotoViewer();
        await app.openChatSession(sessionWithMessage);
      }
    } catch (error) {
      console.error('Erreur création de session:', error);
      alert(`Impossible de créer la session : ${error.message}`);
    }
  }, [app, viewerState.isOpen, closePhotoViewer]);

  const filteredMoments = getFilteredMoments(momentsData, searchQuery);

  if (!app.isInitialized || !momentsData) {
    return <div className="p-12 text-center">Chargement des données...</div>;
  }

  if (momentsData.length === 0) {
    return <div className="p-12 text-center text-red-500">Aucun moment à afficher.</div>;
  }

  // ✅ Calculer la hauteur dynamique du header
  const headerHeight = isTimelineVisible ? 200 : 60;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
      
      {/* ✅ Headers avec timeline masquable */}
      <div 
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ height: `${headerHeight}px` }}
      >
        {/* ✅ Timeline conditionnelle */}
        {isTimelineVisible && (
          <div className="transition-all duration-300">
            <TimelineRuleV2 
              selectedMoment={selectedMoment}
              onMomentSelect={handleSelectMoment}
            />
          </div>
        )}
        
        <CompactFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          displayOptions={displayOptions}
          setDisplayOptions={setDisplayOptions}
          selectedMoment={selectedMoment}
          setSelectedMoment={setSelectedMoment}
          momentsData={momentsData}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          jumpToDay={jumpToDay}
          navigateDay={navigateDay}
          isTimelineVisible={isTimelineVisible}
          setIsTimelineVisible={setIsTimelineVisible}
        />
      </div>

      {/* Contenu avec padding dynamique */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ paddingTop: isHeaderVisible ? `${headerHeight}px` : '0' }}
      >
        <div className="container mx-auto px-4 py-4">
          <MomentsList 
            moments={filteredMoments}
            selectedMoment={selectedMoment}
            displayOptions={displayOptions}
            onMomentSelect={handleSelectMoment}
            onPhotoClick={openPhotoViewer}
            onCreateSession={handleCreateAndOpenSession}
            momentRefs={momentRefs}
          />
        </div>
      </main>

      {/* Bouton retour en haut */}
      {!isHeaderVisible && (
        <button
          onClick={() => {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            setIsHeaderVisible(true);
          }}
          className="fixed top-4 right-4 z-40 bg-amber-500 text-white p-3 rounded-full shadow-lg hover:bg-amber-600 transition-all"
          title="Retour en haut"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* ✅ NOUVEAU: Indicateur de raccourcis (apparaît 2s au chargement) */}
      <KeyboardHints />

      {viewerState.isOpen && (
        <PhotoViewer 
          photo={viewerState.photo}
          gallery={viewerState.gallery}
          contextMoment={viewerState.contextMoment}
          onClose={closePhotoViewer}
          onCreateSession={handleCreateAndOpenSession}
        />
      )}
    </div>
  );
}

// ====================================================================
// COMPOSANT : BARRE DE FILTRES AVEC TIMELINE TOGGLE
// ====================================================================
const CompactFilters = memo(({ 
  searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen,
  displayOptions, setDisplayOptions, selectedMoment, setSelectedMoment, momentsData,
  currentDay, setCurrentDay, jumpToDay, navigateDay,
  isTimelineVisible, setIsTimelineVisible
}) => {
  const searchInputRef = useRef(null);
  const dayInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleDayChange = (e) => {
    const day = parseInt(e.target.value, 10);
    if (!isNaN(day)) {
      setCurrentDay(day);
    }
  };

  const handleDaySubmit = (e) => {
    e.preventDefault();
    jumpToDay(currentDay);
  };

  // ✅ NOUVEAU: Gestion molette sur l'input jour
  const handleDayWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    navigateDay(delta);
  };

  const jumpToRandomMoment = () => {
    if (momentsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * momentsData.length);
      const randomMoment = momentsData[randomIndex];
      setSelectedMoment(randomMoment);
      setCurrentDay(randomMoment.dayStart);
    }
  };

  const handleDisplayOptionToggle = (option) => {
    setDisplayOptions(prev => ({...prev, [option]: !prev[option]}));
  };

  const handleCollapseAll = () => {
    setSelectedMoment(null);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-2">
        
        {/* Barre principale */}
        <div className="flex items-center gap-3">
          
          {/* ✅ NOUVEAU: Bouton toggle timeline */}
          <button
            onClick={() => setIsTimelineVisible(!isTimelineVisible)}
            className={`p-1.5 rounded-lg border transition-all ${
              isTimelineVisible 
                ? 'bg-blue-100 text-blue-700 border-blue-300' 
                : 'bg-white hover:bg-gray-100 border-gray-300'
            }`}
            title={isTimelineVisible ? 'Masquer la timeline (T)' : 'Afficher la timeline (T)'}
          >
            {isTimelineVisible ? <Map className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
          </button>
          
          {/* ✅ AMÉLIORATION: Input jour avec contrôles */}
          <form onSubmit={handleDaySubmit} className="flex items-center gap-1">
            <div className="relative group">
              <input 
                ref={dayInputRef}
                type="number" 
                value={currentDay} 
                onChange={handleDayChange}
                onWheel={handleDayWheel}
                className="w-16 pl-2 pr-6 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="J..."
                min="0"
                max="200"
              />
              {/* Flèches de navigation */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); navigateDay(-1); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Jour précédent (↑)"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); navigateDay(1); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Jour suivant (↓)"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
          
          {/* Dés (moment aléatoire) */}
          <button 
            onClick={jumpToRandomMoment} 
            className="p-1.5 rounded-lg border bg-white hover:bg-gray-100" 
            title="Moment au hasard"
          >
            <Dices className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Loupe (recherche) */}
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            className={`p-1.5 rounded-lg border ${isSearchOpen ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-gray-100'}`}
            title="Rechercher (/)"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-300" />
          
          {/* Options d'affichage */}
          <DisplayOptionsButtons 
            displayOptions={displayOptions}
            onToggle={handleDisplayOptionToggle}
          />
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Replier tous */}
          <button 
            onClick={handleCollapseAll} 
            className="p-1.5 rounded-lg border bg-white hover:bg-gray-100" 
            title="Replier tous les moments"
          >
            <ChevronDown className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Champ de recherche extensible */}
        {isSearchOpen && (
          <div className="mt-2 animate-slideDown">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Rechercher un texte, un titre... (Echap pour fermer)"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-4 h-4 rotate-45" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ====================================================================
// COMPOSANT : INDICATEUR DE RACCOURCIS CLAVIER
// ====================================================================
const KeyboardHints = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-lg p-3 shadow-xl animate-fadeIn">
      <div className="font-semibold mb-1">⌨️ Raccourcis</div>
      <div className="space-y-0.5 text-gray-300">
        <div><kbd className="bg-gray-700 px-1 rounded">T</kbd> Timeline</div>
        <div><kbd className="bg-gray-700 px-1 rounded">↑↓</kbd> Jour ±1</div>
        <div><kbd className="bg-gray-700 px-1 rounded">/</kbd> Recherche</div>
      </div>
    </div>
  );
};

// ====================================================================
// COMPOSANTS RESTANTS (identiques)
// ====================================================================

const DisplayOptionsButtons = memo(({ displayOptions, onToggle }) => (
  <div className="flex items-center gap-2">
    <button 
      onClick={() => onToggle('showPostText')} 
      className={`p-1.5 rounded-lg border ${displayOptions.showPostText ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} 
      title="Afficher/Masquer le texte"
    >
      <Type className="w-4 h-4" />
    </button>
    <button 
      onClick={() => onToggle('showPostPhotos')} 
      className={`p-1.5 rounded-lg border ${displayOptions.showPostPhotos ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} 
      title="Afficher/Masquer les photos des articles"
    >
      <ImageIcon className="w-4 h-4" />
    </button>
    <button 
      onClick={() => onToggle('showMomentPhotos')} 
      className={`p-1.5 rounded-lg border ${displayOptions.showMomentPhotos ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} 
      title="Afficher/Masquer les photos du moment"
    >
      <Camera className="w-4 h-4" />
    </button>
  </div>
));

const MomentsList = memo(({ 
  moments, selectedMoment, displayOptions, onMomentSelect, onPhotoClick, onCreateSession, momentRefs 
}) => {
  return (
    <div className="space-y-3">
      {moments.map((moment) => (
        <MomentCard
          key={moment.id} 
          moment={moment} 
          isSelected={selectedMoment && selectedMoment.id === moment.id}
          displayOptions={displayOptions}
          onSelect={onMomentSelect}
          onPhotoClick={onPhotoClick}
          onCreateSession={onCreateSession}
          ref={el => momentRefs.current[moment.id] = el}
        />
      ))}
    </div>
  );
});

const MomentCard = memo(React.forwardRef(({ 
  moment, isSelected, displayOptions, onSelect, onPhotoClick, onCreateSession 
}, ref) => {  
  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;

  return (
    <div 
      ref={ref} 
      id={moment.id} 
      className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${
        isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-3">
        <MomentHeader 
          moment={moment}
          isSelected={isSelected}
          onSelect={onSelect}
          onCreateSession={onCreateSession}
        />
      </div>

      {isSelected && (
        <MomentContent 
          moment={moment}
          displayOptions={displayOptions}
          visibleDayPhotos={visibleDayPhotos}
          photosPerLoad={photosPerLoad}
          onPhotoClick={onPhotoClick}
          onCreateSession={onCreateSession}
          onLoadMorePhotos={() => setVisibleDayPhotos(prev => prev + photosPerLoad)}
        />
      )}
    </div>
  );
}));

const MomentHeader = memo(({ moment, isSelected, onSelect, onCreateSession }) => (
  <>
    <div onClick={() => onSelect(moment)} className="cursor-pointer flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="px-2 py-1 rounded-lg font-bold text-xs bg-gray-100 text-gray-800">
            {moment.displaySubtitle}
          </div>
          <h3 className="text-base font-semibold text-gray-900 truncate">
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

    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mt-2 pt-2 border-t border-gray-100">
      {moment.postCount > 0 && (
        <div className="flex items-center font-medium text-blue-600">
          <FileText className="w-4 h-4 mr-1.5" /> 
          {moment.postCount} article(s)
        </div>
      )}
      {moment.photoCount > 0 && (
        <div className="flex items-center font-medium text-green-600">
          <Camera className="w-4 h-4 mr-1.5" /> 
          {moment.photoCount} photo(s)
        </div>
      )}
      <button 
        onClick={() => onCreateSession(moment)} 
        className="flex items-center font-medium text-amber-600 hover:underline ml-auto pl-2"
      >
        <PlusCircle className="w-4 h-4 mr-1.5" /> Session
      </button>
    </div>
  </>
));

const MomentContent = memo(({ 
  moment, displayOptions, visibleDayPhotos, photosPerLoad, 
  onPhotoClick, onCreateSession, onLoadMorePhotos 
}) => (
  <div className="px-3 pb-3">
    {moment.posts?.map(post => (
      <PostArticle 
        key={post.id}
        post={post}
        moment={moment}
        displayOptions={displayOptions}
        onPhotoClick={onPhotoClick}
        onCreateSession={onCreateSession}
      />
    ))}
    
    {displayOptions.showMomentPhotos && moment.dayPhotoCount > 0 && (
      <DayPhotosSection 
        moment={moment}
        visibleDayPhotos={visibleDayPhotos}
        photosPerLoad={photosPerLoad}
        onPhotoClick={onPhotoClick}
        onLoadMorePhotos={onLoadMorePhotos}
      />
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
    <div className="mt-2 border-b border-gray-100 pb-2 last:border-b-0">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200">
          <div className="flex items-center gap-x-3 flex-1">
            {hasPhotos && (
              <button 
                onClick={() => setShowThisPostPhotos(!showThisPostPhotos)} 
                className={`p-1 ${showThisPostPhotos ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 flex-shrink-0`} 
                title="Afficher/Masquer les photos"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
            <h4 className="font-semibold text-gray-800 text-sm truncate">{title}</h4>
          </div>
          <button 
            onClick={handleCreateSession} 
            className="p-1 text-gray-500 hover:text-amber-600 ml-2" 
            title="Créer une session"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
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
          gridCols="grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
        />
      )}
    </div>
  );
});

const DayPhotosSection = memo(({ 
  moment, visibleDayPhotos, photosPerLoad, onPhotoClick, onLoadMorePhotos 
}) => (
  <div className="mt-2">
    <h4 className="font-semibold text-gray-800 mb-2 text-sm">
      Photos de "{moment.displayTitle}"
    </h4>
    
    <PhotoGrid 
      photos={moment.dayPhotos.slice(0, visibleDayPhotos)}
      moment={moment}
      onPhotoClick={onPhotoClick}
      allPhotos={moment.dayPhotos}
      gridCols="grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
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
));

const PhotoGrid = memo(({ photos, moment, onPhotoClick, allPhotos, gridCols }) => (
  <div className="mt-2">
    <div className={`grid ${gridCols} gap-2`}>
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

// CSS pour animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-slideDown {
    animation: slideDown 0.2s ease-out;
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  kbd {
    display: inline-block;
    padding: 2px 4px;
    font-size: 11px;
    line-height: 1;
    font-family: monospace;
  }
`;
document.head.appendChild(style);

// ====================================================================
// FONCTIONS UTILITAIRES
// ====================================================================
function enrichMomentsWithData(rawMoments) {
  if (!rawMoments) return [];
  return rawMoments.map(moment => ({
    ...moment,
    id: moment.id || `moment_${moment.dayStart}_${moment.dayEnd}`,
    postCount: moment.posts?.length || 0,
    dayPhotoCount: moment.dayPhotos?.length || 0,
    postPhotoCount: moment.postPhotos?.length || 0,
    photoCount: (moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0),
    displayTitle: moment.title || `Moment du jour ${moment.dayStart}`,
    displaySubtitle: moment.dayEnd > moment.dayStart ? `J${moment.dayStart}-J${moment.dayEnd}` : `J${moment.dayStart}`,
    isEmpty: (moment.posts?.length || 0) === 0 && ((moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0)) === 0,
  })).filter(moment => !moment.isEmpty);
}

function getFilteredMoments(momentsData, searchQuery) {
  if (!searchQuery.trim()) return momentsData;
  const query = searchQuery.toLowerCase();
  return momentsData.filter(m => 
    m.displayTitle.toLowerCase().includes(query) ||
    m.posts?.some(p => p.content && p.content.toLowerCase().includes(query))
  );
}