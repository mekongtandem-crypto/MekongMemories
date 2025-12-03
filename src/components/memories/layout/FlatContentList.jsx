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

  // ⭐ v2.11 : Collecter les données (pas le JSX prérendu)
  const allContent = [];

  moments.forEach(moment => {
    // Ajouter les posts (données uniquement) - AVEC filtrage selon visibilité
    if (moment.posts && moment.posts.length > 0) {
      moment.posts.forEach((post, index) => {
        // ⭐ v2.11 : Vérifier si le post a du contenu visible selon filtres
        const hasText = post.content?.trim();
        const hasImages = post.photos?.length > 0;
        const shouldShowText = hasText && (isElementVisible?.('post_text') ?? true);
        const shouldShowImages = hasImages && (isElementVisible?.('post_images') ?? true);

        // Ne pas ajouter le post si rien à afficher
        if (!shouldShowText && !shouldShowImages) {
          return; // Skip ce post
        }

        allContent.push({
          type: 'post',
          key: `post_${moment.id}_${post.id || index}`,
          data: { post, moment, index }
        });
      });
    }

    // Ajouter les photos d'album (si filtre 📷 actif)
    if (shouldShowDayPhotos && moment.dayPhotos && moment.dayPhotos.length > 0) {
      allContent.push({
        type: 'photos',
        key: `photos_${moment.id}`,
        data: { moment }
      });
    }
  });

  return (
    <div className="space-y-3 px-3">
      {allContent.map(item => {
        if (item.type === 'post') {
          const { post, moment } = item.data;
          return (
            <PostArticle
              key={item.key}
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
          );
        } else if (item.type === 'photos') {
          const { moment } = item.data;
          return (
            <div key={item.key} className="mt-3">
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
          );
        }
        return null;
      })}

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
