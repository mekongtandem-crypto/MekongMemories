/**
 * MomentsList.jsx v7.0
 * Liste de moments avec logique de filtrage
 * 
 * Forward toutes les props vers MomentCard
 */

import React, { memo } from 'react';
import MomentCard from '../moment/MomentCard.jsx';

export const MomentsList = memo(({ 
  moments, 
  selectedMoments, 
  displayOptions, 
  momentFilter, 
  sessions, 
  onMomentSelect, 
  onPhotoClick, 
  onCreateSession, 
  momentRefs,
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
  onShowSessions, 
  onCreateSessionFromContent
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
            activePhotoGrid={activePhotoGrid}
            selectedPhotos={selectedPhotos}
            onActivateSelection={onActivateSelection}
            onTogglePhotoSelection={onTogglePhotoSelection}
            onBulkTagPhotos={onBulkTagPhotos}
            onCancelSelection={onCancelSelection}
            isFromChat={isFromChat}
            onOpenPhotoContextMenu={onOpenPhotoContextMenu}
            sessions={sessions}             
            onShowSessions={onShowSessions}
            selectionMode={selectionMode}
            onContentSelected={onContentSelected}
            onCreateSessionFromContent={onCreateSessionFromContent}
          />
        );
      })}
    </div>
  );
});

MomentsList.displayName = 'MomentsList';

export default MomentsList;
