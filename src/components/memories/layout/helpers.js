/**
 * helpers.js v7.1 Dark mode
 * Fonctions utilitaires pour MemoriesPage
 * 
 * Contient :
 * - enrichMomentsWithData : enrichir données moments
 * - normalizePhoto : normaliser structure photo
 * - extractFilenameFromUrl : extraire nom fichier d'URL
 */

/**
 * Enrichir les moments avec données calculées
 */
export function enrichMomentsWithData(rawMoments) {
  if (!rawMoments) return [];

  return rawMoments.map((moment, index) => {
    const enrichedPosts = moment.posts?.map(post => ({
      ...post,
      photos: post.photos?.map(photo => normalizePhoto(photo)) || []
    })) || [];

    // ⭐ v2.8e : Séparer comptage posts Mastodon vs Note de photos (category: user_added)
    const mastodonPosts = enrichedPosts.filter(p => p.category !== 'user_added');
    const photoNotes = enrichedPosts.filter(p => p.category === 'user_added');

    // ⭐ v2.8f : Gérer jnnn pour moments importés (au lieu de dayStart/dayEnd)
    const displaySubtitle = moment.jnnn
      ? moment.jnnn  // Moments importés: utiliser jnnn directement
      : moment.dayEnd > moment.dayStart
        ? `J${moment.dayStart}-J${moment.dayEnd}`  // Moments multi-jours
        : `J${moment.dayStart}`;  // Moments simples

    return {
      ...moment,
      id: moment.id || `moment_${moment.dayStart}_${moment.dayEnd}_${index}`,
      posts: enrichedPosts,
      postCount: enrichedPosts.length,  // Total (rétrocompatibilité)
      mastodonPostCount: mastodonPosts.length,  // ⭐ Posts Mastodon uniquement
      noteCount: photoNotes.length,  // ⭐ Note de photos uniquement
      dayPhotoCount: moment.dayPhotos?.length || 0,
      postPhotoCount: moment.postPhotos?.length || 0,
      photoCount: (moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0),
      displayTitle: moment.title || `Moment du jour ${moment.dayStart}`,
      displaySubtitle: displaySubtitle,
      isEmpty: enrichedPosts.length === 0 &&
        ((moment.dayPhotos?.length || 0) + (moment.postPhotos?.length || 0)) === 0,
    };
  }).filter(moment => !moment.isEmpty);
}

/**
 * Normaliser structure photo
 */
export function normalizePhoto(photo) {
  // Déjà normalisée
  if (photo.filename && photo.google_drive_id) {
    return photo;
  }
  
  // Photo Mastodon avec URL
  if (photo.url) {
    return {
      filename: photo.name || extractFilenameFromUrl(photo.url),
      url: photo.url,
      width: photo.width,
      height: photo.height,
      mime_type: photo.mediaType || 'image/jpeg',
      isMastodonPhoto: true
    };
  }
  
  return photo;
}

/**
 * Extraire nom fichier d'une URL
 */
export function extractFilenameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'photo.jpg';
}