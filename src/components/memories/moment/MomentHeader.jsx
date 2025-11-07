/**
 * MomentHeader.jsx v7.0
 * En-tête du moment avec :
 * - Titre et sous-titre (jours)
 * - Chevron pour ouvrir/fermer
 * - Compteurs posts/photos (cliquables)
 * - Badges droite (thèmes, sessions, lien)
 */

import React, { memo, useCallback } from 'react';
import { 
  ChevronDown, FileText, Camera, MapPin, Tag, Link, MessageCircle
} from 'lucide-react';
import { generateMomentKey, getMomentChildrenKeys } from '../../../utils/themeUtils.js';
import { getSessionsForContent } from '../../../utils/sessionUtils.js';

export const MomentHeader = memo(({ 
  moment, 
  isSelected, 
  isExplored, 
  onSelect, 
  onOpenWith, 
  onCreateSession, 
  localDisplay, 
  onToggleLocal,
  selectionMode, 
  onContentSelected,
  sessions, 
  onShowSessions
}) => {
  
  // Badge moment : UNIQUEMENT le moment lui-même
  const momentKey = generateMomentKey(moment);
  const momentThemes = window.themeAssignments?.getThemesForContent(momentKey) || [];
  const hasMomentThemes = momentThemes.length > 0;
  
  // Sessions liées au moment
  const linkedSessions = getSessionsForContent(sessions, 'moment', moment.id);
  const sessionCount = linkedSessions.length;
  
  // Handler pour tagger le moment
  const handleTagMoment = useCallback((e) => {
    e.stopPropagation();
    
    const childrenKeys = getMomentChildrenKeys(moment);
    
    // Stats pour le modal
    const stats = {
      postCount: childrenKeys.posts.length,
      photoMastodonCount: childrenKeys.postPhotos.length,
      photoMomentCount: childrenKeys.momentPhotos.length,
      totalCount: childrenKeys.all.length
    };
    
    // Ouvrir modal avec données moment
    if (window.memoriesPageActions?.openThemeModal) {
      window.memoriesPageActions.openThemeModal(
        momentKey,
        'moment',
        momentThemes,
        {
          moment: moment,
          momentId: moment.id,
          momentTitle: moment.displayTitle,
          contentKeys: childrenKeys.all,
          stats: stats
        }
      );
    }
  }, [moment, momentKey, momentThemes]);
  
  const handleLinkClick = useCallback((e, contentType) => {
    e.stopPropagation();
    if (!isSelected) {
      if (contentType === 'posts') {
        onOpenWith({ showPosts: true, showDayPhotos: false });
      } else if (contentType === 'photos') {
        onOpenWith({ showPosts: false, showDayPhotos: true });
      }
    } else {
      onToggleLocal(contentType === 'posts' ? 'showPosts' : 'showDayPhotos');
    }
  }, [isSelected, onOpenWith, onToggleLocal]);
  
  const handleChevronClick = useCallback(() => {
    if (!isSelected) {
      onOpenWith({ showPosts: true, showDayPhotos: true });
    } else {
      onSelect(moment);
    }
  }, [isSelected, onOpenWith, onSelect, moment]);

  const handleShowSessions = useCallback((e) => {
    e.stopPropagation();
    if (sessionCount === 0) {
      // Aucune session → Créer directement
      onCreateSession(moment, moment);
    } else {
      // Sessions existantes → Voir liste
      onShowSessions('moment', moment.id, moment.displayTitle);
    }
  }, [sessionCount, moment, onCreateSession, onShowSessions]);

  return (
    <>
      {/* Titre principal */}
      <div 
        onClick={handleChevronClick}
        className="cursor-pointer flex items-start justify-between"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="px-2 py-1 rounded-lg font-bold text-xs bg-gray-100 text-gray-800">
              {moment.displaySubtitle}
            </div>
            <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
              {moment.displayTitle}
            </h3>
          </div>
          
          {moment.location && (
            <span className="flex items-center text-xs text-gray-500 mt-1.5 ml-1">
              <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
              {moment.location}
            </span>
          )}
        </div>
        
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
          isSelected ? 'rotate-180' : ''
        }`} />
      </div>

      {/* Compteurs + Badges */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mt-2 pt-0 border-t border-gray-100">
        
        {/* Compteurs cliquables */}
        {moment.postCount > 0 && (
          <button
            onClick={(e) => handleLinkClick(e, 'posts')}
            className="flex items-center font-medium text-blue-600 hover:text-blue-700 transition-all"
          >
            <FileText className={`w-4 h-4 mr-1.5 ${localDisplay.showPosts ? 'text-blue-600' : 'text-gray-400'}`} /> 
            {moment.postCount} post{moment.postCount > 1 ? 's' : ''}
          </button>
        )}
        
        {moment.dayPhotoCount > 0 && (
          <button
            onClick={(e) => handleLinkClick(e, 'photos')}
            className="flex items-center font-medium text-green-600 hover:text-green-700 transition-all"
          >
            <Camera className={`w-4 h-4 mr-1.5 ${localDisplay.showDayPhotos ? 'text-green-600' : 'text-gray-400'}`} /> 
            {moment.dayPhotoCount} photo{moment.dayPhotoCount > 1 ? 's' : ''}
          </button>
        )}
        
        {/* Badges à droite */}
        <div className="ml-auto flex items-center space-x-2 flex-shrink-0">
          
          {/* Badge thèmes */}
          <button
            onClick={handleTagMoment}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              hasMomentThemes 
                ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title="Thèmes"
          >
            <Tag className="w-4 h-4" />
            {hasMomentThemes && <span className="text-xs font-bold">{momentThemes.length}</span>}
          </button>
          
          {/* Badge sessions */}
          <button
            onClick={handleShowSessions}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              sessionCount === 0 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
            title={sessionCount === 0 ? 'Créer une session' : `${sessionCount} session${sessionCount > 1 ? 's' : ''} - Cliquer pour voir`}
          >
            <MessageCircle className="w-4 h-4" />
            {sessionCount > 0 && <span>{sessionCount}</span>}
          </button>
          
          {/* Bouton lier (si mode sélection) */}
          {selectionMode?.active && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContentSelected?.(moment, 'moment');
              }}
              className="p-1.5 bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-400 rounded transition-colors"
              title="Lier ce moment"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
        </div>
      </div> 
    </>
  );
});

MomentHeader.displayName = 'MomentHeader';

export default MomentHeader;
