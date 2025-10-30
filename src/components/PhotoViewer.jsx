/**
 * PhotoViewer.jsx v2.8 - Phase 19D
 * ✅ Badge sessions avec mise à jour automatique
 * ✅ Pastilles photos intelligentes
 */

// ========================================
// IMPORTS
// ========================================

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, MessageCircle, Tag, Link, MessageSquarePlus } from 'lucide-react';
import { photoDataV2 } from '../core/PhotoDataV2.js';
import ThemeModal from './ThemeModal.jsx';
import { generatePhotoMomentKey, generatePhotoMastodonKey } from '../utils/themeUtils.js';
import SessionListModal from './SessionListModal.jsx';
import { getSessionsForContent } from '../utils/sessionUtils.js';

// ========================================
// COMPOSANT BADGE SESSIONS (pour PhotoViewer)
// ========================================

// Badge sessions adapté pour PhotoViewer
const SessionBadgePhoto = ({ photo, sessions, onShowSessions, onCreateSession }) => {
  // ⭐ CORRECTION Phase 19D : Chercher par les 2 identifiants (union)
  // Problème : ContentLinks peut avoir indexé par filename OU google_drive_id
  const sessionsByFilename = photo.filename 
    ? getSessionsForContent(sessions, 'photo', photo.filename)
    : [];
  const sessionsByDriveId = photo.google_drive_id
    ? getSessionsForContent(sessions, 'photo', photo.google_drive_id)
    : [];
  
  // Union des 2 résultats (supprimer doublons)
  const allSessionIds = new Set([
    ...sessionsByFilename.map(s => s.id),
    ...sessionsByDriveId.map(s => s.id)
  ]);
  const linkedSessions = Array.from(allSessionIds)
    .map(id => sessions.find(s => s.id === id))
    .filter(Boolean);
  
  const count = linkedSessions.length;
  
  console.log('🔍 SessionBadgePhoto:', {
    filename: photo.filename,
    driveId: photo.google_drive_id,
    foundByFilename: sessionsByFilename.length,
    foundByDriveId: sessionsByDriveId.length,
    totalUnique: count
  });
  
  const handleClick = () => {
    if (count === 0) {
      onCreateSession();
    } else {
      const title = photo.filename || photo.google_drive_id || 'Photo';
      // ⭐ Utiliser google_drive_id en priorité pour cohérence avec l'index
      const photoId = photo.google_drive_id || photo.filename;
      onShowSessions('photo', photoId, title);
    }
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold shadow-xl transition-colors ${
        count === 0 
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'bg-purple-500 text-white hover:bg-purple-600'
      }`}
      title={count === 0 ? 'Créer une session' : `${count} session${count > 1 ? 's' : ''} - Voir`}
    >
      {count === 0 ? (
        <>
          <MessageSquarePlus className="w-5 h-5" />
          <span className="hidden sm:inline">Session</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Sessions</span>
          <span className="bg-purple-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
            {count}
          </span>
        </>
      )}
    </button>
  );
};

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

export default function PhotoViewer({ 
  photo, 
  gallery, 
  contextMoment, 
  onClose, 
  onCreateSession, 
  globalSelectionMode, 
  onContentSelected 
}) {
  
  // ========================================
  // ÉTATS - Navigation & Affichage
  // ========================================
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // ========================================
  // ÉTATS - Sessions (avec synchronisation)
  // ========================================
  
  const [localSessions, setLocalSessions] = useState([]);
  const [sessionListModal, setSessionListModal] = useState(null);
  
  // ========================================
  // ÉTATS - Thèmes
  // ========================================
  
  const [themeModal, setThemeModal] = useState({
    isOpen: false,
    currentThemes: []
  });
  const [, forceUpdate] = useState({});
  
  // ========================================
  // REFS - Touch gestures
  // ========================================
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // ========================================
  // EFFET - Synchronisation sessions initiale
  // ========================================
  
  useEffect(() => {
    const appState = window.dataManager?.getState();
    setLocalSessions(appState?.sessions || []);
  }, []);

  // ========================================
  // EFFET - Navigation photo
  // ========================================
  
  useEffect(() => {
    const initialIndex = gallery.findIndex(p => (p.url || p.google_drive_id) === (photo.url || photo.google_drive_id));
    setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);
    setCurrentPhoto(photo);
  }, [photo, gallery]);

  // ========================================
  // EFFET - Chargement image
  // ========================================
  
  useEffect(() => {
    const resolveUrl = async () => {
      if (!currentPhoto) return;
      
      setLoading(true);
      setError(false);
      
      try {
        const url = await photoDataV2.resolveImageUrl(currentPhoto, false);
        if (url && !url.startsWith('data:image/svg+xml')) {
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erreur résolution URL photo:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    resolveUrl();
  }, [currentPhoto]);
  
  // ========================================
  // EFFET - Callback modal création session
  // ========================================
  
  useEffect(() => {
    window.createSessionFromModal = () => {
      if (sessionListModal && currentPhoto && contextMoment) {
        setSessionListModal(null);
        handleCreateSession();
      }
    };
    
    return () => {
      delete window.createSessionFromModal;
    };
  }, [sessionListModal, currentPhoto, contextMoment]);

  // ========================================
  // EFFET - Raccourcis clavier
  // ========================================
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, gallery.length, onClose]);

  // ========================================
  // HANDLERS - Navigation
  // ========================================
  
  const navigate = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < gallery.length) {
      setCurrentIndex(newIndex);
      setCurrentPhoto(gallery[newIndex]);
    }
  };

  // ========================================
  // HANDLERS - Touch gestures
  // ========================================
  
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        navigate(1);
      } else {
        navigate(-1);
      }
    }
  };

  const handleCreateSession = async () => {
  if (onCreateSession && currentPhoto && contextMoment) {
    try {
      await onCreateSession(currentPhoto, contextMoment);
      
      // ✅ Attendre que dataManager recharge les sessions
      console.log('⏳ Rechargement sessions...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ Forcer le rechargement explicite
      if (window.app?.loadSessions) {
        await window.app.loadSessions();
      }
      
      const appState = window.dataManager?.getState();
      console.log('🟢 Sessions après rechargement:', appState?.sessions?.length);
      setLocalSessions(appState?.sessions || []);
      
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Impossible de créer la session');
    }
  }
};

  // ========================================
  // HANDLERS - Liens (mode sélection)
  // ========================================
  
  const handleLinkPhoto = () => {
    if (onContentSelected) {
      onContentSelected(currentPhoto, 'photo');
    }
    onClose();
  };

  // ========================================
  // HANDLERS - Thèmes
  // ========================================
  
  const handleOpenThemeModal = () => {
    const photoKey = currentPhoto.type === 'day_photo' 
      ? generatePhotoMomentKey(currentPhoto)
      : generatePhotoMastodonKey(currentPhoto);
    
    const currentThemes = photoKey 
      ? (window.themeAssignments?.getThemesForContent(photoKey) || [])
      : [];
    
    setThemeModal({
      isOpen: true,
      currentThemes
    });
  };

  const handleSaveThemes = async (selectedThemes) => {
    const appState = window.dataManager?.getState();
    if (!appState?.currentUser) {
      console.error('❌ Utilisateur non connecté');
      return;
    }
    
    const photoKey = currentPhoto.type === 'day_photo' 
      ? generatePhotoMomentKey(currentPhoto)
      : generatePhotoMastodonKey(currentPhoto);
    
    if (photoKey) {
      await window.themeAssignments.assignThemes(
        photoKey,
        selectedThemes,
        appState.currentUser.id
      );
      
      forceUpdate({});
    }
    
    setThemeModal({ isOpen: false, currentThemes: [] });
  };

  const handleCloseThemeModal = () => {
    setThemeModal({ isOpen: false, currentThemes: [] });
  };

  // ========================================
  // DONNÉES DÉRIVÉES
  // ========================================
  
  const appState = window.dataManager?.getState();
  const availableThemes = appState?.masterIndex?.themes || [];

  const photoKey = currentPhoto 
    ? (currentPhoto.type === 'day_photo' 
        ? generatePhotoMomentKey(currentPhoto)
        : generatePhotoMastodonKey(currentPhoto))
    : null;
  const photoThemes = photoKey ? (window.themeAssignments?.getThemesForContent(photoKey) || []) : [];
  const hasThemes = photoThemes.length > 0;

// ========================================
// HANDLERS - Sessions
// ========================================

const handleShowSessions = (contentType, contentId, contentTitle) => {
  console.log('💬 Ouverture liste sessions pour:', contentTitle);
  
  // Récupérer les sessions liées via l'app state
  const linkedSessions = localSessions.filter(session => {
    // Vérifier dans ContentLinks
    const links = window.contentLinks?.getLinksForContent(contentType, contentId) || [];
    return links.some(link => link.sessionId === session.id);
  });
  
  setSessionListModal({
    sessions: linkedSessions,
    contentTitle: contentTitle
  });
};

const handleSelectSession = (session) => {
  console.log('✅ Session sélectionnée:', session.id);
  setSessionListModal(null);
  
  // Ouvrir la session dans Chat
  if (window.app?.openChatSession) {
    window.app.openChatSession(session);
  } else {
    console.warn('⚠️ window.app.openChatSession non disponible');
  }
};




  // ========================================
  // RENDU
  // ========================================
  
  return (
    <>
      {/* Overlay principal */}
      <div 
        className="fixed inset-0 bg-black/90"
        style={{ zIndex: 9999 }}
      >
        
        {/* ======================================== */}
        {/* BARRE SUPÉRIEURE - Actions */}
        {/* ======================================== */}
        
        <div 
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between"
          style={{ zIndex: 10001 }}
        >
          
          {/* Boutons d'action gauche */}
          <div className="flex items-center space-x-2">
            
            
            {/* Badge sessions intelligent */}
            <SessionBadgePhoto 
              photo={currentPhoto}
              sessions={localSessions}
              onShowSessions={handleShowSessions}
              onCreateSession={handleCreateSession}
            />
            
            {/* Bouton Link (si mode sélection) */}
            {globalSelectionMode?.active && (
              <button 
                onClick={handleLinkPhoto}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-purple-600 border border-gray-300 hover:bg-purple-50 rounded-lg font-semibold shadow-xl transition-colors"
                title="Lier cette photo"
              >
                <Link className="w-5 h-5" />
                <span className="hidden sm:inline">Lier</span>
              </button>
            )}
            
            {/* Bouton Thèmes avec état */}
            <button 
              onClick={handleOpenThemeModal}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold shadow-xl transition-colors ${
                hasThemes 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={hasThemes ? `${photoThemes.length} thème${photoThemes.length > 1 ? 's' : ''} assigné${photoThemes.length > 1 ? 's' : ''}` : "Assigner des thèmes"}
            >
              <Tag className="w-5 h-5" />
              <span className="hidden sm:inline">Thèmes</span>
              {hasThemes && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-black">
                  {photoThemes.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Compteur centre */}
          <div className="text-white bg-black/70 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
            {currentIndex + 1} / {gallery.length}
          </div>
          
          {/* Bouton fermer */}
          <button 
            onClick={onClose}
            className="text-white bg-black/70 rounded-full p-3 hover:bg-black/90 shadow-xl transition-colors"
            title="Fermer (Echap)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ======================================== */}
        {/* ZONE CENTRALE - Image */}
        {/* ======================================== */}
        
        <div 
          className="absolute inset-0 flex items-center justify-center px-16"
          style={{ pointerEvents: 'none', zIndex: 10000 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          
          {/* Loader */}
          {loading && (
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" 
                 style={{ pointerEvents: 'auto' }} />
          )}
          
          {/* Erreur */}
          {error && (
            <div className="text-white text-center" style={{ pointerEvents: 'auto' }}>
              <div className="text-6xl mb-4">⚠️</div>
              <p>Erreur de chargement</p>
            </div>
          )}
          
          {/* Image */}
          {!loading && !error && imageUrl && (
            <img 
              src={imageUrl} 
              alt="Photo de voyage" 
              className="max-w-full max-h-full object-contain"
              style={{ pointerEvents: 'auto' }}
              onError={() => setError(true)}
              onClick={onClose}
            />
          )}
        </div>

        {/* ======================================== */}
        {/* NAVIGATION - Flèches */}
        {/* ======================================== */}
        
        {gallery.length > 1 && currentIndex > 0 && (
          <button 
            onClick={() => navigate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/70 rounded-full p-3 hover:bg-black/90 shadow-xl transition-colors"
            style={{ zIndex: 10001 }}
            title="Photo précédente (← ou swipe droite)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        
        {gallery.length > 1 && currentIndex < gallery.length - 1 && (
          <button 
            onClick={() => navigate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/70 rounded-full p-3 hover:bg-black/90 shadow-xl transition-colors"
            style={{ zIndex: 10001 }}
            title="Photo suivante (→ ou swipe gauche)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Zone cliquable pour fermer */}
        <div 
          className="absolute inset-0"
          style={{ zIndex: 9999 }}
          onClick={onClose}
        />
      </div>

      {/* ======================================== */}
      {/* MODALS */}
      {/* ======================================== */}
      
      {/* Modal Thèmes */}
      <ThemeModal
        isOpen={themeModal.isOpen}
        onClose={handleCloseThemeModal}
        availableThemes={availableThemes}
        currentThemes={themeModal.currentThemes}
        onSave={handleSaveThemes}
        title="Assigner des thèmes à cette photo"
        contentType="photo"
      />
      
      {/* Modal Liste Sessions */}
      {sessionListModal && (
        <SessionListModal
          isOpen={true}
          onClose={() => setSessionListModal(null)}
          sessions={sessionListModal.sessions}
          contentTitle={sessionListModal.contentTitle}
          onSelectSession={handleSelectSession}
        />
      )}
    </>
  );
}