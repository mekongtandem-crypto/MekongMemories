/**
 * FlatContentList.jsx v2.11 - Mode "en vrac"
 * Affiche le contenu de tous les moments sans leurs en-têtes
 *
 * Utilisé quand le toggle ✨ Moments est désactivé
 * Affiche posts et photos selon les filtres actifs (📷🗒️🖼️)
 */

import React, { memo } from 'react';
import PostArticle from '../post/PostArticle.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';

export const FlatContentList = memo(({
  moments,
  displayOptions,
  sessions,
  isElementVisible,  // ⭐ v2.11 : Fonction de visibilité des filtres
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
  onShowSessions,
  onCreateSessionFromContent,
  editionMode
}) => {

  const shouldShowDayPhotos = isElementVisible?.('day_photos') ?? true;

  // Collecter tout le contenu de tous les moments
  const allContent = [];

  moments.forEach(moment => {
    // Ajouter les posts (filtrés individuellement dans PostArticle)
    if (moment.posts && moment.posts.length > 0) {
      moment.posts.forEach((post, index) => {
        allContent.push({
          type: 'post',
          key: `post_${moment.id}_${post.id || index}`,
          component: (
            <PostArticle
              key={`post_${moment.id}_${post.id || index}`}
              post={post}
              moment={moment}
              displayOptions={displayOptions}
              isElementVisible={isElementVisible}
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
          )
        });
      });
    }

    // Ajouter les photos d'album (si filtre 📷 actif)
    if (shouldShowDayPhotos && moment.dayPhotos && moment.dayPhotos.length > 0) {
      allContent.push({
        type: 'photos',
        key: `photos_${moment.id}`,
        component: (
          <div key={`photos_${moment.id}`} className="mt-3">
            <PhotoGrid
              photos={moment.dayPhotos}
              moment={moment}
              onPhotoClick={onPhotoClick}
              allPhotos={moment.dayPhotos}
              gridId={`flat_moment_${moment.id}_day`}
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
          </div>
        )
      });
    }
  });

  return (
    <div className="space-y-3 px-3">
      {allContent.map(item => item.component)}

      {allContent.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Aucun contenu à afficher avec les filtres actuels</p>
        </div>
      )}
    </div>
  );
});

FlatContentList.displayName = 'FlatContentList';

export default FlatContentList;
