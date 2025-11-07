/**
 * ContentBadges.jsx v7.0
 * Badges droite des en-têtes : 🏷️ Thèmes, 💬 Chat, 🔗 Liens
 * 
 * Utilisable pour :
 * - En-tête Moment
 * - En-tête Post
 * - En-tête Photos Moment
 */

import React, { memo } from 'react';
import { Tag, MessageCircle, Link } from 'lucide-react';

const ContentBadges = memo(({ 
  contentKey,
  contentType,
  currentThemes = [],
  sessionCount = 0,
  linkCount = 0,
  onOpenTheme,
  onOpenSessions,
  onOpenLinks
}) => {
  
  return (
    <div className="flex items-center gap-2">
      
      {/* Badge Thèmes */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenTheme?.();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          currentThemes.length > 0
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={currentThemes.length > 0 ? 'Modifier thèmes' : 'Assigner thèmes'}
      >
        <Tag className="w-3.5 h-3.5" />
        {currentThemes.length > 0 && <span>{currentThemes.length}</span>}
      </button>
      
      {/* Badge Sessions/Chat */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenSessions?.();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          sessionCount > 0
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={sessionCount > 0 ? `${sessionCount} session${sessionCount > 1 ? 's' : ''}` : 'Créer une session'}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {sessionCount > 0 && <span>{sessionCount}</span>}
      </button>
      
      {/* Badge Liens */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenLinks?.();
        }}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          linkCount > 0
            ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={linkCount > 0 ? `${linkCount} lien${linkCount > 1 ? 's' : ''}` : 'Aucun lien'}
      >
        <Link className="w-3.5 h-3.5" />
        {linkCount > 0 && <span>{linkCount}</span>}
      </button>
      
    </div>
  );
});

ContentBadges.displayName = 'ContentBadges';

export default ContentBadges;
