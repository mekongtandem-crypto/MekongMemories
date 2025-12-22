/**
 * YouTubePreview.jsx v2.1 - Phase v2.26e : 2 clics (badge → thumbnail → vidéo)
 * ✅ Clic 1 : Badge → Thumbnail preview
 * ✅ Clic 2 : Thumbnail → Vidéo (autoplay)
 * ✅ Bouton X → Retour badge
 * ✅ Support dark mode
 */

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function YouTubePreview({ videoId, url }) {
  const [viewState, setViewState] = useState('collapsed'); // 'collapsed' | 'thumbnail' | 'embed'

  // URLs YouTube
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  // État 1 : Badge collapsed (compact)
  if (viewState === 'collapsed') {
    return (
      <div className="my-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewState('thumbnail');
          }}
          className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <span>📺</span>
          <span>YouTube</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      </div>
    );
  }

  // État 3 : Iframe embed (vidéo en cours avec autoplay)
  if (viewState === 'embed') {
    return (
      <div className="relative my-3 rounded-lg overflow-hidden bg-black">
        {/* Bouton fermeture → Retour badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewState('collapsed');
          }}
          className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 transition-colors"
          title="Fermer la vidéo"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Iframe YouTube avec autoplay */}
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video"
        />
      </div>
    );
  }

  // État 2 : Thumbnail (preview image cliquable)
  return (
    <div className="my-3">
      {/* Thumbnail cliquable → Lance vidéo avec autoplay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setViewState('embed');
        }}
        className="relative group w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      >
        {/* Thumbnail */}
        <img
          src={thumbnailUrl}
          alt="YouTube video thumbnail"
          className="w-full aspect-video object-cover"
        />

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Badge YouTube en haut */}
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1 shadow-lg">
          <span>📺</span>
          <span>YouTube</span>
        </div>

        {/* Bouton play central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-600 group-hover:bg-red-700 rounded-full p-4 transition-colors shadow-xl">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </button>

      {/* Lien URL sous le thumbnail */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    </div>
  );
}
