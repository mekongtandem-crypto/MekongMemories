/**
 * themeUtils.js v1.2 - Tagging hiérarchique
 * ✅ Clés pour tous les niveaux (moment, post, photo)
 * ✅ Fonctions pour récupérer enfants
 */

// ========================================
// CONSTANTES
// ========================================

export const THEME_COLORS = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
    badge: 'bg-purple-500 dark:bg-purple-600',
    hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/50'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-600',
    badge: 'bg-orange-500 dark:bg-orange-600',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-800/50'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
    badge: 'bg-blue-500 dark:bg-blue-600',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/50'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600',
    badge: 'bg-green-500 dark:bg-green-600',
    hover: 'hover:bg-green-100 dark:hover:bg-green-800/50'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-600',
    badge: 'bg-red-500 dark:bg-red-600',
    hover: 'hover:bg-red-100 dark:hover:bg-red-800/50'
  }
};

// ========================================
// GÉNÉRATION CLÉS COMPOSITES
// ========================================

/**
 * Génère une clé unique pour un moment
 */
export function generateMomentKey(moment) {
  return `moment:${moment.id}`;
}

/**
 * Génère une clé unique pour un post Mastodon
 */
export function generatePostKey(post) {
  return `post:${post.id}`;
}

/**
 * Génère une clé unique pour une photo moment
 */
export function generatePhotoMomentKey(photo) {
  if (!photo.google_drive_id) {
    console.warn('Photo moment sans google_drive_id:', photo);
    return null;
  }
  return `photo_moment:${photo.google_drive_id}`;
}

/**
 * Génère une clé unique pour une photo Mastodon
 */
export function generatePhotoMastodonKey(photo) {
  if (!photo.google_drive_id) {
    console.warn('Photo Mastodon sans google_drive_id:', photo);
    return null;
  }
  return `photo_mastodon:${photo.google_drive_id}`;
}

/**
 * Génère une clé générique selon le type de contenu
 */
export function generateContentKey(content, type) {
  switch (type) {
    case 'moment':
      return generateMomentKey(content);
    case 'post':
      return generatePostKey(content);
    case 'photo_moment':
      return generatePhotoMomentKey(content);
    case 'photo_mastodon':
      return generatePhotoMastodonKey(content);
    default:
      console.error('Type de contenu inconnu:', type);
      return null;
  }
}

// ========================================
// HIÉRARCHIE - RÉCUPÉRATION ENFANTS
// ========================================

/**
 * Récupère toutes les clés enfants d'un moment
 * @param {Object} moment - Moment complet
 * @returns {Object} { all, posts, postPhotos, momentPhotos }
 */
export function getMomentChildrenKeys(moment) {
  const postKeys = [];
  const postPhotoKeys = [];
  const momentPhotoKeys = [];
  
  // Posts du moment
  moment.posts?.forEach(post => {
    const key = generatePostKey(post);
    postKeys.push(key);
  });
  
  // Photos des posts
  moment.posts?.forEach(post => {
    post.photos?.forEach(photo => {
      const key = generatePhotoMastodonKey(photo);
      if (key) postPhotoKeys.push(key);
    });
  });
  
  // Photos du moment
  moment.dayPhotos?.forEach(photo => {
    const key = generatePhotoMomentKey(photo);
    if (key) momentPhotoKeys.push(key);
  });
  
  return {
    all: [...postKeys, ...postPhotoKeys, ...momentPhotoKeys],
    posts: postKeys,
    postPhotos: postPhotoKeys,
    momentPhotos: momentPhotoKeys
  };
}

/**
 * Récupère toutes les clés photos d'un post
 * @param {Object} post - Post complet
 * @returns {Array<string>} Clés des photos
 */
export function getPostChildrenKeys(post) {
  const keys = [];
  
  post.photos?.forEach(photo => {
    const key = generatePhotoMastodonKey(photo);
    if (key) keys.push(key);
  });
  
  return keys;
}

