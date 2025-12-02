/**
 * MomentContent.jsx v7.2 - Filtres de contenu additifs
 * Contenu du moment (affiché si isSelected)
 *
 * ⭐ v2.11 : Filtres de contenu
 * - Posts affichés selon leurs propres filtres (textes/images)
 * - Photos d'album affichées seulement si filtre 📷 actif
 *
 * Contient :
 * - Liste des posts (filtrés par PostArticle)
 * - Section photos moment avec header (si filtre photos actif)
 */

import React, { memo } from 'react';
import PostArticle from '../post/PostArticle.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import PhotoGridHeader from '../photo/PhotoGridHeader.jsx';
import { useMemoriesFilters } from '../hooks/useMemoriesFilters.js';

export const MomentContent = memo(({
  moment,
  displayOptions,
  localDisplay,
  visibleDayPhotos,
  photosPerLoad,
  onPhotoClick,
  onCreateSession,
  onLoadMorePhotos,
  onToggleDayPhotos,
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
  editionMode  // ⭐ v2.9o : Recevoir editionMode pour posts et photos
}) => {

  // ⭐ v2.11 : Hook pour vérifier visibilité selon filtres
  const { isElementVisible } = useMemoriesFilters();

  // ⭐ v2.11 : Vérifier si photos d'album doivent être affichées
  const shouldShowDayPhotos = isElementVisible('day_photos');

  return (
    <div className="px-3 pb-3">

      {/* Posts (filtrés individuellement dans PostArticle) */}
      {localDisplay.showPosts && moment.posts && moment.posts.length > 0 && (
        <div className="space-y-2 mt-2">
          {moment.posts.map((post, index) => (
            <PostArticle
              key={post.id || index}
              post={post}
              moment={moment}
              displayOptions={displayOptions}
              onPhotoClick={onPhotoClick}
              onCreateSession={onCreateSession}
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
          ))}
        </div>
      )}

      {/* ⭐ v2.11 : Photos moment (seulement si filtre 📷 actif) */}
      {shouldShowDayPhotos && moment.dayPhotoCount > 0 && (
        <div className="mt-3">
          <PhotoGridHeader
            moment={moment}
            isOpen={localDisplay.showDayPhotos}
            onToggle={onToggleDayPhotos}
            activePhotoGrid={activePhotoGrid}
            onActivateSelection={onActivateSelection}
            onCancelSelection={onCancelSelection}
            selectionMode={selectionMode}
            onContentSelected={onContentSelected}
          />

          {localDisplay.showDayPhotos && (
            <>
              <PhotoGrid
                photos={moment.dayPhotos.slice(0, visibleDayPhotos)}
                moment={moment}
                onPhotoClick={onPhotoClick}
                allPhotos={moment.dayPhotos}
                gridId={`moment_${moment.id}_day`}
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
                editionMode={editionMode}
              />
              
              {visibleDayPhotos < moment.dayPhotoCount && (
                <div className="text-center mt-3">
                  <button 
                    onClick={onLoadMorePhotos}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                  >
                    Afficher {Math.min(photosPerLoad, moment.dayPhotoCount - visibleDayPhotos)} de plus
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

MomentContent.displayName = 'MomentContent';

export default MomentContent;