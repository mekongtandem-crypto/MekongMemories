/**
 * SessionBadges.jsx v7.0
 * Composants de badges pour afficher le nombre de sessions liées
 * 
 * 2 variantes :
 * - SessionBadgePost : badge inline pour post (footer)
 * - SessionBadgePhotoThumb : pastille overlay pour photo
 */

import React, { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import { getSessionsForContent } from '../../../utils/sessionUtils.js';

// ====================================================================
// Badge sessions pour Post (inline dans footer card)
// ====================================================================

export const SessionBadgePost = memo(({ 
  post, 
  momentId, 
  sessions, 
  onShowSessions, 
  onCreateSession 
}) => {
  const linkedSessions = getSessionsForContent(sessions, 'post', post.id);
  const count = linkedSessions.length;
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (count === 0) {
      onCreateSession(post, momentId, 'post');
    } else {
      onShowSessions('post', post.id, post.title || 'Article');
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
        count === 0
          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
      title={count === 0 ? 'Créer une session' : `${count} session${count > 1 ? 's' : ''}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {count > 0 && <span>{count}</span>}
    </div>
  );
});

SessionBadgePost.displayName = 'SessionBadgePost';

// ====================================================================
// Pastille sessions pour Photo thumbnail (overlay circle)
// ====================================================================

export const SessionBadgePhotoThumb = memo(({ 
  photo, 
  momentId, 
  sessions, 
  onShowSessions 
}) => {
  const linkedSessions = getSessionsForContent(
    sessions, 
    'photo', 
    photo.filename || photo.google_drive_id
  );
  const count = linkedSessions.length;
  
  if (count === 0) return null;
  
  const handleClick = (e) => {
    e.stopPropagation();
    const photoTitle = photo.filename || photo.google_drive_id || 'Photo';
    onShowSessions('photo', photo.filename || photo.google_drive_id, photoTitle);
  };
  
  return (
    <div
      onClick={handleClick}
      className="absolute top-0 right-0 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-purple-700 transition-colors z-10 cursor-pointer"
      title={`${count} session${count > 1 ? 's' : ''}`}
    >
      {count}
    </div>
  );
});

SessionBadgePhotoThumb.displayName = 'SessionBadgePhotoThumb';
