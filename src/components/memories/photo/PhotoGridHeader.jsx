/**
 * PhotoGridHeader.jsx v7.0
 * En-tête pour la section "Photos du moment"
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
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold text-gray-800 text-sm">
            {moment.dayPhotoCount} Photo{moment.dayPhotoCount > 1 ? 's' : ''} de "{moment.displayTitle}"
          </h4>
        </div>
        
        {/* Boutons à droite */}
        <div className="flex items-center space-x-2 mr-2">
          
          {/* Bouton toggle tagging multiple */}
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
                ? 'bg-yellow-100 text-yellow-600'
                : 'text-yellow-600 hover:bg-yellow-50'
            }`}
            title={
              isSelectionActive
                ? "Annuler sélection"
                : "Sélectionner photos pour tagging"
            }
          >
            <Tag className="w-4 h-4" />
          </button>
          
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
              className="p-1.5 bg-gray-100 text-purple-600 border border-gray-300 hover:bg-purple-50 rounded transition-colors"
              title="Lier une photo de ce moment"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* ChevronDown */}
        <ChevronDown className={`w-4 h-4 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>
    </div>
  );
});

PhotoGridHeader.displayName = 'PhotoGridHeader';

export default PhotoGridHeader;
