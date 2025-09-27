// Copiez ce bloc entier dans votre fichier MemoriesPage.jsx

/**
 * MemoriesPage.jsx - v3.0 - Architecture Simplifiée
 * * Ce composant a été refactorisé pour s'aligner avec l'architecture de données centrale.
 * - Ne charge plus ses propres données ; il les reçoit via le hook `useAppState`.
 * - Correction d'une erreur fatale au rendu.
 * - La logique interne est maintenant concentrée uniquement sur la gestion de l'interface (sélection, filtres, etc.).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Camera, FileText, MapPin, ZoomIn, Image as ImageIcon,
  AlertCircle, ChevronDown, Play, Search, X, Dices, PlusCircle, Type
} from 'lucide-react';
// ATTENTION : Les chemins ci-dessous sont à corriger !
import TimelineRuleV2 from '../TimelineRule.jsx';
import PhotoViewer from '../PhotoViewer.jsx';


// ====================================================================
// COMPOSANT PRINCIPAL DE LA PAGE
// ====================================================================
export default function MemoriesPage() {
  const app = useAppState();

  console.log('État de l\'application reçu par MemoriesPage:', app);

  const [selectedMoment, setSelectedMoment] = useState(null);
  const [dayInput, setDayInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [displayOptions, setDisplayOptions] = useState({
    showPostText: true,
    showPostPhotos: true,
    showMomentPhotos: true
  });
  const [viewerState, setViewerState] = useState({ isOpen: false, photo: null, gallery: [], contextMoment: null });

  const momentsContainerRef = useRef(null);
  const momentRefs = useRef({});

  const enrichMomentsWithData = (rawMoments) => {
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
  };

  const momentsData = enrichMomentsWithData(app.masterIndex?.moments);

  useEffect(() => {
    if (selectedMoment && autoScroll) {
      setDayInput(selectedMoment.dayStart);
      scrollToMoment(selectedMoment.id, 'start');
    }
  }, [selectedMoment, autoScroll]);

  const openPhotoViewer = (clickedPhoto, contextMoment, photoList) => {
    setViewerState({ isOpen: true, photo: clickedPhoto, gallery: Array.isArray(photoList) ? photoList : [], contextMoment });
  };
  const closePhotoViewer = () => setViewerState({ isOpen: false, photo: null, gallery: [], contextMoment: null });

  const handleSelectMoment = (moment) => {
    setSelectedMoment(prev => (prev && prev.id === moment.id) ? null : moment);
  };

  const scrollToMoment = (momentId, blockPosition = 'start') => {
    const element = momentRefs.current[momentId];
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: blockPosition });
        }, 50);
    }
  };

  const handleDayJump = (e) => {
    e.preventDefault();
    const day = parseInt(dayInput, 10);
    if (!isNaN(day)) {
      const targetMoment = momentsData.find(m => day >= m.dayStart && day <= m.dayEnd);
      if (targetMoment) {
        setSelectedMoment(targetMoment);
      } else {
        alert(`Aucun moment trouvé pour le jour ${day}`);
      }
    }
  };

  const jumpToRandomMoment = () => {
      if (momentsData.length > 0) {
          const randomIndex = Math.floor(Math.random() * momentsData.length);
          setSelectedMoment(momentsData[randomIndex]);
      }
  };

  const getFilteredMoments = () => {
      if (!searchQuery.trim()) return momentsData;
      const query = searchQuery.toLowerCase();
      return momentsData.filter(m => 
          m.displayTitle.toLowerCase().includes(query) ||
          m.posts?.some(p => p.content && p.content.toLowerCase().includes(query))
      );
  };

  const handleCreateAndOpenSession = async (source, contextMoment) => {
    if (!source) return;
    let sessionData = {};
    let initialMessage = '';
    if (source.filename) {
        const type = source.type === 'day_photo' ? 'photo du moment' : 'photo d\'article';
        sessionData = { id: source.google_drive_id || source.url, title: `Souvenirs de ${contextMoment.displayTitle}`, description: `Basée sur la photo "${source.filename}"` };
        initialMessage = `🖼️ Session initiée à partir de la photo : "${source.filename}".`;
    } else if (source.content) {
      const title = (source.content.trim().split('\n')[0] || `Article J${source.dayNumber}`).substring(0, 40);
      sessionData = { id: source.id, title: `Souvenirs de l'article : ${title}...`, description: `Basée sur un article du moment "${contextMoment.displayTitle}"` };
      initialMessage = `📝 Session initiée à partir de l'article : "${title}...".`;
    } else {
      sessionData = { id: source.id, title: `Souvenirs du moment : ${source.displayTitle}`, description: `Basée sur le moment du ${source.displaySubtitle}` };
      initialMessage = `💬 Session initiée à partir du moment : "${source.displayTitle}".`;
    }
    try {
      const newSession = await app.createSession(sessionData);
      if (newSession) {
        const initialNote = { id: `${Date.now()}-system`, content: initialMessage, author: 'duo', createdAt: new Date().toISOString() };
        const sessionWithMessage = { ...newSession, notes: [initialNote] };
        await app.updateSession(sessionWithMessage);
        if (viewerState.isOpen) closePhotoViewer();
        await app.openChatSession(sessionWithMessage);
      }
    } catch (error) {
      console.error('Erreur création de session:', error);
      alert(`Impossible de créer la session : ${error.message}`);
    }
  };

  const handleDisplayOptionToggle = (option) => {
    setDisplayOptions(prev => ({...prev, [option]: !prev[option]}));
  };

  if (!app.isInitialized || !momentsData) {
    return <div className="p-12 text-center">Chargement des données...</div>;
  }

  if (momentsData.length === 0) {
    return <div className="p-12 text-center text-red-500">Aucun moment à afficher. Vérifiez le master_index.</div>;
  }

  const filteredMoments = getFilteredMoments();

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      <TimelineRuleV2 
        selectedMoment={selectedMoment}
        onMomentSelect={handleSelectMoment}
      />
      <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-sm pt-4 pb-3 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-x-4">
            <form onSubmit={handleDayJump} className="flex items-center gap-2">
              <input type="number" value={dayInput} onChange={(e) => setDayInput(e.target.value)}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Jour..."/>
              <button type="button" onClick={jumpToRandomMoment} className="p-2 rounded-lg border bg-white hover:bg-gray-100" title="Moment au hasard">
                  <Dices className="w-5 h-5 text-gray-700" />
              </button>
            </form>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg" placeholder="Rechercher un texte, un titre..."/>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDisplayOptionToggle('showPostText')} className={`p-2 rounded-lg border ${displayOptions.showPostText ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} title="Afficher/Masquer le texte"><Type className="w-5 h-5" /></button>
              <button onClick={() => handleDisplayOptionToggle('showPostPhotos')} className={`p-2 rounded-lg border ${displayOptions.showPostPhotos ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} title="Afficher/Masquer les photos des articles"><ImageIcon className="w-5 h-5" /></button>
              <button onClick={() => handleDisplayOptionToggle('showMomentPhotos')} className={`p-2 rounded-lg border ${displayOptions.showMomentPhotos ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} title="Afficher/Masquer les photos du moment"><Camera className="w-5 h-5" /></button>
            </div>
            <button onClick={() => setSelectedMoment(null)} className="p-2 rounded-lg border bg-white hover:bg-gray-100" title="Fermer tous les moments"><X className="w-5 h-5 text-gray-700" /></button>
            <button onClick={() => setAutoScroll(!autoScroll)} className={`p-2 rounded-lg border ${autoScroll ? 'bg-blue-100 text-blue-700' : 'bg-white'}`} title="Scroll automatique"><Play className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full flex flex-col p-4">
          <div ref={momentsContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
            {filteredMoments.map((moment) => (
              <MomentSection
                key={moment.id} 
                moment={moment} 
                isSelected={selectedMoment && selectedMoment.id === moment.id}
                onSelect={handleSelectMoment} 
                displayOptions={displayOptions}
                onPhotoClick={openPhotoViewer}
                onCreateSession={handleCreateAndOpenSession}
                ref={el => momentRefs.current[moment.id] = el}
                onHeaderClick={(type) => {
                  if (!selectedMoment || selectedMoment.id !== moment.id) {
                      setSelectedMoment(moment);
                  }
                  if (type === 'posts') {
                      setDisplayOptions({showPostText: true, showPostPhotos: true, showMomentPhotos: false});
                  }
                  if (type === 'photos') {
                      setDisplayOptions({showMomentPhotos: true, showPostText: false, showPostPhotos: false});
                  }
                  scrollToMoment(moment.id, 'start');
                }}
              />
            ))}
          </div>
        </div>
      </main>

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
// SOUS-COMPOSANTS (Laissés tels quels pour l'instant)
// ====================================================================

const PostComponent = ({ post, moment, displayOptions, onPhotoClick, onCreateSession }) => {
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
              <button onClick={() => setShowThisPostPhotos(!showThisPostPhotos)} className={`p-1 ${showThisPostPhotos ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 flex-shrink-0`} title="Afficher/Masquer les photos"><ImageIcon className="w-4 h-4" /></button>
            )}
            <h4 className="font-semibold text-gray-800 text-sm truncate">{title}</h4>
          </div>
          <button onClick={handleCreateSession} className="p-1 text-gray-500 hover:text-amber-600 ml-2" title="Créer une session"><PlusCircle className="w-4 h-4" /></button>
        </div>
        {displayOptions.showPostText && (
          <div className="prose prose-sm max-w-none bg-white p-3" dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>

      {photosAreVisible && (
        <div className="mt-2">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {post.photos.map((photo, idx) => (
              <PhotoComponent key={photo.url || idx} photo={photo} moment={moment} onClick={(p) => onPhotoClick(p, moment, post.photos)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MomentSection = React.forwardRef(({ moment, isSelected, onSelect, onPhotoClick, displayOptions, onCreateSession, onHeaderClick }, ref) => {  
  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;

  return (
    <div ref={ref} id={moment.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="p-3">
        <div onClick={() => onSelect(moment)} className="cursor-pointer flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="px-2 py-1 rounded-lg font-bold text-xs bg-gray-100 text-gray-800">{moment.displaySubtitle}</div>
              <h3 className="text-base font-semibold text-gray-900 truncate">{moment.displayTitle}</h3>
            </div>
            {moment.location && <span className="flex items-center text-xs text-gray-500 mt-1.5 ml-1"><MapPin className="w-3 h-3 mr-1.5 text-gray-400" />{moment.location}</span>}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isSelected ? 'rotate-180' : ''}`} />
        </div>

        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mt-2 pt-2 border-t border-gray-100">
          {moment.postCount > 0 && (
              <button onClick={() => onHeaderClick('posts')} className="flex items-center font-medium text-blue-600 hover:underline">
                  <FileText className="w-4 h-4 mr-1.5" /> {moment.postCount} article(s)
              </button>
          )}
          {moment.photoCount > 0 && (
              <button onClick={() => onHeaderClick('photos')} className="flex items-center font-medium text-green-600 hover:underline">
                  <Camera className="w-4 h-4 mr-1.5" /> {moment.photoCount} photo(s)
              </button>
          )}
          <button onClick={() => onCreateSession(moment)} className="flex items-center font-medium text-amber-600 hover:underline ml-auto pl-2">
            <PlusCircle className="w-4 h-4 mr-1.5" /> Session
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="px-3 pb-3">
          {moment.posts?.map(post => (
            <PostComponent 
              key={post.id}
              post={post}
              moment={moment}
              displayOptions={displayOptions}
              onPhotoClick={onPhotoClick}
              onCreateSession={onCreateSession}
            />
          ))}
          {displayOptions.showMomentPhotos && moment.dayPhotoCount > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Photos de "{moment.displayTitle}"</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {moment.dayPhotos.slice(0, visibleDayPhotos).map((photo, idx) => (
                  <PhotoComponent key={photo.google_drive_id || idx} photo={photo} moment={moment} onClick={(p) => onPhotoClick(p, moment, moment.dayPhotos)} />
                ))}
              </div>
              {visibleDayPhotos < moment.dayPhotoCount && (
                <div className="text-center mt-3">
                  <button onClick={() => setVisibleDayPhotos(prev => prev + photosPerLoad)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium">
                    Afficher {Math.min(photosPerLoad, moment.dayPhotoCount - visibleDayPhotos)} de plus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const PhotoComponent = ({ photo, moment, onClick }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;
    const resolveAndSetUrl = async () => {
      if (!photo) { if (isMounted) setStatus('error'); return; }
      try {
        console.log('PhotoComponent: Tentative de résolution pour l\'objet photo suivant :', photo);
        const thumbnailUrl = await window.photoDataV2.resolveImageUrl(photo, true);
        console.log('PhotoComponent: URL retournée :', thumbnailUrl);
        if (isMounted) {
          if (thumbnailUrl && !thumbnailUrl.startsWith('data:image/svg+xml')) {
            setImageUrl(thumbnailUrl);
          } else { setStatus('error'); }
        }
      } catch (e) { if (isMounted) setStatus('error'); }
    };
    resolveAndSetUrl();
    return () => { isMounted = false; };
  }, [photo]);

  return (
    <div 
      className="aspect-square bg-gray-200 rounded-md group relative cursor-pointer overflow-hidden" 
      onClick={() => status === 'loaded' && onClick(photo, moment)} >
      {status === 'loading' && <div className="w-full h-full animate-pulse flex items-center justify-center"><Camera className="w-6 h-6 text-gray-400" /></div>}
      {status === 'error' && <div className="w-full h-full bg-red-100 flex items-center justify-center" title="Erreur de chargement"><AlertCircle className="w-6 h-6 text-red-500" /></div>}
      {imageUrl && <img src={imageUrl} alt={photo?.filename || 'photo de voyage'} className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
      {status === 'loaded' && <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="w-6 h-6 text-white" /></div>}
    </div>
  );
};