/**
 * PhotoGrid.jsx v7.1 DarkMode
 * Grille responsive de photos avec :
 * - Mode sélection bulk (tagging)
 * - Mode sélection global (liens)
 * - Barre d'action (si photos sélectionnées)
 */

import React, { memo } from 'react';
import { Tag, X } from 'lucide-react';
import PhotoThumbnail from './PhotoThumbnail.jsx';

export const PhotoGrid = memo(({
  photos,
  moment,
  gridId,
  onPhotoClick,
  activePhotoGrid,
  selectedPhotos,
  onActivateSelection,
  onTogglePhotoSelection,
  onBulkTagPhotos,
  onCancelSelection,
  selectionMode,
  onContentSelected,
  sessions,
  onShowSessions,
  editionMode  // ⭐ v2.9o : Recevoir editionMode pour PhotoThumbnail
}) => {
  
  const isThisGridActive = activePhotoGrid === gridId;
  const hasSelection = isThisGridActive && selectedPhotos.length > 0;
  
  const isPhotoSelected = (photo) => {
    if (!isThisGridActive) return false;
    const photoId = photo.filename || photo.google_drive_id;
    return selectedPhotos.some(p => 
      (p.filename || p.google_drive_id) === photoId
    );
  };
  
  return (
    <div data-photo-grid-id={gridId}>
      {/* Barre d'action si photos sélectionnées */}
      {hasSelection && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} sélectionnée{selectedPhotos.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkTagPhotos}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Tagger</span>
            </button>
            <button
              onClick={onCancelSelection}
              className="p-1.5 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
              title="Annuler"
            >
              <X className="w-4 h-4 text-amber-900 dark:text-amber-200" />
            </button>
          </div>
        </div>
      )}
      
      {/* Grille photos */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {photos.map((photo, index) => (
          <PhotoThumbnail
            key={photo.google_drive_id || photo.filename || index}
            photo={photo}
            moment={moment}
            onPhotoClick={(photo) => {
  const gallery = [...photos]; // ou allPhotos selon le contexte
  onPhotoClick(photo, gallery, moment);
}}
            selectionMode={isThisGridActive}
            globalSelectionMode={selectionMode}
            isSelected={isPhotoSelected(photo)}
            onToggleSelect={onTogglePhotoSelection}
            sessions={sessions}
            onShowSessions={onShowSessions}
            onContentSelected={onContentSelected}
            editionMode={editionMode}
          />
        ))}
      </div>
    </div>
  );
});

PhotoGrid.displayName = 'PhotoGrid';

export default PhotoGrid;