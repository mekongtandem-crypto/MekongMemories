/**
 * FlatContentList.jsx v2.15h - Mode "en vrac" avec gestion DP
 * Affiche le contenu de tous les moments sans leurs en-têtes
 *
 * Utilisé quand le toggle ✨ Moments est désactivé
 * Affiche posts et photos selon les filtres actifs (📷🗒️🖼️)
 *
 * ⭐ v2.15h : Gestion volets PhotoDeMoment selon DP (déplié/replié)
 */

import React, { memo, useState } from 'react';
import PostArticle from '../post/PostArticle.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import PhotoGridHeader from '../photo/PhotoGridHeader.jsx';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.15h

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

  // ⭐ v2.15h : Accès Context pour détecter état global DP
  const { state, computed } = useMemoriesDisplay();
  const allPhotoGridIds = state.counts.allPhotoGridIds || [];
  const photosAllExpanded = computed.allPhotoGridsExpanded(allPhotoGridIds.length);

  const shouldShowDayPhotos = isElementVisible?.('day_photos') ?? true;

  // ⭐ v2.15h : État local pour gérer l'ouverture/fermeture des volets photos
  const [openPhotoGrids, setOpenPhotoGrids] = useState({});

  const handleToggleDayPhotos = (momentId) => {
    setOpenPhotoGrids(prev => ({
      ...prev,
      [momentId]: !prev[momentId]
    }));
  };

  // ⭐ v2.11 : Collecter les données (pas le JSX prérendu)
  const allContent = [];

  moments.forEach(moment => {
    // Ajouter les posts (données uniquement) - AVEC filtrage selon visibilité
    if (moment.posts && moment.posts.length > 0) {
      moment.posts.forEach((post, index) => {
        // ⭐ v2.11 : Vérifier si le post a du contenu visible selon filtres (3 boutons)
        const hasText = post.content?.trim();
        const hasPhotos = post.photos?.length > 0;
        const shouldShowHeader = hasText && (isElementVisible?.('post_header') ?? true);
        const shouldShowText = hasText && (isElementVisible?.('post_text') ?? true);
        const shouldShowPhotos = hasPhotos && (isElementVisible?.('post_photos') ?? true);

        // Ne pas ajouter le post si rien à afficher
        if (!shouldShowHeader && !shouldShowText && !shouldShowPhotos) {
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
          const isGridOpen = openPhotoGrids[moment.id] || false;

          // ⭐ v2.15h : Mode Vrac + DP logic
          // DP=0 (replié) : Afficher volet + grille conditionnelle
          // DP=1 (déplié) : Afficher grille directement (pas de volet)
          const shouldShowHeader = !photosAllExpanded;
          const shouldShowGrid = photosAllExpanded || isGridOpen;

          return (
            <div key={item.key} className="mt-3">
              {/* ⭐ v2.15h : Volet visible seulement si DP=replié */}
              {shouldShowHeader && (
                <PhotoGridHeader
                  moment={moment}
                  isOpen={isGridOpen}
                  onToggle={() => handleToggleDayPhotos(moment.id)}
                  activePhotoGrid={activePhotoGrid}
                  onActivateSelection={onActivateSelection}
                  onCancelSelection={onCancelSelection}
                  selectionMode={selectionMode}
                  onContentSelected={onContentSelected}
                />
              )}

              {/* ⭐ v2.15h : Grille visible si DP=déplié OU volet ouvert */}
              {shouldShowGrid && (
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
              )}
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
