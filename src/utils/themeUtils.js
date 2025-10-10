/**
 * themeUtils.js v1.0
 * Utilitaires pour gestion des thèmes
 */

// ========================================
// CONSTANTES
// ========================================

export const THEME_COLORS = {
  purple: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-300', 
    badge: 'bg-purple-500',
    hover: 'hover:bg-purple-100'
  },
  orange: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-300', 
    badge: 'bg-orange-500',
    hover: 'hover:bg-orange-100'
  },
  blue: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-300', 
    badge: 'bg-blue-500',
    hover: 'hover:bg-blue-100'
  },
  green: { 
    bg: 'bg-green-50', 
    text: 'text-green-700', 
    border: 'border-green-300', 
    badge: 'bg-green-500',
    hover: 'hover:bg-green-100'
  },
  red: { 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-300', 
    badge: 'bg-red-500',
    hover: 'hover:bg-red-100'
  }
};

// ========================================
// GÉNÉRATION CLÉS COMPOSITES
// ========================================

/**
 * Génère une clé unique pour un post Mastodon
 */
export function generatePostKey(post) {
  // Utilise l'URL complète comme clé stable
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
// GÉNÉRATION ID THÈME
// ========================================

/**
 * Génère un ID unique pour un thème à partir de son nom
 */
export function generateThemeId(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Retire accents
    .replace(/[^a-z0-9]/g, '_') // Remplace espaces/caractères spéciaux
    .replace(/_+/g, '_') // Consolide les underscores multiples
    .replace(/^_|_$/g, ''); // Retire underscores début/fin
}

// ========================================
// COMPTAGE & STATISTIQUES
// ========================================

/**
 * Compte le nombre de contenus taggués pour un thème
 * @param {Object} themeAssignments - Instance de ThemeAssignments
 * @param {string} themeId - ID du thème
 * @returns {Object} { postCount, photoCount, totalCount }
 */
export function countThemeContents(themeAssignments, themeId) {
  const contents = themeAssignments.getAllContentsByTheme(themeId);
  
  let postCount = 0;
  let photoMomentCount = 0;
  let photoMastodonCount = 0;
  
  contents.forEach(key => {
    if (key.startsWith('post:')) postCount++;
    else if (key.startsWith('photo_moment:')) photoMomentCount++;
    else if (key.startsWith('photo_mastodon:')) photoMastodonCount++;
  });
  
  return {
    postCount,
    photoMomentCount,
    photoMastodonCount,
    photoCount: photoMomentCount + photoMastodonCount,
    totalCount: contents.length
  };
}

/**
 * Récupère les moments contenant au moins un contenu taggué avec ce thème
 * @param {Array} moments - Tous les moments
 * @param {Object} themeAssignments - Instance de ThemeAssignments
 * @param {string} themeId - ID du thème
 * @returns {Array} Moments filtrés
 */
export function getMomentsByTheme(moments, themeAssignments, themeId) {
  return moments.filter(moment => {
    // Vérifier si au moins un post du moment a ce thème
    const hasTaggedPost = moment.posts?.some(post => {
      const key = generatePostKey(post);
      const themes = themeAssignments.getThemesForContent(key);
      return themes.includes(themeId);
    });
    
    // Vérifier si au moins une photo moment a ce thème
    const hasTaggedPhoto = moment.dayPhotos?.some(photo => {
      const key = generatePhotoMomentKey(photo);
      if (!key) return false;
      const themes = themeAssignments.getThemesForContent(key);
      return themes.includes(themeId);
    });
    
    // Vérifier photos Mastodon dans les posts
    const hasTaggedMastodonPhoto = moment.posts?.some(post => 
      post.photos?.some(photo => {
        const key = generatePhotoMastodonKey(photo);
        if (!key) return false;
        const themes = themeAssignments.getThemesForContent(key);
        return themes.includes(themeId);
      })
    );
    
    return hasTaggedPost || hasTaggedPhoto || hasTaggedMastodonPhoto;
  });
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