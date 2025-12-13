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
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.15c

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

  // ⭐ v2.15c : Accès Context pour détecter état global DP
  const { state, computed } = useMemoriesDisplay();
  const allPhotoGridIds = state.counts.allPhotoGridIds || [];
  const photosAllExpanded = computed.allPhotoGridsExpanded(allPhotoGridIds.length);

  // ⭐ v2.17 : SÉPARATION AFFICHAGE / DÉPLOIEMENT PhotoGrid
  // AFFICHAGE (Icône 📸 locale) : Contrôle la visibilité du HEADER PhotoGrid
  // DÉPLOIEMENT (Texte "X photos" local) : Contrôle la visibilité de la GRILLE
  const imagesFilterActive = isElementVisible?.('day_photos') ?? true; // AP global

  // ⭐ v2.17 : Header PhotoGrid visible ?
  // Requis : AP=1 (filtre Images global ON) ET localDisplay.showDayPhotos (affichage local ON)
  const shouldShowDayPhotosHeader = moment.dayPhotoCount > 0 && imagesFilterActive && localDisplay.showDayPhotos;

  // ⭐ v2.17 : Grille PhotoGrid visible ?
  // Requis : Header visible ET grille déployée
  const isPhotoGridExpanded = computed.isPhotoGridExpanded(moment.id);
  const shouldShowDayPhotosGrid = shouldShowDayPhotosHeader && isPhotoGridExpanded;

  // ⭐ v2.15n : Posts - Filtres globaux s'appliquent TOUJOURS - FIX re-renders excessifs
  const hasVisiblePosts = useMemo(() => {
    if (!localDisplay.showPosts || !moment?.posts || !Array.isArray(moment.posts) || moment.posts.length === 0) {
      return false;
    }

    // ⭐ v2.15n : Vérifier si AU MOINS un post a du contenu visible selon filtres globaux
    // Important : Cette logique DOIT matcher exactement PostArticle.jsx ligne 114-116
    const isVracMode = !state.contentFilters.structure; // ← state.contentFilters au lieu de computed
    const localOverride = localDisplay.showPosts;

    return moment.posts.some(post => {
      const hasText = post?.content?.trim();
      const hasPhotos = post?.photos?.length > 0;

      // ⭐ v2.15i : Appliquer EXACTEMENT la même logique que PostArticle (avec localOverride)
      const shouldShowHeader = hasText && (isElementVisible?.('post_header') ?? true) && (isVracMode || localOverride);
      const shouldShowText = hasText && (isElementVisible?.('post_text') ?? true) && (isVracMode || localOverride);
      const shouldShowPhotos = hasPhotos && (isElementVisible?.('post_photos') ?? true) && (isVracMode || localOverride);

      return shouldShowHeader || shouldShowText || shouldShowPhotos;
    });
  }, [localDisplay.showPosts, moment?.posts, isElementVisible, state.contentFilters.structure]); // ← deps plus stables

  return (
    <div className="px-3 pb-3">

      {/* Posts (filtrés individuellement dans PostArticle) */}
      {/* ⭐ v2.15i : localOverride signal local override global + Safety check */}
      {hasVisiblePosts && moment?.posts && Array.isArray(moment.posts) && (
        <div className="space-y-2 mt-2">
          {moment.posts.map((post, index) => {
            // ⭐ v2.15i : Safety check - Skip invalid posts
            if (!post) return null;

            return (
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
            );
          })}
        </div>
      )}

      {/* ⭐ v2.17 : Header PhotoGrid - Affiché si icône locale ON */}
      {shouldShowDayPhotosHeader && (
        <div className="mt-3">
          <PhotoGridHeader
            moment={moment}
            isOpen={isPhotoGridExpanded}
            onToggle={onToggleDayPhotos}
            activePhotoGrid={activePhotoGrid}
            onActivateSelection={onActivateSelection}
            onCancelSelection={onCancelSelection}
            selectionMode={selectionMode}
            onContentSelected={onContentSelected}
          />

          {/* ⭐ v2.17 : Grille visible si déployée (texte local ON) */}
          {shouldShowDayPhotosGrid && (
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