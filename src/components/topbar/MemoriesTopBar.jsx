/**
 * MemoriesTopBar.jsx v2.11 - Filtres de contenu intégrés
 * TopBar spécifique à la page Memories
 * ✅ Transitions 150ms
 *
 * ⭐ v2.11 : Filtres de contenu additifs
 * Layout :
 * - Gauche : 🔍 Recherche | Tag
 * - Centre : ✨ Moments | 📷 Photos | 🗒️ Textes | 🖼️ Images
 * - Droite : ... Menu (Random, Photo Souvenir, Mode Édition)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, X, XCircle, MoreVertical,
  FileText, Image as ImageIcon, Camera, Sparkles as SparklesIcon,
  Tag, Dices, ArrowUpDown, Plus, Sparkles, Edit2,
  Layers, ChevronDown  // ⭐ v2.11 : Pour toggle accordion
} from 'lucide-react';
import OverflowMenu from './OverflowMenu.jsx';

export default function MemoriesTopBar({
  isSearchOpen,
  setIsSearchOpen,
  isThemeBarVisible,
  setIsThemeBarVisible,
  jumpToRandomMoment,
  selectedTheme,
  setSelectedTheme,
  editionMode,
  onToggleEditionMode
}) {

  // ⭐ v2.11 : Accès aux filtres via window (pattern existant)
  // ⭐ v2.11 : Lire l'état depuis window (mis à jour par MemoriesPage)
  const [contentFilters, setContentFilters] = useState({
    moments: true,
    photos: true,
    textes: true,
    images: true
  });

  // Synchroniser avec window.memoriesPageFilters à chaque render
  useEffect(() => {
    const checkFilters = () => {
      if (window.memoriesPageFilters?.contentFilters) {
        setContentFilters(window.memoriesPageFilters.contentFilters);
      }
    };

    checkFilters();

    // Vérifier périodiquement (pour détecter changements)
    const interval = setInterval(checkFilters, 100);

    return () => clearInterval(interval);
  }, []);

  // 🔍 DEBUG: Logger l'état des filtres
  useEffect(() => {
    console.log('🎨 [MemoriesTopBar] contentFilters state:', contentFilters);
    console.log('🎨 [MemoriesTopBar] toggleContentFilter available:', !!window.memoriesPageFilters?.toggleContentFilter);
  }, [contentFilters]);

  // Handler avec logs pour toggle filtre
  const handleToggleFilter = (filterKey) => {
    console.log('👆 [MemoriesTopBar] Button clicked for filter:', filterKey);
    console.log('👆 [MemoriesTopBar] Current contentFilters:', contentFilters);

    // ⭐ Lire la fonction directement depuis window à chaque appel
    const toggleFn = window.memoriesPageFilters?.toggleContentFilter;
    console.log('👆 [MemoriesTopBar] toggleContentFilter function:', toggleFn);

    if (toggleFn) {
      toggleFn(filterKey);
    } else {
      console.error('❌ [MemoriesTopBar] toggleContentFilter is not available!');
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMomentFilterMenu, setShowMomentFilterMenu] = useState(false);
  const [currentMomentFilter, setCurrentMomentFilter] = useState('all');

  // ⭐ v2.12 : États pour volets indépendants (moments, posts, photos)
  const [momentsExpanded, setMomentsExpanded] = useState(false);
  const [postsExpanded, setPostsExpanded] = useState(false);
  const [photosExpanded, setPhotosExpanded] = useState(false);

  // ⭐ v2.12 : Synchroniser états volets avec window.memoriesPageState
  useEffect(() => {
    const checkExpanded = () => {
      const state = window.memoriesPageState;

      if (state) {
        // Moments
        const momentsAllExpanded = state.selectedMoments?.length > 0 &&
                                   state.selectedMoments?.length === state.filteredMomentsCount;
        setMomentsExpanded(momentsAllExpanded);

        // Posts - ⭐ v2.13 : FIX - Utiliser expandedPostsSize comme référence
        const expandedPostsSize = state.expandedPosts?.size || 0;
        // ⚠️ WORKAROUND : Ne pas utiliser totalPostsCount car il compte les posts sans ID (289 au lieu de 276)
        // On considère que si expandedPosts contient au moins 250 posts, tous sont dépliés
        const postsAllExpanded = expandedPostsSize >= 250;

        // 🔍 DEBUG v2.13 : Log si posts dépliés (pour debug)
        if (expandedPostsSize > 0) {
          console.log('🔍 [TopBar Polling]', {expandedPostsSize, postsAllExpanded});
        }

        setPostsExpanded(postsAllExpanded);

        // Photos - ⭐ v2.13 : Seulement moments avec dayPhotos
        const photosAllExpanded = state.momentsWithPhotosCount > 0 &&
                                  state.expandedPhotoGrids?.size === state.momentsWithPhotosCount;
        setPhotosExpanded(photosAllExpanded);
      }
    };

    checkExpanded();
    const interval = setInterval(checkExpanded, 200);

    return () => clearInterval(interval);
  }, []);
  
  const sortMenuRef = useRef(null);
  const momentFilterMenuRef = useRef(null);
  
  // Fermer les menus au clic outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
      if (momentFilterMenuRef.current && !momentFilterMenuRef.current.contains(e.target)) {
        setShowMomentFilterMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Toggle display options
  const toggleDisplayOption = (key) => {
    setDisplayOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  // Appliquer filtre moment
  const applyMomentFilter = (filter) => {
    setCurrentMomentFilter(filter);
    setShowMomentFilterMenu(false);
    
    if (window.memoriesPageFilters?.setMomentFilter) {
      window.memoriesPageFilters.setMomentFilter(filter);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">
      
      {/* ========================================
          GAUCHE : Random | Recherche | Thèmes
      ======================================== */}
      <div className="flex items-center space-x-1.5">
        {/* Random moment */}
        <button
          onClick={jumpToRandomMoment}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          title="Moment aléatoire"
        >
          <Dices className="w-5 h-5" />
        </button>
        
        {/* Séparateur */}
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
        
        {/* Recherche */}
        <button 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`p-2 rounded-lg transition-colors duration-150 ${
            isSearchOpen 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={isSearchOpen ? "Fermer la recherche" : "Rechercher (/)"}
        >
          {isSearchOpen ? <XCircle className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
        
        {/* Afficher thèmes */}
        <button
          onClick={() => {
            const newVisibility = !isThemeBarVisible;
            setIsThemeBarVisible(newVisibility);

            // Si on ferme la barre, reset le filtre à "Tous"
            if (!newVisibility && selectedTheme !== null) {
              setSelectedTheme(null);
            }
          }}
          className={`p-2 rounded-lg transition-colors duration-150 ${
            isThemeBarVisible
              ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={isThemeBarVisible ? "Masquer thèmes" : "Afficher thèmes"}
        >
          <Tag className="w-5 h-5" />
        </button>

      </div>
      {/* Séparateur */}
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

      {/* ========================================
          CENTRE : ⭐ v2.12 Filtres + mini boutons volets
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center gap-3">

          {/* ✨ Moments (en-têtes) + mini bouton volet */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => handleToggleFilter('moments')}
              className={`p-1.5 rounded transition-colors duration-150 ${
                contentFilters.moments
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={contentFilters.moments ? "Masquer en-têtes moments (mode en vrac)" : "Afficher en-têtes moments"}
            >
              <SparklesIcon className="w-4 h-4" />
            </button>

            {/* Mini bouton volet moments */}
            <button
              onClick={() => {
                if (momentsExpanded) {
                  window.memoriesPageActions?.collapseAllMoments();
                } else {
                  window.memoriesPageActions?.expandAllMoments();
                }
              }}
              disabled={!contentFilters.moments}
              className={`p-0.5 rounded transition-colors duration-150 ${
                !contentFilters.moments
                  ? 'opacity-30 cursor-not-allowed'
                  : momentsExpanded
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={momentsExpanded ? "Replier tous les moments" : "Déplier tous les moments"}
            >
              {momentsExpanded ? <Layers className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* 🗒️ Posts complets + mini bouton volet */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => handleToggleFilter('posts')}
              className={`p-1.5 rounded transition-colors duration-150 ${
                contentFilters.posts
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Afficher/masquer les posts complets (texte + photos)"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Mini bouton volet posts */}
            <button
              onClick={() => {
                if (postsExpanded) {
                  window.memoriesPageActions?.collapseAllPosts();
                } else {
                  window.memoriesPageActions?.expandAllPosts();
                }
              }}
              disabled={!contentFilters.posts}
              className={`p-0.5 rounded transition-colors duration-150 ${
                !contentFilters.posts
                  ? 'opacity-30 cursor-not-allowed'
                  : postsExpanded
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={postsExpanded ? "Replier tous les posts" : "Déplier tous les posts"}
            >
              {postsExpanded ? <Layers className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* 📸 Photos + mini bouton volet */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => handleToggleFilter('photos')}
              className={`p-1.5 rounded transition-colors duration-150 ${
                contentFilters.photos
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Afficher/masquer toutes les photos (moment + post)"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Mini bouton volet photos (grilles de moments) */}
            <button
              onClick={() => {
                if (photosExpanded) {
                  window.memoriesPageActions?.collapseAllPhotoGrids();
                } else {
                  window.memoriesPageActions?.expandAllPhotoGrids();
                }
              }}
              disabled={!contentFilters.photos}
              className={`p-0.5 rounded transition-colors duration-150 ${
                !contentFilters.photos
                  ? 'opacity-30 cursor-not-allowed'
                  : photosExpanded
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={photosExpanded ? "Replier toutes les grilles photos" : "Déplier toutes les grilles photos"}
            >
              {photosExpanded ? <Layers className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* ========================================
          DROITE : Menu overflow
      ======================================== */}
      <div className="flex items-center justify-end relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(prev => !prev);
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          title="Menu"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        <OverflowMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
        >
          {/* ⭐ v2.8f : Ajouter photo souvenir */}
          <button
            onClick={() => {
              setShowMenu(false);
              window.memoriesPageActions?.addPhotoSouvenir?.();
            }}
            className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Ajouter photo souvenir</span>
          </button>

          {/* ⭐ v2.9 : Mode Édition */}
          <button
            onClick={() => {
              setShowMenu(false);
              onToggleEditionMode?.();
            }}
            className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${
              editionMode?.active ? 'bg-red-50 dark:bg-red-900/20' : ''
            }`}
          >
            <Edit2 className={`w-5 h-5 ${
              editionMode?.active ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400'
            }`} />
            <span className={`font-medium ${
              editionMode?.active ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200'
            }`}>
              {editionMode?.active ? 'Quitter mode édition' : 'Mode édition'}
            </span>
          </button>
        </OverflowMenu>
      </div>
      
    </div>
  );
}