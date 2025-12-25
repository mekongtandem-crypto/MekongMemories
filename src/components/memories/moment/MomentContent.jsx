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

  // ⭐ v2.17d : SÉPARATION AFFICHAGE / DÉPLOIEMENT PhotoGrid
  // AFFICHAGE (Icône 📸 locale) : Contrôle la visibilité du HEADER PhotoGrid
  // DÉPLOIEMENT (Texte "X photos" local) : Contrôle la visibilité de la GRILLE
  const imagesFilterActive = isElementVisible?.('day_photos') ?? true; // AP global
  const isVracMode = !state.contentFilters.structure;  // AM=0
  const textesOff = !state.contentFilters.textes;       // AT=0

  // ⭐ v2.17d : Header PhotoGrid visible ?
  // Mode Structure (AM=1) : Override local prime → visible si localDisplay.showDayPhotos (indépendant AP global)
  // Mode Vrac (AM=0) : Dépend des filtres globaux AP
  const shouldShowDayPhotosHeader = moment.dayPhotoCount > 0 &&
    (isVracMode ? imagesFilterActive : localDisplay.showDayPhotos);

  // ⭐ v2.17d : Grille PhotoGrid visible ?
  // Requis : Header visible OU (règle spéciale : AM=0 ET AT=0 ET AP=1 ET DP=1)
  const isPhotoGridExpanded = computed.isPhotoGridExpanded(moment.id);
  const specialVracPhotoMode = isVracMode && textesOff && imagesFilterActive && isPhotoGridExpanded;
  const shouldShowDayPhotosGrid = (shouldShowDayPhotosHeader && isPhotoGridExpanded) || specialVracPhotoMode;

  // ⭐ v2.17e : Posts - Override local indépendant en mode Structure
  const hasVisiblePosts = useMemo(() => {
    if (!moment?.posts || !Array.isArray(moment.posts) || moment.posts.length === 0) {
      return false;
    }

    // ⭐ v2.17e : Mode Structure → Override local prime (indépendant AT global)
    // Mode Vrac → Filtres globaux s'appliquent
    const localOverride = localDisplay.showPosts;

    // Mode Structure : visible si localDisplay.showPosts = true
    // Mode Vrac : visible si AT=1 global OU postPhotosOnlyMode=true (afficher photos de posts seulement)
    if (isVracMode) {
      // Mode Vrac : dépend du filtre global Textes OU mode PhotoDePost
      const textesOn = state.contentFilters.textes;
      const photoDePostMode = state.postPhotosOnlyMode;
      if (!textesOn && !photoDePostMode) return false;
    } else {
      // Mode Structure : dépend de l'override local
      if (!localOverride) return false;
    }

    return moment.posts.some(post => {
      const hasText = post?.content?.trim();
      const hasPhotos = post?.photos?.length > 0;

      // ⭐ v2.17e : En mode Structure, localOverride suffit (pas besoin de vérifier isElementVisible)
      const shouldShowHeader = hasText && (isVracMode ? (isElementVisible?.('post_header') ?? true) : localOverride);
      const shouldShowText = hasText && (isVracMode ? (isElementVisible?.('post_text') ?? true) : localOverride);
      const shouldShowPhotos = hasPhotos && (isVracMode ? (isElementVisible?.('post_photos') ?? true) : localOverride);

      return shouldShowHeader || shouldShowText || shouldShowPhotos;
    });
  }, [localDisplay.showPosts, moment?.posts, isElementVisible, state.contentFilters.structure, state.contentFilters.textes, state.postPhotosOnlyMode, isVracMode]);

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

      {/* ⭐ v2.17d : Header PhotoGrid - Affiché si icône locale ON (mode Structure) */}
      {shouldShowDayPhotosHeader && !specialVracPhotoMode && (
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
            sessions={sessions}
            onShowSessions={onShowSessions}
            onCreateSessionFromContent={onCreateSessionFromContent}
          />

          {/* ⭐ v2.17d : Grille visible si déployée (texte local ON) */}
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

      {/* ⭐ v2.17d : RÈGLE SPÉCIALE - Mode Vrac (AM=0) + Textes OFF (AT=0) + Images ON (AP=1) + DP=1 */}
      {/* → Afficher grille PhotoGrid SANS header */}
      {specialVracPhotoMode && (
        <div className="mt-3">
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
        </div>
      )}
    </div>
  );
});

MomentContent.displayName = 'MomentContent';

export default MomentContent;