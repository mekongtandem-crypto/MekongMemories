/**
 * MomentCard.jsx v7.1 Darkmode
 * Carte moment complète (wrapper)
 * 
 * Gère :
 * - État local localDisplay (showPosts, showDayPhotos)
 * - Pagination photos (visibleDayPhotos)
 * - Reset au collapse
 */

import React, { useState, useEffect, useRef, memo, forwardRef } from 'react';
import MomentHeader from './MomentHeader.jsx';
import MomentContent from './MomentContent.jsx';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.14

export const MomentCard = memo(forwardRef(({
  moment,
  isSelected,
  isExplored,
  matchesFilter,
  displayOptions,
  isElementVisible,  // ⭐ v2.11 : Fonction de visibilité des filtres
  onSelect,
  onPhotoClick,
  onCreateSession,
  activePhotoGrid,
  selectedPhotos,
  onActivateSelection,
  onTogglePhotoSelection,
  onBulkTagPhotos,
  onCancelSelection,
  isFromChat,
  onOpenPhotoContextMenu,
  selectionMode,
  onContentSelected,
  sessions,
  onShowSessions,
  onCreateSessionFromContent,
  editionMode  // ⭐ v2.9n3 : Recevoir editionMode
}, ref) => {

  // ⭐ v2.14 : Accès au Context (remplace polling)
  const { state, computed, actions } = useMemoriesDisplay();

  const [visibleDayPhotos, setVisibleDayPhotos] = useState(30);
  const photosPerLoad = 30;

  // ⭐ v2.17 : Utiliser directement contentFilters du Context (pas displayOptions)
  const [localDisplay, setLocalDisplay] = useState({
    showPosts: state.contentFilters.textes,
    showDayPhotos: state.contentFilters.images
  });

  // ⭐ v2.17 : Reset états locaux quand filtres globaux changent
  useEffect(() => {
    setLocalDisplay(prev => ({
      ...prev,
      showPosts: state.contentFilters.textes,
      showDayPhotos: state.contentFilters.images
    }));
  }, [state.contentFilters.textes, state.contentFilters.images]);
  
  const wasSelectedRef = useRef(isSelected);
  
  // Reset affichage si on ferme le moment
  useEffect(() => {
    if (wasSelectedRef.current && !isSelected) {
      setLocalDisplay({
        showPosts: false,
        showDayPhotos: false
      });
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected]);

  // ⭐ v2.15m : Synchroniser showDayPhotos avec Context - FIX boucle infinie
  useEffect(() => {
    if (isSelected) {
      const isExpanded = computed.isPhotoGridExpanded(moment.id);
      setLocalDisplay(prev => {
        if (prev.showDayPhotos !== isExpanded) {
          return { ...prev, showDayPhotos: isExpanded };
        }
        return prev;
      });
    }
  }, [moment.id, isSelected, state.expanded.photoGrids.size]); // ← state.expanded.photoGrids au lieu de computed

  const handleOpenWith = (options) => {
    if (!isSelected) {
      onSelect(moment);
    }
    setLocalDisplay(options);
  };

  // ⭐ v2.17 : SÉPARATION Affichage / Déploiement (indépendants)
  // Icône locale → change SEULEMENT l'affichage (localDisplay)
  const handleToggleAffichage = (key) => {
    setLocalDisplay(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Texte local → change SEULEMENT le déploiement (expanded dans Context)
  const handleToggleDeploiement = (contentType) => {
    if (contentType === 'posts') {
      // Toggle tous les posts de ce moment
      const postIds = moment.posts?.map(p => p.id) || [];
      postIds.forEach(postId => {
        const postKey = `${moment.id}_${postId}`;
        actions.toggleExpanded('posts', postKey);
      });
    } else if (contentType === 'photos') {
      // Toggle la grille photos de ce moment
      actions.toggleExpanded('photoGrids', moment.id);
    }
  };

  return (
    <div 
      ref={ref} 
      id={moment.id}
      data-filtered={matchesFilter ? 'true' : 'false'}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 ${
        isSelected ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
          onToggleAffichage={handleToggleAffichage}
          onToggleDeploiement={handleToggleDeploiement}
          selectionMode={selectionMode}
          onContentSelected={onContentSelected}
          sessions={sessions}
          onShowSessions={onShowSessions}
          editionMode={editionMode}
        />
      </div>
      
      {isSelected && (
        <MomentContent
          moment={moment}
          displayOptions={displayOptions}
          localDisplay={localDisplay}
          visibleDayPhotos={visibleDayPhotos}
          photosPerLoad={photosPerLoad}
          isElementVisible={isElementVisible}
          onPhotoClick={onPhotoClick}
          onCreateSession={onCreateSession}
          onLoadMorePhotos={() => setVisibleDayPhotos(prev => prev + photosPerLoad)}
          onToggleDayPhotos={() => handleToggleDeploiement('photos')}
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
          editionMode={editionMode}
        />
      )}
    </div>
  );
}));

MomentCard.displayName = 'MomentCard';

export default MomentCard;