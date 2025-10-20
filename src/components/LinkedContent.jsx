/**
 * LinkedContent.jsx v1.0 - Phase 18b Étape 3a
 * Affichage enrichi des liens dans messages
 */
import React, { useState, useEffect } from 'react';
import { MapPin, FileText, Image as ImageIcon, ChevronRight } from 'lucide-react';

export default function LinkedContent({ linkedContent, onNavigate, masterIndex }) {
  
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(linkedContent);
    }
  };

  // Router selon type
  switch (linkedContent.type) {
    case 'photo':
      return <LinkedPhoto linkedContent={linkedContent} onClick={handleClick} />;
    
    case 'post':
      return <LinkedPost linkedContent={linkedContent} onClick={handleClick} masterIndex={masterIndex} />;
    
    case 'moment':
      return <LinkedMoment linkedContent={linkedContent} onClick={handleClick} masterIndex={masterIndex} />;
    
    default:
      return <DefaultLink linkedContent={linkedContent} onClick={handleClick} />;
  }
}

// ========================================
// 📷 PHOTO LIÉE (200px comme envoi)
// ========================================

function LinkedPhoto({ linkedContent, onClick }) {
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
        
        // ⭐ Utiliser les métadonnées complètes de linkedContent
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
    <div 
      className="mb-2 cursor-pointer group relative inline-block"
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={linkedContent.title}
        className="max-w-[200px] rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
      />
      
      {/* Overlay hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-white px-3 py-1.5 rounded-full text-sm font-medium text-gray-800 shadow-lg transition-opacity">
            📷 Voir galerie
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 📄 POST LIÉ (Card avec preview texte)
// ========================================

function LinkedPost({ linkedContent, onClick, masterIndex }) {
  const [postData, setPostData] = useState(null);

  useEffect(() => {
    // Trouver le post dans masterIndex
    if (!masterIndex?.moments) return;
    
    for (const moment of masterIndex.moments) {
      const post = moment.posts?.find(p => p.id === linkedContent.id);
      if (post) {
        setPostData({ post, moment });
        break;
      }
    }
  }, [linkedContent.id, masterIndex]);

  if (!postData) {
    // Fallback si post non trouvé
    return (
      <div 
        onClick={onClick}
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
      onClick={onClick}
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

function LinkedMoment({ linkedContent, onClick, masterIndex }) {
  const [momentData, setMomentData] = useState(null);

  useEffect(() => {
	console.log('🔍 LinkedMoment - Recherche moment:', linkedContent.id);
  	console.log('🔍 masterIndex disponible?', !!masterIndex);
  	console.log('🔍 masterIndex.moments?', masterIndex?.moments?.length);

    // Trouver le moment dans masterIndex
    if (masterIndex?.moments) {
  console.log('🔍 Premier moment exemple:', masterIndex.moments[0]);
  console.log('🔍 IDs disponibles (5 premiers):', masterIndex.moments.slice(0, 5).map(m => m.id));
  
  const found = masterIndex.moments.find(m => m.id === linkedContent.id);
  console.log('🔍 Résultat find pour', linkedContent.id, ':', found ? '✅ TROUVÉ' : '❌ NON TROUVÉ');
}
    
    const moment = masterIndex.moments.find(m => m.id === linkedContent.id);
    if (moment) {
      console.log('✅ Moment trouvé:', {
        id: moment.id,
        title: moment.title,
        posts: moment.posts?.length,
        dayPhotos: moment.dayPhotos?.length,
        postPhotos: moment.postPhotos?.length
      });
      setMomentData(moment);
    } else {
      console.warn('⚠️ Moment non trouvé:', linkedContent.id);
    }
  }, [linkedContent.id, masterIndex]);

  if (!momentData) {
    // Fallback si moment non trouvé
    return (
      <div 
        onClick={onClick}
        className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-purple-700">{linkedContent.title}</span>
            <div className="text-xs text-purple-500 mt-1">Chargement...</div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400" />
        </div>
      </div>
    );
  }

  const postCount = momentData.posts?.length || 0;
  
  // ⭐ Calculer photoCount en tenant compte de la structure
  const dayPhotoCount = momentData.dayPhotos?.length || 0;
  const postPhotoCount = momentData.postPhotos?.length || 0;
  const photoCount = dayPhotoCount + postPhotoCount;
  
  // Extraire titres des posts
  const postTitles = (momentData.posts || [])
    .map(p => {
      const firstLine = p.content?.split('\n')[0]?.trim();
      return firstLine || 'Article sans titre';
    })
    .filter(Boolean);

  console.log('📊 Stats moment:', { postCount, photoCount, postTitles });

  return (
    <div 
      onClick={onClick}
      className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors group"
    >
      <div className="flex items-start space-x-2">
        <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          {/* Titre */}
          <div className="font-semibold text-purple-900 text-sm mb-1.5">
            {linkedContent.title}
          </div>
          
          {/* Stats */}
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
          
          {/* Liste posts */}
          {postTitles.length > 0 && (
            <div className="text-xs text-purple-600 space-y-0.5">
              {postTitles.slice(0, 3).map((title, i) => (
                <div key={i} className="truncate">• {title}</div>
              ))}
              {postTitles.length > 3 && (
                <div className="text-purple-500 italic mt-1">
                  (+{postTitles.length - 3} autre{postTitles.length - 3 > 1 ? 's' : ''}...)
                </div>
              )}
            </div>
          )}
          
          {/* Cas où pas de contenu */}
          {postCount === 0 && photoCount === 0 && (
            <div className="text-xs text-purple-500 italic">
              Moment sans contenu
            </div>
          )}
        </div>
        
        <ChevronRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// ========================================
// 🔗 FALLBACK (lien générique)
// ========================================

function DefaultLink({ linkedContent, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="mb-2 inline-flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <span className="text-sm font-medium text-gray-700">{linkedContent.title}</span>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  );
}