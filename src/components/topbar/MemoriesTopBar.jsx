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

  // ⭐ v2.11 : État local pour savoir si tous les moments sont dépliés
  const [allExpanded, setAllExpanded] = useState(false);

  // Synchroniser avec le nombre de moments sélectionnés
  useEffect(() => {
    const checkExpanded = () => {
      const state = window.memoriesPageState;
      if (state) {
        // Tous expanded si nombre de moments sélectionnés === nombre total
        const expanded = state.selectedMoments?.length > 0 &&
                        state.selectedMoments?.length === state.filteredMomentsCount;
        setAllExpanded(expanded);
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

        {/* ⭐ v2.11 : Toggle Déplier/Replier tous */}
        <button
          onClick={() => {
            console.log('🔀 [MemoriesTopBar] Toggle accordion:', allExpanded ? 'Replier tous' : 'Déplier tous');
            if (allExpanded) {
              // Replier tous
              window.memoriesPageActions?.collapseAllMoments();
            } else {
              // Déplier tous
              window.memoriesPageActions?.expandAllMoments();
            }
          }}
          className={`p-2 rounded-lg transition-colors duration-150 ${
            allExpanded
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={allExpanded ? "Replier tous les moments" : "Déplier tous les moments"}
        >
          {allExpanded ? <Layers className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

      </div>
      {/* Séparateur */}
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
          
      {/* ========================================
          CENTRE : ⭐ v2.11 Filtres de contenu additifs
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center gap-2">

          {/* ✨ Moments (en-têtes) */}
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

          {/* 🗒️ Posts complets (header + texte + photos) */}
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

          {/* 📸 Toutes les photos (moment + post, sans decoration) */}
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