/**
 * SessionInfoPanel.jsx v1.2 - Dark mode + Design optimisé
 * ✅ Support dark mode complet
 * ✅ Ne couvre pas tout l'écran (w-80 au lieu de w-96)
 * ✅ Transitions 150ms
 * ✅ Panneau slide-in avec infos session complètes
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MessageSquare, Tag, MapPin, Sparkles, FileText, Image, FileEdit } from 'lucide-react';
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
      onNavigateToContent?.(contentType, contentId);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel - ✅ Plus étroit (w-80 au lieu de w-96) */}
<div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transition-colors duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Infos session
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-150"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* 📍 ORIGINE */}
          {originInfo?.originContent && (
            <section>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Origine
              </h4>
              <button
                onClick={() => handleNavigate(
                  originInfo.originContent.type,
                  originInfo.originContent.id
                )}
                className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 transition-colors duration-150"
              >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm mb-2">
                  <span className="text-base">
                    {getOriginIcon(originInfo.originContent.type)}
                  </span>
                  <span>{originInfo.originContent.title}</span>
                </div>
          
                {/* Thèmes origine */}
                {originInfo.originThemes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Tag className="w-3 h-3 text-gray-400 dark:text-gray-500" />
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
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
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
                      className="w-full text-left p-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-700 transition-colors duration-150 text-sm"
                    >
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <span><MapPin className="w-4 h-4" /></span>
                        <span className="font-medium truncate">{moment.title}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Posts - ⭐ v2.8e : Distinguer posts Mastodon vs Note de photos */}
                {linkedContent.posts.map((post, idx) => {
                  // Chercher le post dans masterIndex pour vérifier category
                  let isPhotoNote = false;
                  if (masterIndex?.moments) {
                    for (const moment of masterIndex.moments) {
                      const foundPost = moment.posts?.find(p => p.id === post.id);
                      if (foundPost) {
                        isPhotoNote = foundPost.category === 'user_added';
                        break;
                      }
                    }
                  }

                  const styles = isPhotoNote
                    ? {
                        bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
                        border: 'border-amber-200 dark:border-amber-700',
                        text: 'text-amber-700 dark:text-amber-300',
                        Icon: FileEdit
                      }
                    : {
                        bg: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
                        border: 'border-blue-200 dark:border-blue-700',
                        text: 'text-blue-700 dark:text-blue-300',
                        Icon: FileText
                      };

                  return (
                    <button
                      key={`post-${idx}`}
                      onClick={() => handleNavigate('post', post.id)}
                      className={`w-full text-left p-2 ${styles.bg} rounded border ${styles.border} transition-colors duration-150 text-sm`}
                    >
                      <div className={`flex items-center gap-2 ${styles.text}`}>
                        <styles.Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{post.title}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Photos */}
                {linkedContent.photos.map((photo, idx) => {
                  // Enrichir contexte photo (moment parent ou post parent)
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
                      className={`w-full text-left p-2 rounded border transition-colors duration-150 text-sm ${
                        photoDisplay.color === 'green' 
                          ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700'
                          : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{photoDisplay.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${
                            photoDisplay.color === 'green'
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-blue-700 dark:text-blue-300'
                          }`}>
                            {photoDisplay.title}
                          </div>
                          {photoDisplay.subtitle && (
                            <div className={`text-xs mt-0.5 ${
                              photoDisplay.color === 'green'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
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
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun souvenir lié pour l'instant</p>
                <p className="text-xs mt-1">Ajoutez des liens depuis Memories</p>
              </div>
            </section>
          )}
          
          {/* 📊 STATS */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Statistiques
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span><strong className="text-gray-900 dark:text-gray-100">{messageCount}</strong> message{messageCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span>Créée par <strong className="text-gray-900 dark:text-gray-100">{createdByUser}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span>{formatDateTime(session.createdAt)}</span>
              </div>
              {lastMessage && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>Dernier msg par <strong className="text-gray-900 dark:text-gray-100">{lastModifiedByUser}</strong></span>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}