/**
 * SessionInfoPanel.jsx v1.1 - Phase 19D v3
 * Panneau slide-in avec infos session complètes
 * Stats / Origine / Souvenirs liés
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MessageSquare, Tag, MapPin, Sparkles, FileText, Image } from 'lucide-react';
import { getOriginInfo, formatOriginTitle, getOriginIcon } from '../utils/sessionUtils.js';
import { userManager } from '../core/UserManager.js';

export default function SessionInfoPanel({ 
  isOpen, 
  onClose, 
  session, 
  masterIndex,
  onNavigateToContent 
}) {
  const [linkedContent, setLinkedContent] = useState({
    moments: [],
    posts: [],
    photos: []
  });

  // Récupérer liens via ContentLinks
  useEffect(() => {
    if (!session || !window.contentLinks?.isLoaded) return;

    const links = window.contentLinks.getLinksForSession(session.id);
    
    const grouped = {
      moments: new Set(),
      posts: [],
      photos: []
    };

    links.forEach(link => {
      if (link.contentType === 'moment') {
        grouped.moments.add(link.contentId);
      } else if (link.contentType === 'post') {
        grouped.posts.push({ id: link.contentId, title: link.contentTitle });
      } else if (link.contentType === 'photo') {
        grouped.photos.push({ id: link.contentId, title: link.contentTitle });
      }
    });

    setLinkedContent({
      moments: Array.from(grouped.moments),
      posts: grouped.posts,
      photos: grouped.photos
    });
  }, [session]);

  if (!isOpen || !session) return null;

  const originInfo = getOriginInfo(session, masterIndex);
  const messageCount = session.notes?.length || 0;
  const createdByUser = userManager.getUser(session.user)?.name || 'N/A';
  const lastMessage = session.notes?.[messageCount - 1];
  const lastModifiedByUser = userManager.getUser(lastMessage?.author)?.name || createdByUser;

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('fr-FR', { 
      dateStyle: 'short', 
      timeStyle: 'short' 
    });
  };

  const handleNavigate = (contentType, contentId) => {
  if (contentType === 'moment' || contentType === 'post' || contentType === 'photo') {
    // Navigation vers contenu dans Memories
    onNavigateToContent?.(contentType, contentId);
  }
  onClose();
};

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Infos session
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">


          {/* 📍 ORIGINE */}
          {originInfo?.originContent && (
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Origine
              </h4>
              <button
                onClick={() => handleNavigate(
                  originInfo.originContent.type,
                  originInfo.originContent.id
                )}
                className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-2">
  				<span className="text-base">
    				{getOriginIcon(originInfo.originContent.type)}
  				</span>
  				<span>{originInfo.originContent.title}</span>
				</div>
          
                {/* Thèmes origine */}
                {originInfo.originThemes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {originInfo.originThemes.map(theme => (
                      <span
                        key={theme.id}
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${theme.color}20`,
                          color: theme.color
                        }}
                      >
                        {theme.emoji} {theme.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </section>
          )}

          {/* 🔗 SOUVENIRS LIÉS */}
          {(linkedContent.moments.length > 0 || linkedContent.posts.length > 0 || linkedContent.photos.length > 0) && (
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Souvenirs liés ({linkedContent.moments.length + linkedContent.posts.length + linkedContent.photos.length})
              </h4>

              <div className="space-y-2">
                {/* Moments */}
                {linkedContent.moments.map(momentId => {
                  const moment = masterIndex?.moments?.find(m => m.id === momentId);
                  if (!moment) return null;
                  
                  return (
                    <button
                      key={momentId}
                      onClick={() => handleNavigate('moment', momentId)}
                      className="w-full text-left p-2 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2 text-amber-700">
                        <span><MapPin className="w-4 h-4" /></span>
                        <span className="font-medium truncate">{moment.title}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Posts */}
                {linkedContent.posts.map((post, idx) => (
                  <button
                    key={`post-${idx}`}
                    onClick={() => handleNavigate('post', post.id)}
                    className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2 text-blue-700">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{post.title}</span>
                    </div>
                  </button>
                ))}

                {/* Photos */}
{linkedContent.photos.map((photo, idx) => {
  // ⭐ Enrichir contexte photo (moment parent ou post parent)
  let photoDisplay = { icon: '📷', title: photo.title, color: 'green' };
  
  if (masterIndex?.moments) {
    for (const moment of masterIndex.moments) {
      // Chercher dans dayPhotos
      const dayPhoto = moment.dayPhotos?.find(p => 
        p.filename === photo.id || p.google_drive_id === photo.id
      );
      if (dayPhoto) {
        photoDisplay = {
          icon: '📷',
          title: moment.displayTitle || moment.title,
          subtitle: 'Photo du moment',
          color: 'green'
        };
        break;
      }
      
      // Chercher dans postPhotos
      if (moment.posts) {
        for (const post of moment.posts) {
          const postPhoto = post.photos?.find(p => 
            p.filename === photo.id || p.google_drive_id === photo.id
          );
          if (postPhoto) {
            const postTitle = post.content?.split('\n')[0] || 'Article';
            photoDisplay = {
              icon: '🖼️',
              title: postTitle,
              subtitle: 'Photo de l\'article',
              color: 'blue'
            };
            break;
          }
        }
      }
      
      if (photoDisplay.subtitle) break;
    }
  }
  
  return (
    <button
      key={`photo-${idx}`}
      onClick={() => handleNavigate('photo', photo.id)}
      className={`w-full text-left p-2 bg-${photoDisplay.color}-50 hover:bg-${photoDisplay.color}-100 rounded border border-${photoDisplay.color}-200 transition-colors text-sm`}
    >
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{photoDisplay.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate text-${photoDisplay.color}-700`}>
            {photoDisplay.title}
          </div>
          {photoDisplay.subtitle && (
            <div className={`text-xs text-${photoDisplay.color}-600 mt-0.5`}>
              {photoDisplay.subtitle}
            </div>
          )}
        </div>
      </div>
    </button>
  );
})}
              </div>
            </section>
          )}

          {/* Message si aucun lien */}
          {linkedContent.moments.length === 0 && 
           linkedContent.posts.length === 0 && 
           linkedContent.photos.length === 0 && (
            <section>
              <div className="text-center py-6 text-gray-400 text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun souvenir lié pour l'instant</p>
                <p className="text-xs mt-1">Ajoutez des liens depuis Memories</p>
              </div>
            </section>
          )}
          
          {/* 📊 STATS */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Statistiques
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span><strong>{messageCount}</strong> message{messageCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>Créée par <strong>{createdByUser}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDateTime(session.createdAt)}</span>
              </div>
              {lastMessage && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Dernier msg par <strong>{lastModifiedByUser}</strong></span>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}