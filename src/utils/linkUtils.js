/**
 * linkUtils.js v1.2 - Phase v2.26b : YouTube Preview
 * ✅ Utilitaires pour système de liens ContentLinks
 * ✅ v2.26a : Détection et rendu URLs cliquables
 * ✅ v2.26b : Preview YouTube avec thumbnail et embed
 */

import React from 'react';
import YouTubePreview from '../components/YouTubePreview.jsx';

/**
 * Icône selon type de contenu
 */
export function getLinkIcon(contentType) {
  const icons = {
    moment: '📍',
    post: '📄',
    photo: '📸'
  };
  return icons[contentType] || '🔗';
}

/**
 * Couleur selon type de contenu
 */
export function getLinkColor(contentType) {
  const colors = {
    moment: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-100'
    },
    post: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100'
    },
    photo: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      hover: 'hover:bg-green-100'
    }
  };
  return colors[contentType] || colors.moment;
}

/**
 * Formater titre pour affichage
 */
export function formatLinkTitle(title, maxLength = 40) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}

/**
 * Extraire données pour créer lien depuis élément
 */
export function extractLinkData(element, type) {
  switch (type) {
    case 'moment':
      return {
        contentType: 'moment',
        contentId: element.id,
        contentTitle: element.title || `Jour ${element.startDay}${element.endDay > element.startDay ? `-${element.endDay}` : ''}`
      };
    
    case 'post':
      return {
        contentType: 'post',
        contentId: element.id,
        contentTitle: element.title || 'Article sans titre'
      };
    
    case 'photo':
      return {
        contentType: 'photo',
        contentId: element.filename,
        contentTitle: element.filename
      };
    
    default:
      return null;
  }
}

// ========================================
// v2.26a : DÉTECTION ET RENDU URLs CLIQUABLES
// ========================================

/**
 * Regex pour détecter les URLs dans le texte
 * Détecte http://, https://, et www.
 */
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

/**
 * Rendre du texte avec liens cliquables
 * ⭐ v2.26b : Détection YouTube → YouTubePreview
 * @param {string} text - Texte contenant potentiellement des URLs
 * @returns {Array} Tableau d'éléments React (texte et liens)
 */
export function renderContentWithLinks(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Séparer le texte en parties (texte normal et URLs)
  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    // Vérifier si cette partie est une URL
    if (part && (part.match(/^https?:\/\//) || part.match(/^www\./))) {
      // Construire l'URL complète (ajouter https:// si www.)
      const href = part.match(/^www\./) ? `https://${part}` : part;

      // ⭐ v2.26b : Détecter YouTube et rendre preview
      const youtubeId = extractYouTubeId(href);
      if (youtubeId) {
        return React.createElement(
          YouTubePreview,
          {
            key: `youtube-${index}`,
            videoId: youtubeId,
            url: href
          }
        );
      }

      // Lien normal (non-YouTube)
      return React.createElement(
        'a',
        {
          key: `link-${index}`,
          href: href,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-150',
          onClick: (e) => e.stopPropagation()
        },
        part
      );
    }

    // Partie texte normale
    return part;
  });
}

/**
 * Vérifier si un texte contient des URLs
 * @param {string} text - Texte à vérifier
 * @returns {boolean}
 */
export function containsLinks(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return URL_REGEX.test(text);
}

/**
 * Extraire toutes les URLs d'un texte
 * @param {string} text - Texte source
 * @returns {Array<string>} Liste des URLs trouvées
 */
export function extractLinks(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = text.match(URL_REGEX);
  return matches || [];
}

// ========================================
// v2.26b : YOUTUBE PREVIEW
// ========================================

/**
 * Regex pour détecter les URLs YouTube
 * Supporte: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/**
 * Extraire l'ID vidéo YouTube d'une URL
 * @param {string} url - URL YouTube
 * @returns {string|null} Video ID ou null si non trouvé
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Vérifier si une URL est une URL YouTube
 * @param {string} url - URL à vérifier
 * @returns {boolean}
 */
export function isYouTubeURL(url) {
  return extractYouTubeId(url) !== null;
}

/**
 * Rendre HTML avec liens cliquables (pour dangerouslySetInnerHTML)
 * ⭐ v2.26b : Détection YouTube → badge "📺 YouTube"
 * @param {string} html - HTML contenant potentiellement des URLs
 * @returns {string} HTML avec URLs transformées en <a> tags
 */
export function renderHTMLWithLinks(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Remplacer les URLs par des balises <a>
  // Note: utilise une regex globale pour remplacer toutes les occurrences
  return html.replace(/(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/g, (match) => {
    const href = match.match(/^www\./) ? `https://${match}` : match;

    // ⭐ v2.26b : Détection YouTube → badge spécial
    const youtubeId = extractYouTubeId(href);
    if (youtubeId) {
      return `<span class="inline-flex items-center space-x-1"><span class="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold">📺 YouTube</span><a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-150">${match}</a></span>`;
    }

    // Lien normal (non-YouTube)
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-150">${match}</a>`;
  });
}