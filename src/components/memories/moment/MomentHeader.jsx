/**
 * MomentHeader.jsx v7.1
 * En-tête du moment avec :
 * - Titre et sous-titre (jours)
 * - Chevron pour ouvrir/fermer
 * - Compteurs posts/photos (cliquables)
 * - Badges droite (thèmes, sessions, lien)
 */

import React, { memo, useCallback } from 'react';
import {
  ChevronDown, FileText, Camera, MapPin, Tag, Link, MessageCircle, FileEdit, Edit, Trash2
} from 'lucide-react';
import { generateMomentKey, getMomentChildrenKeys } from '../../../utils/themeUtils.js';
import { getSessionsForContent } from '../../../utils/sessionUtils.js';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.14

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
  onShowSessions,
  editionMode  // ⭐ v2.9n3 : Recevoir editionMode comme prop
}) => {

  // ⭐ v2.14 : Context pour filtres globaux (masquer badges selon filtres)
  const { state } = useMemoriesDisplay();
  const showTextBadges = state.contentFilters.textes;   // Filtre "Textes" ON → afficher badges posts
  const showImageBadges = state.contentFilters.images;  // Filtre "Images" ON → afficher badges photos

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
  
  // ⭐ v2.15k : Toggle volet LOCAL uniquement (PAS le filtre global !)
  const handleToggleVolet = useCallback((e, contentType) => {
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

  // ⭐ v2.15k : Scroll vers contenu (ouvre volet si besoin, PAS le filtre global !)
  const handleScrollToContent = useCallback((e, contentType) => {
    e.stopPropagation();
    const voletOpen = contentType === 'posts' ? localDisplay.showPosts : localDisplay.showDayPhotos;

    // Ouvrir moment + volet si nécessaire
    if (!isSelected) {
      if (contentType === 'posts') {
        onOpenWith({ showPosts: true, showDayPhotos: false });
      } else {
        onOpenWith({ showPosts: false, showDayPhotos: true });
      }
    } else if (!voletOpen) {
      onToggleLocal(contentType === 'posts' ? 'showPosts' : 'showDayPhotos');
    }

    // Scroll après mise à jour DOM
    setTimeout(() => {
      const targetSelector = contentType === 'posts' ? '[data-post-id]' : `[data-photo-grid-id="${moment.id}"]`;
      const element = document.querySelector(`#${moment.id} ${targetSelector}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  }, [isSelected, onOpenWith, onToggleLocal, localDisplay, moment.id]);
  
  // ⭐ v2.14 : Auto-open photos SEULEMENT si filtre Images ON
  const handleChevronClick = useCallback(() => {
    if (!isSelected) {
      onOpenWith({
        showPosts: true,
        showDayPhotos: showImageBadges  // ⭐ v2.14 : Conditionnel selon filtre global
      });
    } else {
      onSelect(moment);
    }
  }, [isSelected, onOpenWith, onSelect, moment, showImageBadges]);

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
            <div className="px-2 py-1 rounded-lg font-bold text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {moment.displaySubtitle}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
              {moment.displayTitle}
            </h3>
          </div>
          
          {moment.location && (
            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
              <MapPin className="w-3 h-3 mr-1.5 text-gray-400 dark:text-gray-500" />
              {moment.location}
            </span>
          )}
        </div>
        
        <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ml-2 ${
          isSelected ? 'rotate-180' : ''
        }`} />
      </div>

      {/* Compteurs + Badges */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm mt-2 pt-0 border-t border-gray-100 dark:border-gray-700">

        {/* Compteurs cliquables - ⭐ v2.8e : Séparation posts Mastodon / Note de photos */}

        {/* ⭐ v2.15k : Badges - Icône=volet, Texte=contenu (volet ouvert/fermé) */}
        {/* 🗒️ Posts Mastodon (bleu) */}
        {moment.mastodonPostCount > 0 && (
          <div className="flex items-center gap-0.5 text-sm">
            {/* Icône = Volet ouvert/fermé */}
            <button
              onClick={(e) => handleToggleVolet(e, 'posts')}
              title="Afficher/Masquer le volet posts"
              className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            >
              <FileText className={`w-4 h-4 transition-colors ${
                localDisplay.showPosts
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
            </button>
            {/* Texte = Contenu visible (volet ouvert/fermé) */}
            <button
              onClick={(e) => handleScrollToContent(e, 'posts')}
              title="Aller aux posts"
              className={`font-medium hover:underline transition-colors ${
                localDisplay.showPosts
                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {moment.mastodonPostCount} post{moment.mastodonPostCount > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* 📝 Note de photos (jaune/amber) */}
        {moment.noteCount > 0 && (
          <div className="flex items-center gap-0.5 text-sm">
            {/* Icône = Volet ouvert/fermé */}
            <button
              onClick={(e) => handleToggleVolet(e, 'posts')}
              title="Afficher/Masquer le volet notes"
              className="p-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
            >
              <FileEdit className={`w-4 h-4 transition-colors ${
                localDisplay.showPosts
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
            </button>
            {/* Texte = Contenu visible (volet ouvert/fermé) */}
            <button
              onClick={(e) => handleScrollToContent(e, 'posts')}
              title="Aller aux notes"
              className={`font-medium hover:underline transition-colors ${
                localDisplay.showPosts
                  ? 'text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {moment.noteCount} note{moment.noteCount > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* 📸 Photos (vert) */}
        {moment.dayPhotoCount > 0 && (
          <div className="flex items-center gap-0.5 text-sm">
            {/* Icône = Volet ouvert/fermé */}
            <button
              onClick={(e) => handleToggleVolet(e, 'photos')}
              title="Afficher/Masquer le volet photos"
              className="p-1 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
            >
              <Camera className={`w-4 h-4 transition-colors ${
                localDisplay.showDayPhotos
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`} />
            </button>
            {/* Texte = Contenu visible (volet ouvert/fermé) */}
            <button
              onClick={(e) => handleScrollToContent(e, 'photos')}
              title="Aller aux photos"
              className={`font-medium hover:underline transition-colors ${
                localDisplay.showDayPhotos
                  ? 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {moment.dayPhotoCount} photo{moment.dayPhotoCount > 1 ? 's' : ''}
            </button>
          </div>
        )}
        
        {/* Badges à droite */}
        <div className="ml-auto flex items-center space-x-2 flex-shrink-0">
          
          {/* Badge thèmes */}
          <button
            onClick={handleTagMoment}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
              hasMomentThemes 
                ? 'bg-yellow-50 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                : 'bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-400'
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
              className="p-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-400 dark:hover:bg-purple-800 rounded transition-colors"
              title="Lier ce moment"
            >
              <Link className="w-4 h-4" />
            </button>
          )}

          {/* ⭐ v2.9 : Boutons édition (seulement si mode édition + source='imported') */}
          {editionMode?.active && moment.source === 'imported' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.memoriesPageActions?.editMoment(moment);
                }}
                className="p-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
                title="Modifier ce moment"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.memoriesPageActions?.deleteMoment(moment);
                }}
                className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                title="Effacer ce souvenir de la mémoire"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div> 
    </>
  );
});

MomentHeader.displayName = 'MomentHeader';

export default MomentHeader;