/**
 * PhotoThumbnail.jsx v2.21a - Performance mobile-first
 * Thumbnail photo avec :
 * - Lazy loading adaptatif (200px mobile, 400px desktop)
 * - Placeholder flou DESKTOP ONLY (pas sur mobile)
 * - Badge sessions
 * - Mode sélection (checkbox)
 * - Mode lien (bouton lier)
 * - Overlay hover
 */

import React, { useState, useEffect, memo } from 'react';
import { Camera, AlertCircle, ZoomIn, Link, Trash2 } from 'lucide-react';
import { SessionBadgePhotoThumb } from '../shared/SessionBadges.jsx';

// ⭐ v2.21a : Limitation chargements simultanés (anti-freeze mobile)
let loadingCount = 0;
const MAX_CONCURRENT_LOADS = 15;  // Mobile-safe

export const PhotoThumbnail = memo(({
  photo,
  moment,
  onPhotoClick,
  selectionMode,
  globalSelectionMode,
  isSelected,
  onToggleSelect,
  sessions,
  onShowSessions,
  onContentSelected,
  editionMode
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [blurPlaceholder, setBlurPlaceholder] = useState(null);
  const [status, setStatus] = useState('idle');
  const [isInView, setIsInView] = useState(false);
  const imgContainerRef = React.useRef(null);

  // ⭐ v2.21a : Détection device pour paramètres adaptatifs
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const rootMargin = isMobile ? '200px' : '400px';  // Mobile: moins agressif
  const blurSize = isMobile ? 'w20' : 'w10';        // Mobile: image plus grande

  // ⭐ v2.21a : Intersection Observer adaptatif selon device
  useEffect(() => {
    if (!imgContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin,  // ⭐ v2.21a : 200px mobile, 400px desktop
        threshold: 0.01
      }
    );

    observer.observe(imgContainerRef.current);

    return () => {
      if (imgContainerRef.current) {
        observer.unobserve(imgContainerRef.current);
      }
    };
  }, [rootMargin]);

  // ⭐ v2.21a : Chargement avec limitation simultanée (anti-freeze)
  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      if (!photo || !isInView) return;

      // ⭐ v2.21a : Attendre si trop de chargements simultanés
      while (loadingCount >= MAX_CONCURRENT_LOADS) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      loadingCount++;
      setStatus('loading');

      try {
        // ⭐ v2.21a : Placeholder flou DESKTOP ONLY
        if (photo.google_drive_id && !isMobile) {
          const tinyUrl = `https://drive.google.com/thumbnail?id=${photo.google_drive_id}&sz=${blurSize}`;
          if (mounted) {
            setBlurPlaceholder(tinyUrl);
          }
        }

        // Charger image full quality
        let url;
        if (photo.google_drive_id) {
          if (window.photoDataV2) {
            url = await window.photoDataV2.resolveImageUrl(photo, true);
          } else {
            url = `https://drive.google.com/thumbnail?id=${photo.google_drive_id}&sz=w400`;
          }
        } else if (photo.url && photo.url.startsWith('http')) {
          url = photo.url;
        }

        if (mounted && url) {
          setImageUrl(url);
        } else if (mounted) {
          setStatus('error');
        }
      } catch (error) {
        console.error('Erreur chargement photo:', error);
        if (mounted) {
          setStatus('error');
        }
      } finally {
        loadingCount--;  // ⭐ v2.21a : Libérer slot
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [photo, isInView, isMobile, blurSize]);

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (selectionMode) {
      // Mode sélection bulk (pour tagging)
      onToggleSelect(photo);
    } else if (globalSelectionMode?.active) {
      // Mode sélection global (pour liens)
      onContentSelected?.(photo, 'photo');
    } else {
      // Mode normal : ouvrir viewer
      onPhotoClick(photo, moment.dayPhotos || [], moment);
    }
  };

  // ⭐ v2.9 : Bordure distinctive pour photos importées
  const isImported = photo.source === 'imported';

  return (
    <div
      ref={imgContainerRef}
      onClick={handleClick}
      data-photo-filename={photo.filename}
      className={`relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer group ${
        isSelected
          ? 'ring-2 ring-amber-500'
          : isImported
            ? 'ring-2 ring-amber-400 dark:ring-amber-500'
            : ''
      }`}
    >
      {/* Checkbox visible uniquement en mode sélection bulk */}
      {selectionMode && (
        <div 
          className="absolute top-1 left-1 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(photo);
          }}
        >
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-amber-500 border-amber-600' 
              : 'bg-white/80 border-gray-400'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
      
      {/* Pastille Link (si mode sélection global) */}
      {globalSelectionMode?.active && !selectionMode && (
        <button
          className="absolute top-1 right-1 z-10 w-6 h-6 bg-purple-300 hover:bg-purple-400 border-1 border-white rounded-full flex items-center justify-center shadow-lg transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onContentSelected?.(photo, 'photo');
          }}
          title="Lier cette photo"
        >
          <Link className="w-4 h-4 text-purple-800" />
        </button>
      )}

      {/* ⭐ v2.9o : Bouton suppression (seulement si mode édition + source='imported') */}
      {/* ⭐ v2.9s : Pastille en BAS à droite (différencier des pastilles lien en haut) */}
      {editionMode?.active && photo.source === 'imported' && !selectionMode && !globalSelectionMode?.active && (
        <button
          className="absolute bottom-1 right-1 z-10 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all group/delete"
          onClick={(e) => {
            e.stopPropagation();
            window.memoriesPageActions?.deletePhoto(moment.id, photo.google_drive_id || photo.filename, photo.filename);
          }}
          title="Effacer ce souvenir de la mémoire"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Pastille Sessions */}
      <SessionBadgePhotoThumb 
        photo={photo} 
        momentId={moment.id} 
        sessions={sessions}
        onShowSessions={onShowSessions}
      />

      {/* ⭐ v2.21 : Placeholder flou progressif (LQIP) */}
      {blurPlaceholder && status !== 'loaded' && status !== 'error' && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
        />
      )}

      {/* État loading (si pas de placeholder) */}
      {status === 'loading' && !blurPlaceholder && (
        <div className="absolute inset-0 w-full h-full animate-pulse flex items-center justify-center">
          <Camera className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {/* État error */}
      {status === 'error' && (
        <div className="absolute inset-0 w-full h-full bg-red-100 dark:bg-red-900 flex items-center justify-center" title="Erreur de chargement">
          <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
      )}

      {/* ⭐ v2.21 : Image full quality par-dessus le placeholder */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={photo?.filename || 'photo de voyage'}
          className={`relative w-full h-full object-cover transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      
      {/* Overlay hover (sauf en mode sélection) */}
      {!selectionMode && status === 'loaded' && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
});

PhotoThumbnail.displayName = 'PhotoThumbnail';

export default PhotoThumbnail;