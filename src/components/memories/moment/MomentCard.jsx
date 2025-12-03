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

  // ⭐ v2.12 : Synchroniser showDayPhotos avec état global expandedPhotoGrids
  useEffect(() => {
    const checkPhotoGridExpanded = () => {
      const expandedPhotoGrids = window.memoriesPageState?.expandedPhotoGrids;
      if (expandedPhotoGrids && isSelected) {
        const isExpanded = expandedPhotoGrids.has(moment.id);
        setLocalDisplay(prev => {
          if (prev.showDayPhotos !== isExpanded) {
            return { ...prev, showDayPhotos: isExpanded };
          }
          return prev;
        });
      }
    };

    checkPhotoGridExpanded();
    const interval = setInterval(checkPhotoGridExpanded, 200);
    return () => clearInterval(interval);
  }, [moment.id, isSelected]);

  const handleOpenWith = (options) => {
    if (!isSelected) {
      onSelect(moment);
    }
    setLocalDisplay(options);
  };

  const handleToggleLocal = (key) => {
    setLocalDisplay(prev => {
      const newValue = !prev[key];

      // ⭐ v2.12 : Synchroniser avec état global pour showDayPhotos
      if (key === 'showDayPhotos') {
        const expandedPhotoGrids = window.memoriesPageState?.expandedPhotoGrids;
        if (expandedPhotoGrids) {
          const newSet = new Set(expandedPhotoGrids);
          if (newValue) {
            newSet.add(moment.id);
          } else {
            newSet.delete(moment.id);
          }
          if (window.memoriesPageState) {
            window.memoriesPageState.expandedPhotoGrids = newSet;
          }
        }
      }

      return { ...prev, [key]: newValue };
    });
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
          onToggleLocal={handleToggleLocal}
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
          onToggleDayPhotos={() => handleToggleLocal('showDayPhotos')}
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