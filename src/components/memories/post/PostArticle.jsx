/**
 * PostArticle.jsx v7.1 Dark Mode
 * Article Mastodon complet
 * 
 * Structure :
 * - Header (titre, toggle photos, badges)
 * - Texte (si displayOptions.showPostText)
 * - Photos (si toggle ON et photos présentes)
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Tag, Link, Image as ImageIcon } from 'lucide-react';
import { SessionBadgePost } from '../shared/SessionBadges.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import { generatePostKey } from '../../../utils/themeUtils.js';

export const PostArticle = memo(({ 
  post, 
  moment, 
  displayOptions, 
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
  sessions, 
  onShowSessions, 
  onCreateSessionFromContent
}) => {
  
  const [showThisPostPhotos, setShowThisPostPhotos] = useState(displayOptions.showPostPhotos);

  useEffect(() => {
    setShowThisPostPhotos(displayOptions.showPostPhotos);
  }, [displayOptions.showPostPhotos]);

  const contentParts = post.content ? post.content.trim().split('\n') : [];
  const title = contentParts.shift() || `Article du jour ${post.dayNumber}`;
  const body = contentParts.filter(part => part.trim() !== '').join('<br />');

  const handleTagPost = useCallback((e) => {
    e.stopPropagation();
    const postKey = generatePostKey(post);
    const currentThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
    
    // Préparer les données du post
    const postData = {
      post: post,
      postTitle: post.content?.split('\n')[0] || `Article du jour ${post.dayNumber}`,
      photoCount: post.photos?.length || 0
    };
    
    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(
        postKey, 
        'post', 
        currentThemes,
        postData
      );
    }
  }, [post]);

  const postKey = generatePostKey(post);
  const postThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
  const hasThemes = postThemes.length > 0;

  const hasPhotos = post.photos && post.photos.length > 0;
  const photosAreVisible = showThisPostPhotos && hasPhotos;

  return (
    <div className="mt-2" data-post-id={post.id}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 border-b border-gray-200 dark:border-gray-600">
          
          {/* Gauche : Titre + indicateur photos inline */}
          <div className="flex items-center gap-x-3 flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate flex-1">
              {title}
            </h4>
            
            {hasPhotos && (
              <button 
                onClick={() => setShowThisPostPhotos(!showThisPostPhotos)} 
                className="p-1 flex-shrink-0"
                title="Afficher/Masquer les photos"
              >
                <div className="flex items-center space-x-1 text-xs text-grey-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  <ImageIcon className={`w-4 h-4 transition-colors ${
                    showThisPostPhotos ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <span className={`font-medium transition-colors ${
                    showThisPostPhotos ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>{post.photos.length}</span>
                </div>
              </button>
            )}
          </div>
          
          {/* Droite : Badges */}
          <div className="flex items-center gap-x-2 flex-shrink-0 ml-2">
            
            {/* Badge Tag */}
            <button 
              onClick={handleTagPost} 
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                hasThemes 
                  ? 'bg-yellow-50 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800' 
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500'
              }`}
              title="Thèmes"
            >
              <Tag className="w-4 h-4" />
              {hasThemes && <span className="text-xs font-bold">{postThemes.length}</span>}
            </button>
            
            {/* Badge Sessions */}
            <SessionBadgePost 
              post={post} 
              momentId={moment.id} 
              sessions={sessions}
              onShowSessions={onShowSessions}
              onCreateSession={onCreateSessionFromContent}
            />
            
            {/* Bouton lier (si mode sélection) */}
            {selectionMode?.active && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentSelected?.(post, 'post');
                }}
                className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-400 dark:hover:bg-purple-800 rounded transition-colors"
                title="Lier cet article"
              >
                <Link className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Texte */}
        {displayOptions.showPostText && (
          <div 
            className="prose prose-sm max-w-none bg-white dark:bg-gray-800 p-3 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: body }} 
          />
        )}
      </div>

      {/* Photos */}
      {photosAreVisible && (
        <div className="mt-2">
          <PhotoGrid 
            photos={post.photos}
            moment={moment}
            onPhotoClick={onPhotoClick}
            allPhotos={post.photos}
            onPhotoClick={(photo) => {
  onPhotoClick(photo, post.photos, moment);
}}
            gridId={`post_${post.id}`}
            activePhotoGrid={activePhotoGrid}
            selectedPhotos={selectedPhotos}
            onActivateSelection={onActivateSelection}
            onTogglePhotoSelection={onTogglePhotoSelection}
            onBulkTagPhotos={onBulkTagPhotos}
            onCancelSelection={onCancelSelection}
            selectionMode={selectionMode}
            onContentSelected={onContentSelected}
            sessions={sessions}
            onShowSessions={onShowSessions}
          />
        </div>
      )}
    </div>
  );
});

PostArticle.displayName = 'PostArticle';

export default PostArticle;