// ========================================
// GÉNÉRATION ID THÈME
// ========================================

/**
 * Génère un ID unique pour un thème à partir de son nom
 */
export function generateThemeId(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ========================================
// COMPTAGE & STATISTIQUES
// ========================================

/**
 * Compte le nombre de contenus taggués pour un thème
 */
export function countThemeContents(themeAssignments, themeId) {
  const contents = themeAssignments.getAllContentsByTheme(themeId);
  
  let momentCount = 0;
  let postCount = 0;
  let photoMomentCount = 0;
  let photoMastodonCount = 0;
  
  contents.forEach(key => {
    if (key.startsWith('moment:')) momentCount++;
    else if (key.startsWith('post:')) postCount++;
    else if (key.startsWith('photo_moment:')) photoMomentCount++;
    else if (key.startsWith('photo_mastodon:')) photoMastodonCount++;
  });
  
  return {
    momentCount,
    postCount,
    photoMomentCount,
    photoMastodonCount,
    photoCount: photoMomentCount + photoMastodonCount,
    totalCount: contents.length
  };
}

/**
 * Récupère les moments contenant au moins un contenu taggué
 */
export function getMomentsByTheme(moments, themeAssignments, themeId) {
  return moments.filter(moment => {
    // Vérifier le moment lui-même
    const momentKey = generateMomentKey(moment);
    const momentThemes = themeAssignments.getThemesForContent(momentKey);
    if (momentThemes.includes(themeId)) return true;
    
    // Vérifier posts
    const hasTaggedPost = moment.posts?.some(post => {
      const key = generatePostKey(post);
      const themes = themeAssignments.getThemesForContent(key);
      return themes.includes(themeId);
    });
    if (hasTaggedPost) return true;
    
    // Vérifier photos moment
    const hasTaggedPhoto = moment.dayPhotos?.some(photo => {
      const key = generatePhotoMomentKey(photo);
      if (!key) return false;
      const themes = themeAssignments.getThemesForContent(key);
      return themes.includes(themeId);
    });
    if (hasTaggedPhoto) return true;
    
    // Vérifier photos Mastodon
    const hasTaggedMastodonPhoto = moment.posts?.some(post => 
      post.photos?.some(photo => {
        const key = generatePhotoMastodonKey(photo);
        if (!key) return false;
        const themes = themeAssignments.getThemesForContent(key);
        return themes.includes(themeId);
      })
    );
    
    return hasTaggedMastodonPhoto;
  });
}

// ========================================
// TRI DES THÈMES
// ========================================

/**
 * Trie les thèmes selon l'ordre choisi
 */
export function sortThemes(themes, themeAssignments, sortOrder = 'usage') {
  if (!themes || themes.length === 0) return [];
  
  const themesWithStats = themes.map(theme => {
    const contents = themeAssignments?.getAllContentsByTheme(theme.id) || [];
    return {
      ...theme,
      usageCount: contents.length
    };
  });

  switch (sortOrder) {
    case 'usage':
      return themesWithStats.sort((a, b) => b.usageCount - a.usageCount);
    
    case 'created':
      return themesWithStats.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    
    case 'alpha':
      return themesWithStats.sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
    
    case 'manual':
      return themesWithStats.sort((a, b) => 
        (a.order || 999) - (b.order || 999)
      );
    
    default:
      return themesWithStats;
  }
}

// ========================================
// VALIDATION
// ========================================

/**
 * Valide la structure d'un thème
 */
export function validateTheme(theme) {
  const errors = [];
  
  if (!theme.name || theme.name.trim() === '') {
    errors.push('Le nom du thème est requis');
  }
  
  if (!theme.icon || theme.icon.trim() === '') {
    errors.push('L\'icône du thème est requise');
  }
  
  if (!theme.color || !THEME_COLORS[theme.color]) {
    errors.push('Couleur invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}