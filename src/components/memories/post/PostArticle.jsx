/**
 * PostArticle.jsx v2.19d - Bordure bleue pour posts ouverts
 * Article Mastodon complet
 *
 * ⭐ v2.19d : Bordure bleue claire quand post ouvert/sélectionné
 * ⭐ v2.17 : SIMPLIFICATION - Calculs directs depuis Context
 *
 * ⭐ Filtres d'affichage :
 * - 🗒️ Textes (AT) : Affiche texte
 * - 📸 Images (AP) : Affiche photos
 * - Mode spécial AM=0 AT=0 : DT contrôle photos de posts
 *
 * Structure :
 * - Header (titre, toggle photos, badges)
 * - Texte (si filtre textes actif)
 * - Photos (si filtre images actif ET toggle ON)
 */

import React, { memo, useCallback } from 'react';
import { Tag, Link, Image as ImageIcon, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionBadgePost } from '../shared/SessionBadges.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import { generatePostKey } from '../../../utils/themeUtils.js';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.14
import { renderHTMLContentWithYouTube } from '../../../utils/linkUtils.js';  // ⭐ v2.26c

export const PostArticle = memo(({
  post,
  moment,
  displayOptions,
  isElementVisible,  // ⭐ v2.11 : Fonction de visibilité des filtres
  localOverride,     // ⭐ v2.14 : Local override global (dernier qui parle gagne)
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
  onCreateSessionFromContent,
  editionMode  // ⭐ v2.9o : Recevoir editionMode
}) => {

  // ⭐ v2.17 : SIMPLIFICATION - Supprimer états locaux redondants
  // Safety check AVANT hooks (React rules)
  if (!post || !moment) {
    console.warn('⚠️ [PostArticle] Missing required props:', { post: !!post, moment: !!moment });
    return null;
  }

  // ⭐ v2.17 : Accès au Context - Source unique de vérité
  const { state, computed, actions } = useMemoriesDisplay();
  const imagesFilterActive = state.contentFilters.images;

  // ⭐ v2.17 : États calculés directement depuis Context (plus d'états locaux !)
  const postKey = generatePostKey(post);
  const isPostExpanded = computed.isPostExpanded(postKey);  // Contenu visible
  const isPostSelected = computed.isPostSelected(postKey);  // ⭐ v2.19g : Cadre bleu (sélection)
  const photoGridId = `post_${post.id}`;
  const showThisPostPhotos = computed.isPhotoGridExpanded(photoGridId);

  // ⭐ v2.15c : État global DP pour logique volet/grille
  const allPhotoGridIds = state.counts.allPhotoGridIds || [];
  const photosAllExpanded = computed.allPhotoGridsExpanded(allPhotoGridIds.length);

  const contentParts = post.content ? post.content.trim().split('\n') : [];

  // ⭐ v2.17f : Décodage HTML simple pour contenu (garde émojis intacts)
  const decodeHTML = (html) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  // ⭐ v2.8e : Pour Note de photos (user_added), utiliser post.title si présent
  // ⭐ v2.17f : post.title déjà décodé par MastodonData.js → ne PAS décoder à nouveau
  const title = post.title
    ? post.title  // Déjà décodé → utiliser directement
    : decodeHTML(contentParts.shift() || `Article du jour ${post.dayNumber}`);

  // ⭐ v2.8e : Pour Note de photos, afficher tout le content (pas de split)
  // Le body reste en HTML pour être affiché avec dangerouslySetInnerHTML
  const body = post.title
    ? post.content
    : contentParts.filter(part => part.trim() !== '').join('<br />');

  // ⭐ v2.14t : Vérifier visibilité - Filtres globaux ET condition locale
  const hasText = post.content?.trim();
  const hasPhotos = post.photos?.length > 0;

  const isVracMode = !computed.isStructureMode;

  // ⭐ v2.17 : Logique correcte - Override local en mode Structure
  // Mode Vrac (AM=0): visible si filtre global ON
  // Mode Structure (AM=1): visible si état local ON (indépendant du global!)
  const shouldShowHeader = hasText && (isVracMode ? (isElementVisible?.('post_header') ?? true) : localOverride);
  const shouldShowText = hasText && (isVracMode ? (isElementVisible?.('post_text') ?? true) : localOverride);
  const shouldShowPhotos = hasPhotos && (isVracMode ? (isElementVisible?.('post_photos') ?? true) : localOverride);

  // ⭐ v2.26f : Calculer si les photos sont effectivement affichées (pour état visuel bouton)
  const arePhotosActuallyVisible = shouldShowPhotos && (photosAllExpanded || showThisPostPhotos);

  // 🔍 DEBUG v2.13 : Log pour diagnostiquer React #310
  if (!post.id) {
    console.warn('⚠️ [PostArticle] Post sans ID:', {
      momentId: moment.id,
      postIndex: moment.posts?.indexOf(post),
      hasText,
      hasPhotos,
      shouldShowHeader,
      shouldShowText,
      shouldShowPhotos
    });
  }

  // Si rien à afficher, masquer complètement
  if (!shouldShowHeader && !shouldShowText && !shouldShowPhotos) {
    return null;
  }

  const handleTagPost = useCallback((e) => {
    e?.stopPropagation();  // ⭐ v2.11 : Empêcher toggle du volet
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

  // ⭐ postKey déjà déclaré ligne 63 (éviter duplication)
  const postThemes = window.themeAssignments?.getThemesForContent(postKey) || [];
  const hasThemes = postThemes.length > 0;

  // ⭐ v2.8e : Distinction visuelle Note de photo (jaune) vs Post Mastodon (gris/bleu)
  const isPhotoNote = post.category === 'user_added';

  // ⭐ v2.11 : Mode photos seules (sans header ni texte)
  const photosOnlyMode = !shouldShowHeader && !shouldShowText && shouldShowPhotos;

  return (
    <div className="mt-2" data-post-id={post.id}>
      {/* ⭐ v2.11 : Si seulement photos, afficher sans cadre */}
      {photosOnlyMode && (
        <div className="p-2">
          <PhotoGrid
            photos={post.photos}
            moment={moment}
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
            editionMode={editionMode}
          />
        </div>
      )}

      {/* ⭐ v2.11 : Mode normal avec cadre (header et/ou texte) */}
      {!photosOnlyMode && (
        /* ⭐ v2.19d : Bordure bleue claire si post ouvert */
        <div className={`border-2 rounded-lg overflow-hidden transition-colors ${
          isPostSelected
            ? 'border-blue-300 dark:border-blue-600'  // ⭐ v2.19g : Post SÉLECTIONNÉ → bordure bleue claire
            : isPhotoNote
              ? 'border-amber-200 dark:border-amber-700'
              : 'border-gray-200 dark:border-gray-700'
        }`}>

        {/* ⭐ v2.11 : Header visible si filtre posts actif (cliquable comme volet) */}
        {shouldShowHeader && (
          <div
            onClick={() => {
              // ⭐ v2.14s : Toggle via Context avec generatePostKey pour cohérence
              const postKey = generatePostKey(post);
              actions.toggleExpanded('posts', postKey);
            }}
            className={`flex justify-between items-center p-2 border-b cursor-pointer hover:opacity-80 transition-opacity ${
            isPhotoNote
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}>

          {/* Gauche : Chevron + Titre + indicateur photos inline */}
          <div className="flex items-center gap-x-2 flex-1 min-w-0">
            {/* Chevron expansion */}
            {isPostExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            )}

            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate flex-1">
              {title}
            </h4>

            {/* ⭐ v2.15o : Badge photos - Icône=Affichage, Texte=Déploiement+Scroll */}
            {/* Les boutons globaux commandent tous les boutons locaux correspondants */}
            {hasPhotos && (
              <div className="flex items-center space-x-0.5 text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
                {/* Icône = AFFICHAGE grille (comme AP global) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const photoGridId = `post_${post.id}`;
                    actions.toggleExpanded('photoGrids', photoGridId);
                  }}
                  title="Afficher/Masquer la grille photos"
                  className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
                >
                  <ImageIcon className={`w-4 h-4 transition-colors ${
                    arePhotosActuallyVisible
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </button>

                {/* Texte = DÉPLOIEMENT grille (comme DP global) + scroll si déplie */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const photoGridId = `post_${post.id}`;
                    const wasOpen = showThisPostPhotos;

                    // Toggle déploiement
                    actions.toggleExpanded('photoGrids', photoGridId);

                    // Scroll seulement si on vient de déplier (wasOpen=false → devient true)
                    if (!wasOpen) {
                      setTimeout(() => {
                        const photoElement = document.querySelector(`[data-photo-grid-id="${photoGridId}"]`);
                        if (photoElement) {
                          photoElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }, 100);
                    }
                  }}
                  title="Déplier/Plier et aller aux photos"
                  className="px-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
                >
                  <span className={`font-medium transition-colors ${
                    arePhotosActuallyVisible
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>{post.photos.length}</span>
                </button>
              </div>
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

            {/* ⭐ v2.9 : Boutons édition (seulement si mode édition + category='user_added') */}
            {editionMode?.active && post.category === 'user_added' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.memoriesPageActions?.editPost(post, moment.id);
                  }}
                  className="p-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
                  title="Modifier cette note"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.memoriesPageActions?.deletePost(moment.id, post.id, post.title || 'Note de photo');
                  }}
                  className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
                  title="Effacer cette note de la mémoire"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        )}

        {/* ⭐ v2.13 : Contenu du post - FIX React #300 : Ne rendre que si quelque chose à afficher */}
        {isPostExpanded && (shouldShowText || (shouldShowHeader && shouldShowPhotos && showThisPostPhotos)) && (
          <>
            {/* Texte (si filtre textes actif) */}
            {shouldShowText && (
              <div className="prose prose-sm max-w-none bg-white dark:bg-gray-800 p-3 dark:text-gray-100">
                {renderHTMLContentWithYouTube(body)}
              </div>
            )}

            {/* ⭐ v2.15c : Photos si DP=déplié OU toggle ON */}
            {shouldShowHeader && shouldShowPhotos && (photosAllExpanded || showThisPostPhotos) && (
          <div className="p-2">
            <PhotoGrid
              photos={post.photos}
              moment={moment}
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
              editionMode={editionMode}
            />
          </div>
        )}
          </>
        )}
        </div>
      )}
    </div>
  );
});

PostArticle.displayName = 'PostArticle';

export default PostArticle;