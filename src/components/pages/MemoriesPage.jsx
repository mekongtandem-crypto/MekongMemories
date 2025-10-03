/**
 * MemoriesPage.jsx v5.5 - ÉTAPE 2 FINALISÉE : Ouverture intelligente
 * ✅ Moment fermé : localDisplay = {showPosts: false, showDayPhotos: false}
 * ✅ Clic "posts" fermé → ouvre avec SEULEMENT posts
 * ✅ Clic "photos" fermé → ouvre avec SEULEMENT photos  
 * ✅ Clic chevron fermé → ouvre avec TOUT (posts + photos)
 * ✅ Fermeture moment → reset localDisplay à false
 * ✅ Mode Focus/Multi fonctionnel
 * ✅ Icônes grises quand masqué
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, ChevronUp, Search, Dices, PlusCircle, Type, Map, Minimize2,
  Focus, Layers
} from 'lucide-react';
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';

// ====================================================================
// COMPOSANT PRINCIPAL
// ====================================================================
export default function MemoriesPage() {
  const app = useAppState();
  const [selectedMoments, setSelectedMoments] = useState([]); // ✅ Maintenant un tableau
  const [displayMode, setDisplayMode] = useState('focus'); // ✅ 'focus' ou 'multi'
  const [searchQuery, setSearchQuery] = useState('');
  const [displayOptions, setDisplayOptions] = useState({
    showPostText: true,
    showPostPhotos: true,
    showMomentPhotos: true
  });
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null, gallery: [], contextMoment: null 
  });

  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef(null);

  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);
  const momentRefs = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
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
        case 'f':
        case 'F':
          setDisplayMode(prev => prev === 'focus' ? 'multi' : 'focus');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDay, momentsData]);

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

  const scrollToMoment = useCallback((momentId, blockPosition = 'start') => {
    const element = momentRefs.current[momentId];
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: blockPosition });
        }, 50);
    }
  }, []);

  const navigateDay = useCallback((delta) => {
    const newDay = Math.max(0, Math.min(currentDay + delta, 200));
    setCurrentDay(newDay);
    jumpToDay(newDay);
  }, [currentDay, momentsData]);

  const jumpToDay = useCallback((day) => {
    const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
    if (targetMoment) {
      handleSelectMoment(targetMoment);
      setCurrentDay(day);
    }
  }, [momentsData, displayMode]);

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

  // ✅ NOUVEAU : Gestion Focus vs Multi
  const handleSelectMoment = useCallback((moment) => {
    setSelectedMoments(prev => {
      const isAlreadySelected = prev.some(m => m.id === moment.id);
      
      if (displayMode === 'focus') {
        // Mode Focus : un seul moment ouvert
        if (isAlreadySelected && prev.length === 1) {
          return []; // Fermer si c'est le seul ouvert
        }
        return [moment]; // Ouvrir uniquement celui-ci
      } else {
        // Mode Multi : toggle individuel
        if (isAlreadySelected) {
          return prev.filter(m => m.id !== moment.id); // Retirer
        }
        return [...prev, moment]; // Ajouter
      }
    });
  }, [displayMode]);

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

  const headerHeight = isTimelineVisible ? 200 : 60;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
      
      <div 
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ height: `${headerHeight}px` }}
      >
        {isTimelineVisible && (
          <div className="transition-all duration-300">
            <TimelineRuleV2 
              selectedMoment={selectedMoments[0] || null}
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
          selectedMoments={selectedMoments}
          setSelectedMoments={setSelectedMoments}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          momentsData={momentsData}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          jumpToDay={jumpToDay}
          navigateDay={navigateDay}
          isTimelineVisible={isTimelineVisible}
          setIsTimelineVisible={setIsTimelineVisible}
        />
      </div>

      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ paddingTop: isHeaderVisible ? `${headerHeight}px` : '0' }}
      >
        <div className="container mx-auto px-4 py-4">
          <MomentsList 
            moments={filteredMoments}
            selectedMoments={selectedMoments}
            displayOptions={displayOptions}
            onMomentSelect={handleSelectMoment}
            onPhotoClick={openPhotoViewer}
            onCreateSession={handleCreateAndOpenSession}
            momentRefs={momentRefs}
          />
        </div>
      </main>

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
// COMPOSANT : BARRE DE FILTRES
// ====================================================================
const CompactFilters = memo(({ 
  searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen,
  displayOptions, setDisplayOptions, selectedMoments, setSelectedMoments, 
  displayMode, setDisplayMode,
  momentsData, currentDay, setCurrentDay, jumpToDay, navigateDay,
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

  const handleDayWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    navigateDay(delta);
  };

  const jumpToRandomMoment = () => {
    if (momentsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * momentsData.length);
      const randomMoment = momentsData[randomIndex];
      setSelectedMoments([randomMoment]);
      setCurrentDay(randomMoment.dayStart);
    }
  };

  const handleDisplayOptionToggle = (option) => {
    setDisplayOptions(prev => ({...prev, [option]: !prev[option]}));
  };

  // ✅ Toggle Focus/Multi
  const handleToggleDisplayMode = () => {
    setDisplayMode(prev => {
      if (prev === 'multi') {
        // Passer en mode Focus : garder seulement le dernier moment ouvert
        if (selectedMoments.length > 0) {
          setSelectedMoments([selectedMoments[selectedMoments.length - 1]]);
        }
        return 'focus';
      } else {
        return 'multi';
      }
    });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-2">
        
        <div className="flex items-center gap-3">
          
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
          
          <button 
            onClick={jumpToRandomMoment} 
            className="p-1.5 rounded-lg border bg-white hover:bg-gray-100" 
            title="Moment au hasard"
          >
            <Dices className="w-5 h-5 text-gray-700" />
          </button>
          
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            className={`p-1.5 rounded-lg border ${isSearchOpen ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-gray-100'}`}
            title="Rechercher (/)"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <DisplayOptionsButtons 
            displayOptions={displayOptions}
            onToggle={handleDisplayOptionToggle}
          />
          
          <div className="flex-1" />
          
          {/* ✅ NOUVEAU : Bouton Focus/Multi */}
          <button 
            onClick={handleToggleDisplayMode}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              displayMode === 'focus' 
                ? 'bg-amber-100 text-amber-700 border-amber-300' 
                : 'bg-purple-100 text-purple-700 border-purple-300'
            }`}
            title={displayMode === 'focus' ? 'Mode Focus (F pour changer)' : 'Mode Multi (F pour changer)'}
          >
            {displayMode === 'focus' ? <Focus className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            <span className="text-xs font-medium hidden sm:inline">
              {displayMode === 'focus' ? 'Focus' : 'Multi'}
            </span>
          </button>
        </div>

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
        <div><kbd className="bg-gray-700 px-1 rounded">F</kbd> Focus/Multi</div>
        <div><kbd className="bg-gray-700 px-1 rounded">↑↓</kbd> Jour ±1</div>
        <div><kbd className="bg-gray-700 px-1 rounded">/</kbd> Recherche</div>
      </div>
    </div>
  );
};

// ====================================================================
// COMPOSANT : BOUTONS OPTIONS D'AFFICHAGE
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

// ====================================================================
// COMPOSANT : LISTE DES MOMENTS
// ====================================================================
const MomentsList = memo(({ 
  moments, selectedMoments, displayOptions, onMomentSelect, onPhotoClick, onCreateSession, momentRefs
}) => {
  return (
    <div className="space-y-3">
      {moments.map((moment) => (
        <MomentCard
          key={moment.id} 
          moment={moment} 
          isSelected={selectedMoments.some(m => m.id === moment.id)}
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

// ====================================================================
// COMPOSANT : CARTE MOMENT (avec logique d'ouverture intelligente)
// ====================================================================
const MomentCard = memo(React.forwardRef(({ 
  moment, isSelected, displayOptions, onSelect, onPhotoClick, onCreateSession
}, ref) => {  
  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;
  
  // ✅ ÉTAT INITIAL : tout fermé quand moment fermé
  const [localDisplay, setLocalDisplay] = useState({
    showPosts: false,
    showDayPhotos: false
  });
  
  // ✅ Mémoriser l'état précédent pour détecter l'ouverture
  const wasSelectedRef = useRef(isSelected);
  
  // ✅ Reset à fermé quand le moment se ferme
  useEffect(() => {
    if (wasSelectedRef.current && !isSelected) {
      // Le moment vient de se fermer → reset
      setLocalDisplay({
        showPosts: false,
        showDayPhotos: false
      });
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected]);
  
  // ✅ Fonction pour ouvrir avec options spécifiques
  const handleOpenWith = (options) => {
    if (!isSelected) {
      // Ouvrir le moment
      onSelect(moment);
    }
    // Appliquer les options d'affichage
    setLocalDisplay(options);
  };
  
  const handleToggleLocal = (key) => {
    setLocalDisplay(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    onToggleDayPhotos={() => handleToggleLocal('showDayPhotos')}  // ✅ AJOUT
  />
)}
    </div>
  );
}));

// ====================================================================
// COMPOSANT : EN-TÊTE MOMENT (avec logique d'ouverture intelligente)
// ====================================================================
const MomentHeader = memo(({ moment, isSelected, onSelect, onOpenWith, onCreateSession, localDisplay, onToggleLocal }) => {
  
  // ✅ SCÉNARIO A/B : Clic sur lien quand fermé → ouvre avec SEULEMENT ce contenu
  const handleLinkClick = (e, contentType) => {
    e.stopPropagation();
    
    if (!isSelected) {
      // Moment fermé → ouvrir avec SEULEMENT ce type de contenu
      if (contentType === 'posts') {
        onOpenWith({ showPosts: true, showDayPhotos: false });
      } else if (contentType === 'photos') {
        onOpenWith({ showPosts: false, showDayPhotos: true });
      }
    } else {
      // Moment ouvert → toggle normalement
      onToggleLocal(contentType === 'posts' ? 'showPosts' : 'showDayPhotos');
    }
  };
  
  // ✅ SCÉNARIO C : Clic sur chevron → ouvre avec TOUT
  const handleChevronClick = () => {
    if (!isSelected) {
      // Ouvrir avec tout affiché
      onOpenWith({ showPosts: true, showDayPhotos: true });
    } else {
      // Fermer
      onSelect(moment);
    }
  };

  return (
    <>
      <div onClick={handleChevronClick} className="cursor-pointer flex items-start justify-between">
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
        {/* ✅ BOUTON Posts : icône grise si masqué */}
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
        
        {/* ✅ BOUTON Photos : icône grise si masqué */}
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
            onCreateSession(moment);
          }}
          className="flex items-center font-medium text-amber-600 hover:underline ml-auto pl-2"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Session
        </button>
      </div>
    </>
  );
});

// ====================================================================
// COMPOSANT : CONTENU MOMENT
// ====================================================================
const MomentContent = memo(({ 
  moment, displayOptions, localDisplay, visibleDayPhotos, photosPerLoad, 
  onPhotoClick, onCreateSession, onLoadMorePhotos, onToggleDayPhotos  
}) => (
  <div className="px-3 pb-3">
    {/* Posts existants */}
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
    
    {/* ✅ NOUVEAU : Header photos du moment (toujours visible si photos existent) */}
    {moment.dayPhotoCount > 0 && (
      <div className="mt-2 border-b border-gray-100 pb-2">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Toggle depuis MomentCard via prop
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
    
    {/* Photos (si affichées) */}
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

// ====================================================================
// COMPOSANT : ARTICLE POST
// ====================================================================
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
        {/* ✅ NOUVEAU : Header unifié avec compteur photos */}
        <div className="flex justify-between items-center bg-gray-50 p-2 border-b border-gray-200">
          <div className="flex items-center gap-x-3 flex-1 min-w-0">
            {/* Icône photos (si post a des photos) */}
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
            
            {/* Titre du post */}
            <h4 className="font-semibold text-gray-800 text-sm truncate flex-1">
              {title}
            </h4>
          </div>
          
          {/* Partie droite : compteur photos + bouton session */}
          <div className="flex items-center gap-x-3 flex-shrink-0 ml-2">
            {/* ✅ NOUVEAU : Compteur photos */}
            {hasPhotos && (
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {post.photos.length} photo{post.photos.length > 1 ? 's' : ''}
              </span>
            )}
            
            {/* Bouton session */}
            <button 
              onClick={handleCreateSession} 
              className="p-1 text-gray-500 hover:text-amber-600" 
              title="Créer une session"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Texte du post */}
        {displayOptions.showPostText && (
          <div className="prose prose-sm max-w-none bg-white p-3" 
               dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>

      {/* Photos du post */}
      {photosAreVisible && (
        <PhotoGrid 
          photos={post.photos}
          moment={moment}
          onPhotoClick={onPhotoClick}
        />
      )}
    </div>
  );
});

// ====================================================================
// COMPOSANT : GRILLE PHOTOS (UNIFORME)
// ====================================================================
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

// ====================================================================
// COMPOSANT : VIGNETTE PHOTO
// ====================================================================
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

// ====================================================================
// FONCTIONS UTILITAIRES
// ====================================================================
function enrichMomentsWithData(rawMoments) {
  if (!rawMoments) return [];
  return rawMoments.map((moment, index) => ({
    ...moment,
    id: moment.id || `moment_${moment.dayStart}_${moment.dayEnd}_${index}`,
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

// CSS Animations
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