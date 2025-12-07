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

import React, { memo, useMemo } from 'react';
import PostArticle from '../post/PostArticle.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import PhotoGridHeader from '../photo/PhotoGridHeader.jsx';

export const MomentContent = memo(({
  moment,
  displayOptions,
  localDisplay,
  visibleDayPhotos,
  photosPerLoad,
  isElementVisible,  // ⭐ v2.11 : Fonction de visibilité des filtres
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

  // ⭐ v2.14u : Photos d'album - Filtres globaux s'appliquent TOUJOURS
  // Logique correcte: isElementVisible(day_photos) ET localDisplay.showDayPhotos
  const shouldShowDayPhotos = (isElementVisible?.('day_photos') ?? true) && localDisplay.showDayPhotos;

  // ⭐ v2.14u : Posts - Filtres globaux s'appliquent TOUJOURS
  const hasVisiblePosts = useMemo(() => {
    if (!localDisplay.showPosts || !moment.posts || moment.posts.length === 0) {
      return false;
    }

    // ⭐ v2.14u : Vérifier si AU MOINS un post a du contenu visible selon filtres globaux
    return moment.posts.some(post => {
      const hasText = post.content?.trim();
      const hasPhotos = post.photos?.length > 0;

      // ⭐ v2.14u : Appliquer filtres globaux (comme dans PostArticle)
      const shouldShowHeader = hasText && (isElementVisible?.('post_header') ?? true);
      const shouldShowText = hasText && (isElementVisible?.('post_text') ?? true);
      const shouldShowPhotos = hasPhotos && (isElementVisible?.('post_photos') ?? true);

      return shouldShowHeader || shouldShowText || shouldShowPhotos;
    });
  }, [localDisplay.showPosts, moment.posts, isElementVisible]);

  return (
    <div className="px-3 pb-3">

      {/* Posts (filtrés individuellement dans PostArticle) */}
      {/* ⭐ v2.14 : localOverride signal local override global */}
      {hasVisiblePosts && (
        <div className="space-y-2 mt-2">
          {moment.posts.map((post, index) => (
            <PostArticle
              key={`${moment.id}_${post.id || index}`}
              post={post}
              moment={moment}
              displayOptions={displayOptions}
              isElementVisible={isElementVisible}
              localOverride={localDisplay.showPosts}
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

          {/* ⭐ v2.14 : Fond subtil pour distinguer grille photos du texte */}
          {localDisplay.showDayPhotos && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MomentContent.displayName = 'MomentContent';

export default MomentContent;