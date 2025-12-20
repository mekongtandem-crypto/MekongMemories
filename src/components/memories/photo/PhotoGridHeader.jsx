/**
 * PhotoGridHeader.jsx v2.19d - Couleur vert (comme bouton AP)
 * En-tête pour la section "Photos du moment"
 *
 * ⭐ v2.19d : Fond vert (comme bouton Images TopBar)
 * ⭐ v2.19 : Icône tag à droite
 *
 * Fonctionnalités :
 * - Toggle affichage photos
 * - Compteur photos
 * - Bouton sélection bulk (tagging)
 * - Bouton lier (si mode sélection global)
 */

import React, { memo } from 'react';
import { ChevronDown, Tag, Link } from 'lucide-react';

export const PhotoGridHeader = memo(({
  moment,
  isOpen,
  onToggle,
  activePhotoGrid,
  onActivateSelection,
  onCancelSelection,
  selectionMode,
  onContentSelected
}) => {

  const gridId = `moment_${moment.id}_day`;
  const isSelectionActive = activePhotoGrid === gridId;

  return (
    <div className="mb-2 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-green-100 dark:hover:bg-green-800/40 rounded-lg transition-colors group"
      >
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            📸{moment.dayPhotoCount} {moment.displayTitle}
          </h4>
        </div>

        {/* Boutons à droite */}
        <div className="flex items-center space-x-2">
          {/* Bouton lier (si mode sélection global) */}
          {selectionMode?.active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Lier la première photo du moment comme représentant
                const firstPhoto = moment.dayPhotos?.[0];
                if (firstPhoto) {
                  onContentSelected?.(firstPhoto, 'photo');
                }
              }}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 text-purple-600 dark:text-purple-400 border border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
              title="Lier une photo de ce moment"
            >
              <Link className="w-4 h-4" />
            </button>
          )}

          {/* ChevronDown */}
          <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />

          {/* ⭐ v2.19 : Bouton tag déplacé à droite (après chevron) */}
          <button
            onClick={(e) => {
              e.stopPropagation();

              // Toggle : si déjà actif, annuler
              if (isSelectionActive) {
                onCancelSelection();
              } else {
                onActivateSelection(gridId);
              }
            }}
            className={`p-1.5 rounded transition-colors ${
              isSelectionActive
                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                : 'text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
            }`}
            title={
              isSelectionActive
                ? "Annuler sélection"
                : "Sélectionner photos pour tagging"
            }
          >
            <Tag className="w-4 h-4" />
          </button>
        </div>
      </button>
    </div>
  );
});

PhotoGridHeader.displayName = 'PhotoGridHeader';

export default PhotoGridHeader;