/**
 * linkUtils.js v1.0 - Phase 18b
 * Utilitaires pour système de liens
 */

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