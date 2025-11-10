/**
 * MemoriesTopBar.jsx v1.1 - Phase 25 : Refactoring TopBar
 * TopBar spécifique à la page Memories
 * ✅ Transitions 150ms
 * 
 * Layout :
 * - Gauche : 🔍 Recherche
 * - Centre : 📄 📸 📷 | Filtres ▼ | Tri ▼
 * - Droite : ... Menu (avec actions : Thèmes, Random, Timeline)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, X, XCircle, MoreVertical, 
  FileText, Image as ImageIcon, Camera, 
  Tag, Dices, ArrowUpDown
} from 'lucide-react';
import OverflowMenu from './OverflowMenu.jsx';

export default function MemoriesTopBar({ 
  isSearchOpen, 
  setIsSearchOpen,
  displayOptions,
  setDisplayOptions,
  isThemeBarVisible,
  setIsThemeBarVisible,
  isTimelineVisible,
  setIsTimelineVisible,
  jumpToRandomMoment,
  navigationContext,
  selectedTheme,
  setSelectedTheme
}) {
  
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
  
  // Détection mode exploration (depuis Chat)
  const isFromChat = navigationContext?.previousPage === 'chat';
  
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
          CENTRE : Filtres display + Menus
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center space-x-2">
          
          {/* Toggle affichage posts */}
          <button
            onClick={() => toggleDisplayOption('showPostText')}
            className={`p-1.5 rounded transition-colors duration-150 ${
              displayOptions.showPostText
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Afficher/masquer les textes des posts"
          >
            <FileText className="w-4 h-4" />
          </button>
           
          {/* Toggle affichage photos posts */}
          <button
            onClick={() => toggleDisplayOption('showPostPhotos')}
            className={`p-1.5 rounded transition-colors duration-150 ${
              displayOptions.showPostPhotos
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Afficher/masquer les photos des posts"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          {/* Toggle affichage photos moments */}
          <button
            onClick={() => toggleDisplayOption('showMomentPhotos')}
            className={`p-1.5 rounded transition-colors duration-150 ${
              displayOptions.showMomentPhotos
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Afficher/masquer les photos des moments"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          {/* Séparateur */}
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
          
          {/* Menu Tri */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center space-x-1 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
            >
              <span>Tri</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            
            {showSortMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-48 z-50">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-150">
                  📅 Chronologique
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-150">
                  🎲 Aléatoire
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-150">
                  ⭐ Richesse
                </button>
              </div>
            )}
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
          {/* Actions spécifiques Memories : aucune pour l'instant */}
        </OverflowMenu>
      </div>
      
    </div>
  );
}