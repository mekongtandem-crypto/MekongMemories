/**
 * MomentsList.jsx v7.1 Dark mode
 * Liste de moments avec logique de filtrage
 * 
 * Forward toutes les props vers MomentCard
 */

import React, { memo } from 'react';
import MomentCard from '../moment/MomentCard.jsx';

export const MomentsList = memo(({
  moments,
  selectedMoments,       // ⭐ v2.19g : Sélection individuelle (cadre bleu)
  expandedMoments,       // ⭐ v2.19g : Contenu visible (global + individuel)
  displayOptions,
  momentFilter,
  sessions,
  isElementVisible,  // ⭐ v2.11 : Fonction de visibilité des filtres
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
  onCreateSessionFromContent,
  editionMode,           // ⭐ v2.9n3 : Recevoir editionMode
  newMemories,           // ⭐ v2.25 : Liste nouveaux souvenirs
  firstNewMemoryRef      // ⭐ v2.25 : Ref pour scroll auto
}) => {
  
  return (
    <div className="space-y-3">
      {moments.map((moment) => {
        const isExplored = sessions?.some(s => s.gameId === moment.id);
        const matchesFilter = momentFilter === 'all' ||
          (momentFilter === 'unexplored' && !isExplored) ||
          (momentFilter === 'with_posts' && moment.posts?.length > 0) ||
          (momentFilter === 'with_photos' && moment.dayPhotoCount > 0);

        // ⭐ v2.25 : Vérifier si c'est le premier nouveau souvenir
        const isFirstNewMemory = newMemories && newMemories.length > 0 && moment.id === newMemories[0].id;

        return (
          <MomentCard
            key={moment.id}
            moment={moment}
            isSelected={selectedMoments.some(m => m.id === moment.id)}  // ⭐ v2.19g : Cadre bleu
            isExpanded={expandedMoments.some(m => m.id === moment.id)}  // ⭐ v2.19g : Contenu visible
            isExplored={isExplored}
            matchesFilter={matchesFilter}
            displayOptions={displayOptions}
            isElementVisible={isElementVisible}
            onSelect={onMomentSelect}
            onPhotoClick={onPhotoClick}
            onCreateSession={onCreateSession}
            ref={el => {
              momentRefs.current[moment.id] = el;
              // ⭐ v2.25 : Attacher aussi firstNewMemoryRef si premier nouveau
              if (isFirstNewMemory && firstNewMemoryRef) {
                firstNewMemoryRef.current = el;
              }
            }}
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
            editionMode={editionMode}
          />
        );
      })}
    </div>
  );
});

MomentsList.displayName = 'MomentsList';

export default MomentsList;