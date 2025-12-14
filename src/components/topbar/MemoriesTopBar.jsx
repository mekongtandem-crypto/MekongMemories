/**
 * MemoriesTopBar.jsx v2.19 - Fix bouton DT mode photos
 * TopBar spécifique à la page Memories
 *
 * ✅ v2.19 : Bouton DT reflète postPhotosOnlyMode en mode AM=0 AT=0
 * ✅ Nomenclature: Structure / Textes / Images
 * ✅ Boutons déplier discrets (flèches)
 *
 * Layout :
 * - Gauche : 🔍 Recherche | 🏷️ Thèmes
 * - Centre : ✨ Structure | 🗒️ Textes | 📸 Images (+ mini boutons volets)
 * - Droite : ... Menu (Random, Photo Souvenir, Mode Édition)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, X, XCircle, MoreVertical,
  FileText, Camera, Sparkles as SparklesIcon,
  Tag, Dices, Sparkles, Edit2,
  ChevronRight, ChevronDown  // ⭐ v2.14 : Flèches discrètes pour volets
} from 'lucide-react';
import OverflowMenu from './OverflowMenu.jsx';
import { useMemoriesDisplay } from '../memories/context/MemoriesDisplayContext.jsx';

export default function MemoriesTopBar({
  isSearchOpen,
  setIsSearchOpen,
  isThemeBarVisible,
  setIsThemeBarVisible,
  jumpToRandomMoment,
  selectedTheme,
  setSelectedTheme,
  editionMode,
  onToggleEditionMode,
  // ⭐ v2.14 : Ref pour obtenir IDs et counts depuis MemoriesPage
  memoriesPageRef
}) {

  // ⭐ v2.14 : Accès au Context (remplace polling + window.state)
  const { state, actions, computed } = useMemoriesDisplay();

  // ⭐ v2.14h : Lire counts depuis Context (plus depuis ref!)
  const { filteredMomentsCount, totalPostsCount, momentsWithPhotosCount, allPhotoGridIds } = state.counts;

  // États UI locaux (menus)
  const [showMenu, setShowMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMomentFilterMenu, setShowMomentFilterMenu] = useState(false);
  const [currentMomentFilter, setCurrentMomentFilter] = useState('all');

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

  // Appliquer filtre moment
  const applyMomentFilter = (filter) => {
    setCurrentMomentFilter(filter);
    setShowMomentFilterMenu(false);

    // TODO: À implémenter dans le Context
    // actions.setMomentFilter(filter);
  };

  // ⭐ v2.15w : Computed - États "tous dépliés" (CORRIGÉ pour photoGrids!)
  const momentsAllExpanded = computed.allMomentsExpanded(filteredMomentsCount);
  const postsAllExpanded = computed.allPostsExpanded(totalPostsCount);
  // ✅ FIX: Utiliser allPhotoGridIds.length au lieu de momentsWithPhotosCount
  const photosAllExpanded = computed.allPhotoGridsExpanded(allPhotoGridIds?.length || 0);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">

      {/* ========================================
          GAUCHE : Random | Recherche | Thèmes
      ======================================== */}
      <div className="flex items-center space-x-1.5">
        {/* Random moment */}
        <button
          onClick={() => {
            if (jumpToRandomMoment) {
              jumpToRandomMoment();
            } else {
              console.error('❌ [MemoriesTopBar] jumpToRandomMoment est undefined !');
            }
          }}
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
          CENTRE : ⭐ v2.14 Structure | Textes | Images + mini volets
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center gap-3">

          {/* ✨ Structure (ex-Moments) + mini bouton volet */}
          <div className="flex flex-col items-center">
            {/* Bouton Affichage */}
            <button
              onClick={() => {
                const wasOn = state.contentFilters.structure;
                actions.toggleContentFilter('structure');

                // ⭐ v2.14 : Si passage OFF → ON, activer aussi le dépliement
                if (!wasOn) {
                  const momentIds = state.counts.allMomentIds;
                  actions.expandAll('moments', momentIds);
                }

                // ⭐ v2.15h : Si passage ON → OFF (mode Vrac), déplier posts seulement (pas photoGrids)
                if (wasOn) {
                  const postIds = state.counts.allPostIds;
                  actions.expandAll('posts', postIds);
                }
              }}
              className={`p-1.5 rounded-t transition-colors duration-150 ${
                state.contentFilters.structure
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={state.contentFilters.structure ? "Masquer en-têtes moments (mode en vrac)" : "Afficher en-têtes moments"}
            >
              <SparklesIcon className="w-4 h-4" />
            </button>

            {/* ⭐ v2.14 : Bouton Dépliement - Collé + même couleur */}
            <button
              onClick={() => {
                const momentIds = state.counts.allMomentIds;
                if (momentsAllExpanded) {
                  actions.collapseAll('moments');
                } else {
                  actions.expandAll('moments', momentIds);
                }
              }}
              disabled={!state.contentFilters.structure}
              className={`p-0.5 rounded-b transition-colors duration-150 ${
                !state.contentFilters.structure
                  ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400'
                  : state.contentFilters.structure
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={momentsAllExpanded ? "Replier tous les moments" : "Déplier tous les moments"}
            >
              {momentsAllExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* 🗒️ Textes (ex-Posts) + mini bouton volet */}
          <div className="flex flex-col items-center">
            {/* Bouton Affichage */}
            <button
              onClick={() => {
                const wasOff = !state.contentFilters.textes;
                actions.toggleContentFilter('textes');

                // ⭐ v2.14 : Si passage OFF → ON, activer aussi le dépliement
                if (wasOff) {
                  const postIds = state.counts.allPostIds;
                  actions.expandAll('posts', postIds);
                }

                // ⭐ v2.17c : CASCADE - Si passage ON → OFF, replier tous les posts (DT→0)
                if (!wasOff) {
                  actions.collapseAll('posts');
                }
              }}
              className={`p-1.5 rounded-t transition-colors duration-150 ${
                state.contentFilters.textes
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Afficher/masquer les textes complets (contenu + photos)"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* ⭐ v2.19 : Bouton Dépliement - Gère PhotoDePost si AM=0 ET AT=0 */}
            <button
              onClick={() => {
                const isVracMode = !state.contentFilters.structure;  // AM=0
                const textesOff = !state.contentFilters.textes;      // AT=0

                // ⭐ v2.19 : CAS SPÉCIAL - Mode Vrac (AM=0) + Textes OFF (AT=0)
                // → DT gère l'affichage des PhotoDePost
                if (isVracMode && textesOff) {
                  actions.togglePostPhotosOnly();
                  return;
                }

                // ⭐ v2.17a : Cas normal - Si AT=0, activer d'abord (prerequisite automatique)
                if (textesOff) {
                  actions.toggleContentFilter('textes');
                }

                // Toggle déploiement posts
                if (postsAllExpanded) {
                  actions.collapseAll('posts');
                } else {
                  const postIds = state.counts.allPostIds;
                  actions.expandAll('posts', postIds);
                }
              }}
              className={`p-0.5 rounded-b transition-colors duration-150 ${
                // ⭐ v2.17d : Griser si AT=0 (sauf en mode spécial PhotoDePost AM=0 ET AT=0)
                !state.contentFilters.textes && state.contentFilters.structure
                  ? 'opacity-50 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'
              }`}
              title={
                (!state.contentFilters.structure && !state.contentFilters.textes)
                  ? (state.postPhotosOnlyMode ? "Masquer photos de posts" : "Afficher photos de posts")
                  : (postsAllExpanded ? "Replier tous les textes" : "Déplier tous les textes (active AT si nécessaire)")
              }
            >
              {/* ⭐ v2.19 : Chevron reflète postPhotosOnlyMode en mode spécial AM=0 AT=0 */}
              {(!state.contentFilters.structure && !state.contentFilters.textes)
                ? (state.postPhotosOnlyMode ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
                : (postsAllExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
              }
            </button>
          </div>

          {/* 📸 Images (ex-Photos) + mini bouton volet */}
          <div className="flex flex-col items-center">
            {/* Bouton Affichage */}
            <button
              onClick={() => {
                const wasOff = !state.contentFilters.images;
                actions.toggleContentFilter('images');

                // ⭐ v2.14 : Si passage OFF → ON, activer aussi le dépliement
                if (wasOff) {
                  const photoGridIds = state.counts.allPhotoGridIds;
                  actions.expandAll('photoGrids', photoGridIds);
                }

                // ⭐ v2.15e : Si passage ON → OFF, replier toutes les grilles (DP→0)
                if (!wasOff) {
                  actions.collapseAll('photoGrids');
                }
              }}
              className={`p-1.5 rounded-t transition-colors duration-150 ${
                state.contentFilters.images
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Afficher/masquer toutes les images (moment + post)"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* ⭐ v2.17a : Bouton Dépliement - Prerequisite automatique */}
            <button
              onClick={() => {
                // ⭐ v2.17a : Si AP=0, activer d'abord (prerequisite automatique)
                if (!state.contentFilters.images) {
                  actions.toggleContentFilter('images');
                }

                if (photosAllExpanded) {
                  actions.collapseAll('photoGrids');
                } else {
                  const photoGridIds = state.counts.allPhotoGridIds;
                  actions.expandAll('photoGrids', photoGridIds);
                }
              }}
              className={`p-0.5 rounded-b transition-colors duration-150 ${
                // ⭐ v2.17d : Griser si AP=0
                !state.contentFilters.images
                  ? 'opacity-50 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
              }`}
              title={photosAllExpanded ? "Replier toutes les grilles images" : "Déplier toutes les grilles images (active AP si nécessaire)"}
            >
              {photosAllExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
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
              // TODO: À connecter avec MemoriesPage
              // window.memoriesPageActions?.addPhotoSouvenir?.();
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
