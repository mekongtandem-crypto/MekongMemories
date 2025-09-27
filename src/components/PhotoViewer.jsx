/**
 * PhotoViewer.jsx v2.1 - SYNTAX FIX
 * ✅ REFACTOR: Removed global `window.photoDataV2` dependency.
 * ✅ NEW: Uses the imported `photoDataV2` module for URL resolution.
 * ✅ FIX: Corrected syntax error in React import.
 */

import React, { useState, useEffect } from 'react'; // ✅ CORRIGÉ
import { X, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { photoDataV2 } from '../core/PhotoDataV2.js';

export default function PhotoViewer({ photo, gallery, contextMoment, onClose, onCreateSession }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialIndex = gallery.findIndex(p => (p.url || p.google_drive_id) === (photo.url || photo.google_drive_id));
    setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);
    setCurrentPhoto(photo);
  }, [photo, gallery]);

  useEffect(() => {
    const resolveUrl = async () => {
      if (!currentPhoto) return;
      setLoading(true);
      const url = await photoDataV2.resolveImageUrl(currentPhoto, false);
      setImageUrl(url);
      setLoading(false);
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

  const handleCreateSession = (e) => {
    e.stopPropagation();
    onCreateSession(currentPhoto, contextMoment); 
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {loading && <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>}
        {!loading && imageUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <img src={imageUrl} alt={currentPhoto.filename || 'Photo'} className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <div className="text-white text-sm truncate pr-4">{currentPhoto?.filename}</div>
          <button onClick={handleCreateSession} className="flex items-center bg-amber-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-amber-600">
              <PlusCircle className="w-5 h-5 mr-2" /> Session
          </button>
          <div className="text-white bg-black/50 rounded-full px-4 py-1 text-sm min-w-[60px] text-center">
            {currentIndex + 1} / {gallery.length}
          </div>
        </div>
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"><X className="w-6 h-6" /></button>
      {gallery.length > 1 && currentIndex > 0 && <button onClick={() => navigate(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"><ChevronLeft className="w-8 h-8" /></button>}
      {gallery.length > 1 && currentIndex < gallery.length - 1 && <button onClick={() => navigate(1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"><ChevronRight className="w-8 h-8" /></button>}
    </div>
  );
}

