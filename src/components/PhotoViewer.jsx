/**
 * PhotoViewer.jsx v2.2 - FIX: Navigation suivant/précédent
 * ✅ CORRECTION: Empêcher la propagation d'événements sur les boutons de navigation
 * ✅ AMÉLIORATION: Gestion des erreurs d'images et loading states
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { photoDataV2 } from '../core/PhotoDataV2.js';

export default function PhotoViewer({ photo, gallery, contextMoment, onClose, onCreateSession }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
  
  // ✅ CORRECTION: Empêcher la propagation d'événements
  const navigate = (direction, event) => {
    event.stopPropagation(); // ← Empêche la fermeture de la visionneuse
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < gallery.length) {
      setCurrentIndex(newIndex);
      setCurrentPhoto(gallery[newIndex]);
    }
  };

  const handleCreateSession = (e) => {
    e.stopPropagation();
    onCreateSession(currentPhoto, contextMoment); 
  };

  // ✅ AMÉLIORATION: Gestion clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) navigate(-1, e);
      if (e.key === 'ArrowRight' && currentIndex < gallery.length - 1) navigate(1, e);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, gallery.length, onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center" 
         onClick={onClose}>
      
      {/* Zone image principale */}
      <div className="relative w-full h-full flex items-center justify-center p-4" 
           onClick={(e) => e.stopPropagation()}>
        
        {/* États de chargement/erreur */}
        {loading && (
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
        )}
        
        {error && (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p>Erreur de chargement de l'image</p>
            <p className="text-sm opacity-70 mt-2">{currentPhoto?.filename}</p>
          </div>
        )}
        
        {!loading && !error && imageUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={currentPhoto.filename || 'Photo'} 
              className="max-w-full max-h-full object-contain"
              onError={() => setError(true)}
            />
          </div>
        )}
      </div>

      {/* Barre d'informations en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40" 
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <div className="text-white text-sm truncate pr-4">
            {currentPhoto?.filename}
          </div>
          
          <button 
            onClick={handleCreateSession} 
            className="flex items-center bg-amber-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-amber-600"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Session
          </button>
          
          <div className="text-white bg-black/50 rounded-full px-4 py-1 text-sm min-w-[60px] text-center">
            {currentIndex + 1} / {gallery.length}
          </div>
        </div>
      </div>

      {/* Bouton fermer */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* ✅ CORRECTION: Boutons navigation avec stopPropagation */}
      {gallery.length > 1 && currentIndex > 0 && (
        <button 
          onClick={(e) => navigate(-1, e)} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      
      {gallery.length > 1 && currentIndex < gallery.length - 1 && (
        <button 
          onClick={(e) => navigate(1, e)} 
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}