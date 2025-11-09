/**
 * MomentContent.jsx v7.1 DarkMode
 * Contenu du moment (affiché si isSelected)
 * 
 * Contient :
 * - Liste des posts (si localDisplay.showPosts)
 * - Section photos moment avec header (si photos présentes)
 */

import React, { memo } from 'react';
import PostArticle from '../post/PostArticle.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import PhotoGridHeader from '../photo/PhotoGridHeader.jsx';

export const MomentContent = memo(({ 
  moment,
  displayOptions,
  localDisplay,
  visibleDayPhotos,
  photosPerLoad,
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
  onCreateSessionFromContent
}) => {
  
  return (
    <div className="px-3 pb-3">
      
      {/* Posts */}
      {localDisplay.showPosts && moment.posts && moment.posts.length > 0 && (
        <div className="space-y-2 mt-2">
          {moment.posts.map((post, index) => (
            <PostArticle
              key={post.id || index}
              post={post}
              moment={moment}
              displayOptions={displayOptions}
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
            />
          ))}
        </div>
      )}
      
      {/* Photos moment */}
      {moment.dayPhotoCount > 0 && (
        <div className="mt-3">
          <PhotoGridHeader
            moment={moment}
            isOpen={localDisplay.showDayPhotos}
            onToggle={onToggleDayPhotos}
            activePhotoGrid={activePhotoGrid}
            onActivateSelection={onActivateSelection}
            onCancelSelection={onCancelSelection}
            selectionMode={selectionMode}
            onContentSelected={onContentSelected}
          />
          
          {localDisplay.showDayPhotos && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
});

MomentContent.displayName = 'MomentContent';

export default MomentContent;