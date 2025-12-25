/**
 * PhotoGridHeader.jsx v2.26j - Boutons Tag/Session/Lien réorganisés
 * En-tête pour la section "Photos du moment"
 *
 * ⭐ v2.26j : Ajout bouton Session + Réorganisation : Tag, Session, Lien
 * ⭐ v2.26j : Apparence bouton Tag cohérente avec posts/moments
 * ⭐ v2.21b4 : Chevron à l'extrême gauche (comme posts)
 * ⭐ v2.21b4 : Badge pastille discret (📸25 en gris)
 *
 * Fonctionnalités :
 * - Toggle affichage photos
 * - Compteur photos en pastille
 * - Bouton tag (thèmes)
 * - Bouton session (créer/voir causeries)
 * - Bouton lier (si mode sélection global)
 */

import React, { memo, useCallback } from 'react';
import { ChevronDown, Tag, Link, MessageCircle } from 'lucide-react';
import { generatePhotoMomentKey } from '../../../utils/themeUtils.js';
import { getSessionsForContent } from '../../../utils/sessionUtils.js';

export const PhotoGridHeader = memo(({
  moment,
  isOpen,
  onToggle,
  activePhotoGrid,
  onActivateSelection,
  onCancelSelection,
  selectionMode,
  onContentSelected,
  sessions,        // ⭐ v2.26j : Pour badge session
  onShowSessions,  // ⭐ v2.26j : Pour créer/voir sessions
  onCreateSessionFromContent  // ⭐ v2.26j : Pour créer session
}) => {

  const gridId = `moment_${moment.id}_day`;
  const isSelectionActive = activePhotoGrid === gridId;

  // ⭐ v2.26j : Badge thème pour photoGrid (comme moment/post)
  const photoGridKey = generatePhotoMomentKey(moment.id);
  const gridThemes = window.themeAssignments?.getThemesForContent(photoGridKey) || [];
  const hasThemes = gridThemes.length > 0;

  // ⭐ v2.26j : Sessions liées à cette photoGrid
  const linkedSessions = getSessionsForContent(sessions, 'photoGrid', moment.id);
  const sessionCount = linkedSessions.length;

  // ⭐ v2.26j : Handler tag (ouvrir modal thème)
  const handleTag = useCallback((e) => {
    e.stopPropagation();

    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(
        photoGridKey,
        'photoGrid',
        gridThemes,
        {
          moment: moment,
          momentId: moment.id,
          momentTitle: moment.displayTitle,
          photoCount: moment.dayPhotoCount
        }
      );
    }
  }, [photoGridKey, gridThemes, moment]);

  // ⭐ v2.26j : Handler session (créer ou voir liste)
  const handleShowSessions = useCallback((e) => {
    e.stopPropagation();
    if (sessionCount === 0) {
      // Aucune session → Créer directement
      // Utiliser première photo comme représentant
      const firstPhoto = moment.dayPhotos?.[0];
      if (firstPhoto && onCreateSessionFromContent) {
        onCreateSessionFromContent(firstPhoto, 'photo');
      }
    } else {
      // Sessions existantes → Voir liste
      if (onShowSessions) {
        onShowSessions('photoGrid', moment.id, `Album ${moment.displayTitle}`);
      }
    }
  }, [sessionCount, moment, onShowSessions, onCreateSessionFromContent]);

  return (
    <div
      className="mb-2 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/30"
      data-photogrid-header
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg transition-colors group"
      >
        {/* Gauche : Chevron + Badge pastille + Titre */}
        <div className="flex items-center gap-x-2 flex-1 min-w-0">
          {/* ⭐ v2.21b4 : Chevron à l'extrême gauche (comme posts) */}
          <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />

          {/* ⭐ v2.21b4 : Badge pastille discret */}
          <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded flex-shrink-0">
            📸{moment.dayPhotoCount}
          </span>

          {/* Titre */}
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate flex-1">
            {moment.displayTitle}
          </h4>
        </div>

        {/* ⭐ v2.26j : Boutons à droite - Ordre : Tag, Session, Lien */}
        <div className="flex items-center gap-x-2 flex-shrink-0 ml-2">

          {/* 1️⃣ Badge Tag */}
          <button
            onClick={handleTag}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              hasThemes
                ? 'bg-yellow-50 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
            title="Thèmes"
          >
            <Tag className="w-4 h-4" />
            {hasThemes && <span className="text-xs font-bold">{gridThemes.length}</span>}
          </button>

          {/* 2️⃣ Badge Sessions */}
          <button
            onClick={handleShowSessions}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              sessionCount > 0
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'
                : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
            title={sessionCount > 0 ? `${sessionCount} causerie(s)` : "Créer une causerie"}
          >
            <MessageCircle className="w-4 h-4" />
            {sessionCount > 0 && <span className="text-xs font-bold">{sessionCount}</span>}
          </button>

          {/* 3️⃣ Bouton lier (si mode sélection global) */}
          {selectionMode?.active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // ⭐ v2.27 : Lier l'album photo complet (type photoGrid)
                onContentSelected?.(moment, 'photoGrid');
              }}
              className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-400 dark:hover:bg-purple-800 rounded transition-colors"
              title="Lier cet album"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
        </div>
      </button>
    </div>
  );
});

PhotoGridHeader.displayName = 'PhotoGridHeader';

export default PhotoGridHeader;