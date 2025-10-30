/**
 * LinkedContent.jsx v1.2 - Phase 19E
 * Affichage enrichi des liens dans messages
 * ⭐ NOUVEAU : Double action pour photos (🔍 Zoom + 📍 Localiser)
 */
import React, { useState, useEffect } from 'react';
import { MapPin, FileText, Image as ImageIcon, ChevronRight, ZoomIn, Navigation } from 'lucide-react';

export default function LinkedContent({ linkedContent, onOpenLocal, onNavigate, masterIndex }) {
  
  // Router selon type
  switch (linkedContent.type) {
    case 'photo':
      return <LinkedPhoto linkedContent={linkedContent} onOpenLocal={onOpenLocal} onNavigate={onNavigate} />;
    
    case 'post':
      return <LinkedPost linkedContent={linkedContent} onNavigate={onNavigate} masterIndex={masterIndex} />;
    
    case 'moment':
      return <LinkedMoment linkedContent={linkedContent} onNavigate={onNavigate} masterIndex={masterIndex} />;
    
    default:
      return <DefaultLink linkedContent={linkedContent} onNavigate={onNavigate} />;
  }
}

// ========================================
// 📷 PHOTO LIÉE (⭐ PHASE 19E : Double action)
// ========================================

function LinkedPhoto({ linkedContent, onOpenLocal, onNavigate }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadPhoto = async () => {
      try {
        console.log('📷 LinkedPhoto - Résolution avec:', {
          filename: linkedContent.id,
          google_drive_id: linkedContent.google_drive_id,
          url: linkedContent.url
        });
        
        const photoData = {
          filename: linkedContent.id,
          google_drive_id: linkedContent.google_drive_id,
          url: linkedContent.url,
          width: linkedContent.width,
          height: linkedContent.height,
          mime_type: linkedContent.mime_type,
          type: linkedContent.photoType
        };
        
        const url = await window.photoDataV2?.resolveImageUrl(photoData, true);
        
        if (isMounted) {
          if (url && !url.startsWith('data:image/svg+xml')) {
            console.log('✅ Photo résolue:', url.substring(0, 80) + '...');
            setImageUrl(url);
          } else {
            console.error('❌ URL invalide');
            setError(true);
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement photo liée:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadPhoto();
    return () => { isMounted = false; };
  }, [linkedContent]);

  if (loading) {
    return (
      <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center mb-2">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-48 h-48 bg-red-100 rounded-lg flex flex-col items-center justify-center mb-2 p-2">
        <ImageIcon className="w-8 h-8 text-red-400 mb-2" />
        <span className="text-xs text-red-600 text-center">{linkedContent.title}</span>
      </div>
    );
  }

  return (
    <div className="mb-2 relative group inline-block">
      <img
        src={imageUrl}
        alt={linkedContent.title}
        className="max-w-[200px] rounded-lg shadow-md transition-shadow"
      />
      
      {/* ⭐ NOUVEAU : Overlay avec 2 boutons */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        
        {/* 🔍 Bouton Zoom (ouvrir local) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenLocal) onOpenLocal(linkedContent);
          }}
          className="px-3 py-2 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Ouvrir ici"
        >
          <ZoomIn className="w-4 h-4" />
          <span>Zoom</span>
        </button>
        
        {/* 📍 Bouton Localiser (naviguer vers Memories) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onNavigate) onNavigate(linkedContent);
          }}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Localiser dans Mémoires"
        >
          <MapPin className="w-4 h-4" />
          <span>Localiser</span>
        </button>
        
      </div>
    </div>
  );
}

// ========================================
// 📄 POST LIÉ (Card avec preview texte)
// ========================================

function LinkedPost({ linkedContent, onNavigate, masterIndex }) {
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    if (!masterIndex?.moments) return;
    
    for (const moment of masterIndex.moments) {
      const post = moment.posts?.find(p => p.id === linkedContent.id);
      if (post) {
        setPostData({ post, moment });
        break;
      }
    }
  }, [linkedContent.id, masterIndex]);

  const handleClick = () => {
    if (onNavigate) onNavigate(linkedContent);
  };

  if (!postData) {
    return (
      <div 
        onClick={handleClick}
        className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-blue-700">{linkedContent.title}</span>
          <ChevronRight className="w-4 h-4 text-blue-400 ml-auto" />
        </div>
      </div>
    );
  }

  const { post } = postData;
  const lines = post.content?.split('\n') || [];
  const title = lines[0] || linkedContent.title;
  const preview = lines.slice(1, 4).join(' ').substring(0, 120) + (lines.slice(1).join(' ').length > 120 ? '...' : '');
  const photoCount = post.photos?.length || 0;

  return (
    <div 
      onClick={handleClick}
      className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors group"
    >
      <div className="flex items-start space-x-2">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-900 text-sm mb-1 line-clamp-1">
            {title}
          </div>
          
          {preview && (
            <div className="text-xs text-blue-700 leading-relaxed line-clamp-3">
              {preview}
            </div>
          )}
          
          {photoCount > 0 && (
            <div className="flex items-center space-x-1 mt-2 text-xs text-blue-600">
              <ImageIcon className="w-3 h-3" />
              <span>{photoCount} photo{photoCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// ========================================
// 🗺️ MOMENT LIÉ (Card texte seul)
// ========================================

function LinkedMoment({ linkedContent, onNavigate, masterIndex }) {
  const [momentData, setMomentData] = useState(null);

  useEffect(() => {
    if (!masterIndex?.moments) return;
    
    const moment = masterIndex.moments.find(m => m.id === linkedContent.id);
    if (moment) {
      setMomentData(moment);
    }
  }, [linkedContent.id, masterIndex]);

  const handleClick = () => {
    if (onNavigate) onNavigate(linkedContent);
  };

  if (!momentData) {
    return (
      <div 
        onClick={handleClick}
        className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-purple-700 line-clamp-1">{linkedContent.title}</span>
            <div className="text-xs text-purple-500 mt-1">Chargement...</div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  const postCount = momentData.posts?.length || 0;
  const dayPhotoCount = momentData.dayPhotos?.length || 0;
  const postPhotoCount = momentData.postPhotos?.length || 0;
  const photoCount = dayPhotoCount + postPhotoCount;
  
  const postTitles = (momentData.posts || [])
    .map(p => {
      const firstLine = p.content?.split('\n')[0]?.trim();
      return firstLine || 'Article sans titre';
    })
    .filter(Boolean);

  return (
    <div 
      onClick={handleClick}
      className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors group"
    >
      <div className="flex items-start space-x-2">
        <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-purple-900 text-sm mb-1 line-clamp-1">
            {linkedContent.title}
          </div>
          
          <div className="flex items-center space-x-3 text-xs text-purple-700 mb-2">
            {postCount > 0 && (
              <>
                <span>{postCount} post{postCount > 1 ? 's' : ''}</span>
                {photoCount > 0 && <span>•</span>}
              </>
            )}
            {photoCount > 0 && (
              <span>{photoCount} photo{photoCount > 1 ? 's' : ''}</span>
            )}
          </div>
          
          {postTitles.length > 0 && (
            <div className="text-xs text-purple-600 space-y-1">
              {postTitles.slice(0, 3).map((title, i) => (
                <div 
                  key={i}
                  className="line-clamp-1"
                >
                  • {title}
                </div>
              ))}
              {postTitles.length > 3 && (
                <div className="text-purple-500 italic mt-1">
                  (+{postTitles.length - 3} autre{postTitles.length - 3 > 1 ? 's' : ''}...)
                </div>
              )}
            </div>
          )}
          
          {postCount === 0 && photoCount === 0 && (
            <div className="text-xs text-purple-500 italic">
              Moment sans contenu
            </div>
          )}
        </div>
        
        <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// ========================================
// 🔗 FALLBACK (lien générique)
// ========================================

function DefaultLink({ linkedContent, onNavigate }) {
  const handleClick = () => {
    if (onNavigate) onNavigate(linkedContent);
  };

  return (
    <div 
      onClick={handleClick}
      className="mb-2 inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm font-medium text-gray-700">{linkedContent.title}</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  );
}