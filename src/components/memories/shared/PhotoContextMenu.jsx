/**
 * PhotoContextMenu.jsx v7.0
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
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-44">
        <button
          onClick={onViewFull}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
          <span>Voir en grand</span>
        </button>
        
        <button
          onClick={onAssignThemes}
          className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-50 flex items-center space-x-2 text-yellow-600"
        >
          <Tag className="w-4 h-4" />
          <span>Thèmes</span>
        </button>
        
        {isFromChat && (
          <button
            onClick={onAttachToChat}
            className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 flex items-center space-x-2 text-amber-600 border-t border-gray-200"
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
