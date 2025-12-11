/**
 * PostArticle.jsx v7.2i - Filtres de contenu additifs + FIX React #300
 * Article Mastodon complet
 *
 * ⭐ v2.11 : Filtres strictes
 * - 🗒️ Textes : Affiche seulement le texte (masque photos)
 * - 🖼️ Images : Affiche seulement les photos (masque texte)
 * - Les deux : Affiche tout
 * - Aucun : Masque complètement le post
 *
 * ⭐ v2.15h : Décoder entités HTML (emojis)
 * ⭐ v2.15i : Safety checks pour éviter React #300
 *
 * Structure :
 * - Header (titre, toggle photos, badges)
 * - Texte (si filtre textes actif)
 * - Photos (si filtre images actif ET toggle ON)
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { Tag, Link, Image as ImageIcon, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionBadgePost } from '../shared/SessionBadges.jsx';
import PhotoGrid from '../photo/PhotoGrid.jsx';
import { generatePostKey } from '../../../utils/themeUtils.js';
import { useMemoriesDisplay } from '../context/MemoriesDisplayContext.jsx';  // ⭐ v2.14

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

  // ⭐ v2.15i : Safety check - Prevent React #300
  if (!post || !moment) {
    console.warn('⚠️ [PostArticle] Missing required props:', { post: !!post, moment: !!moment });
    return null;
  }

  // ⭐ v2.14 : Accès au Context (remplace polling)
  const { state, computed, actions } = useMemoriesDisplay();
  const imagesFilterActive = state.contentFilters.images;  // ⭐ v2.14 : Pour griser badge

  // ⭐ v2.15c : Détecter état global DP pour logique volet/grille
  const allPhotoGridIds = state.counts.allPhotoGridIds || [];
  const photosAllExpanded = computed.allPhotoGridsExpanded(allPhotoGridIds.length);

  const [showThisPostPhotos, setShowThisPostPhotos] = useState(displayOptions.showPostPhotos);

  // ⭐ v2.14s : État local post expansion (synchronisé avec Context)
  const [isPostExpanded, setIsPostExpanded] = useState(() => {
    const postKey = generatePostKey(post);
    return computed.isPostExpanded(postKey);
  });

  useEffect(() => {
    setShowThisPostPhotos(displayOptions.showPostPhotos);
  }, [displayOptions.showPostPhotos]);

  // ⭐ v2.14s : Synchroniser post expansion avec Context (zero polling!)
  useEffect(() => {
    const postKey = generatePostKey(post);
    const expanded = computed.isPostExpanded(postKey);  // ✅ FIX v2.14s: Utiliser generatePostKey pour cohérence
    setIsPostExpanded(expanded);
  }, [post.id, computed]);

  // ⭐ v2.14s : Synchroniser photos posts avec Context (comme MomentCard)
  useEffect(() => {
    if (isPostExpanded && post.photos?.length > 0) {
      const photoGridId = `post_${post.id}`;
      const isExpanded = computed.isPhotoGridExpanded(photoGridId);
      setShowThisPostPhotos(isExpanded);
    }
  }, [post.id, post.photos?.length, isPostExpanded, computed]);

  const contentParts = post.content ? post.content.trim().split('\n') : [];

  // ⭐ v2.15h : Décoder entités HTML dans le titre (pour emojis et caractères spéciaux)
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  // ⭐ v2.8e : Pour Note de photos (user_added), utiliser post.title si présent
  const rawTitle = post.title
    ? post.title
    : (contentParts.shift() || `Article du jour ${post.dayNumber}`);

  const title = decodeHTML(rawTitle);

  // ⭐ v2.8e : Pour Note de photos, afficher tout le content (pas de split)
  const body = post.title
    ? post.content
    : contentParts.filter(part => part.trim() !== '').join('<br />');

  // ⭐ v2.14t : Vérifier visibilité - Filtres globaux ET condition locale
  const hasText = post.content?.trim();
  const hasPhotos = post.photos?.length > 0;

  const isVracMode = !computed.isStructureMode;

  // ⭐ v2.14t : Logique correcte - Filtres globaux s'appliquent TOUJOURS
  // Mode Vrac (AM=0): visible si filtre ON
  // Mode Structure (AM=1): visible si filtre ON ET moment ouvert (localOverride)
  const shouldShowHeader = hasText && (isElementVisible?.('post_header') ?? true) && (isVracMode || localOverride);
  const shouldShowText = hasText && (isElementVisible?.('post_text') ?? true) && (isVracMode || localOverride);
  const shouldShowPhotos = hasPhotos && (isElementVisible?.('post_photos') ?? true) && (isVracMode || localOverride);

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

  const postKey = generatePostKey(post);
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
        /* ⭐ v2.11 : Avec texte, afficher le cadre normal */
        <div className={`border rounded-lg overflow-hidden ${
          isPhotoNote
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

            {/* ⭐ v2.15j : Badge photos - TOUJOURS visible et cliquable */}
            {hasPhotos && (
              <div className="flex items-center space-x-0.5 text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 flex-shrink-0">
                {/* Icône = Toggle volet (toujours cliquable) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const photoGridId = `post_${post.id}`;
                    // ⭐ v2.15j : Toggle volet + activer filtre Images si nécessaire
                    if (!imagesFilterActive) {
                      actions.toggleContentFilter('images');
                    }
                    actions.toggleExpanded('photoGrids', photoGridId);
                  }}
                  title="Afficher/Masquer les photos"
                  className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
                >
                  <ImageIcon className={`w-4 h-4 transition-colors ${
                    imagesFilterActive && showThisPostPhotos
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`} />
                </button>

                {/* Texte = Scroll vers photos (toujours cliquable) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // ⭐ v2.15j : Activer filtres + ouvrir volet si nécessaire, puis scroll
                    const photoGridId = `post_${post.id}`;
                    if (!imagesFilterActive) {
                      actions.toggleContentFilter('images');
                    }
                    if (!showThisPostPhotos) {
                      actions.toggleExpanded('photoGrids', photoGridId);
                    }
                    // Scroll après un court délai pour laisser le DOM se mettre à jour
                    setTimeout(() => {
                      const photoElement = document.querySelector(`[data-photo-grid-id="${photoGridId}"]`);
                      if (photoElement) {
                        photoElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }, 100);
                  }}
                  title="Aller aux photos"
                  className="px-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
                >
                  <span className={`font-medium transition-colors ${
                    imagesFilterActive && showThisPostPhotos
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
              <div
                className="prose prose-sm max-w-none bg-white dark:bg-gray-800 p-3 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: body }}
              />
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