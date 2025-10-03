/**
 * PhotoViewer.jsx v2.5 - Spinner global (suppression state local)
 * ✅ handleCreateSession simplifié (spinner géré par DataManager)
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { photoDataV2 } from '../core/PhotoDataV2.js';

export default function PhotoViewer({ photo, gallery, contextMoment, onClose, onCreateSession }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const initialIndex = gallery.findIndex(p => (p.url || p.google_drive_id) === (photo.url || photo.google_drive_id));
    setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);
    setCurrentPhoto(photo);
  }, [photo, gallery]);

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
  
  const navigate = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < gallery.length) {
      setCurrentIndex(newIndex);
      setCurrentPhoto(gallery[newIndex]);
    }
  };

  // ✅ SIMPLIFIÉ : Pas de state local, spinner global géré par DataManager
  const handleCreateSession = async () => {
    if (onCreateSession && currentPhoto && contextMoment) {
      try {
        await onCreateSession(currentPhoto, contextMoment);
      } catch (error) {
        console.error('Erreur création session:', error);
        alert('Impossible de créer la session');
      }
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, gallery.length, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/90"
      style={{ zIndex: 9999 }}
    >
      
      <div 
        className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between"
        style={{ zIndex: 10001 }}
      >
        
        {/* ✅ Bouton simplifié (pas de spinner local) */}
        <button 
          onClick={handleCreateSession}
          className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 shadow-xl transition-colors"
          title="Créer une session de chat"
        >
          <PlusCircle className="w-5 h-5" /> 
          <span className="hidden sm:inline">Session</span>
        </button>
        
        <div className="text-white bg-black/70 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
          {currentIndex + 1} / {gallery.length}
        </div>
        
        <button 
          onClick={onClose}
          className="text-white bg-black/70 rounded-full p-3 hover:bg-black/90 shadow-xl transition-colors"
          title="Fermer (Echap)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div 
        className="absolute inset-0 flex items-center justify-center px-16"
        style={{ pointerEvents: 'none', zIndex: 10000 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {loading && (
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full" 
               style={{ pointerEvents: 'auto' }} />
        )}
        
        {error && (
          <div className="text-white text-center" style={{ pointerEvents: 'auto' }}>
            <div className="text-6xl mb-4">⚠️</div>
            <p>Erreur de chargement</p>
          </div>
        )}
        
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

      <div 
        className="absolute inset-0"
        style={{ zIndex: 9999 }}
        onClick={onClose}
      />
    </div>
  );
}