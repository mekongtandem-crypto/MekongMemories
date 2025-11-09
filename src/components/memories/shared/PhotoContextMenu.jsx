/**
 * PhotoContextMenu.jsx v7.1 Dark mode
 * Menu contextuel (clic droit) sur photo
 * 
 * Actions disponibles :
 * - Voir en grand
 * - Assigner thèmes
 * - Envoyer au chat (si isFromChat)
 */

import React, { memo } from 'react';
import { ZoomIn, Tag } from 'lucide-react';

export const PhotoContextMenu = memo(({ 
  photo, 
  position, 
  onViewFull, 
  onAttachToChat, 
  onAssignThemes, 
  onClose,
  isFromChat 
}) => {
  return (
    <div 
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-44">
        <button
          onClick={onViewFull}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-900 dark:text-gray-100"
        >
          <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span>Voir en grand</span>
        </button>
        
        <button
          onClick={onAssignThemes}
          className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center space-x-2 text-yellow-600 dark:text-yellow-500"
        >
          <Tag className="w-4 h-4" />
          <span>Thèmes</span>
        </button>
        
        {isFromChat && (
          <button
            onClick={onAttachToChat}
            className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center space-x-2 text-amber-600 dark:text-amber-500 border-t border-gray-200 dark:border-gray-700"
          >
            <span className="text-base">📎</span>
            <span className="font-medium">Envoyer au chat</span>
          </button>
        )}
      </div>
    </div>
  );
});

PhotoContextMenu.displayName = 'PhotoContextMenu';

export default PhotoContextMenu;