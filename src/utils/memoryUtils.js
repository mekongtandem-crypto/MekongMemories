/**
 * memoryUtils.js v1.0 - Phase v2.25 : Tracking nouveaux souvenirs
 * ✅ Système de tracking localStorage pour moments/souvenirs
 * ✅ Détection nouveaux souvenirs (créés par autre user)
 * ✅ Marquage automatique "consulté" au scroll
 */

// ========================================
// TRACKING LECTURE SOUVENIRS
// ========================================

/**
 * Obtenir le statut de lecture d'un moment pour l'utilisateur courant
 * @param {string} momentId - ID du moment
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} { hasBeenOpened: boolean, lastOpenedAt: string }
 */
export function getMomentReadStatus(momentId, userId) {
  if (!momentId || !userId) return null;

  const storageKey = `mekong_memoryReadStatus_${userId}`;
  const allTracking = JSON.parse(localStorage.getItem(storageKey) || '{}');

  return allTracking[momentId] || null;
}

/**
 * Marquer un moment comme consulté
 * @param {string} momentId - ID du moment
 * @param {string} userId - ID de l'utilisateur
 */
export function markMomentAsOpened(momentId, userId) {
  if (!momentId || !userId) return;

  const storageKey = `mekong_memoryReadStatus_${userId}`;
  const allTracking = JSON.parse(localStorage.getItem(storageKey) || '{}');

  allTracking[momentId] = {
    hasBeenOpened: true,
    lastOpenedAt: new Date().toISOString()
  };

  localStorage.setItem(storageKey, JSON.stringify(allTracking));
  // console.log(`✅ v2.25: Moment ${momentId} marqué comme consulté`); // ⭐ v2.26f : Désactivé pour éviter spam logs
}

/**
 * Vérifier si un moment est "nouveau" (créé par autre user, jamais consulté)
 * OU contient des nouveaux contenus (notes/photos ajoutés par autre user)
 * @param {Object} moment - Moment à vérifier
 * @param {string} userId - ID de l'utilisateur courant
 * @returns {boolean}
 */
export function isMomentNew(moment, userId) {
  if (!moment || !userId) {
    // console.log('🔍 v2.25 isMomentNew: moment ou userId manquant', { moment: !!moment, userId }); // ⭐ v2.26f : Désactivé
    return false;
  }

  // Récupérer le statut de lecture du moment
  const tracking = getMomentReadStatus(moment.id, userId);
  const lastOpenedAt = tracking?.lastOpenedAt ? new Date(tracking.lastOpenedAt) : null;

  // CAS 1 : Moment lui-même est nouveau (créé par autre user, jamais consulté)
  const momentIsNew = moment.source === 'imported' &&
                      moment.importedBy &&
                      moment.importedBy !== userId &&
                      !tracking?.hasBeenOpened;

  // console.log('🔍 v2.25 isMomentNew - Moment:', { // ⭐ v2.26f : Désactivé
  //   momentId: moment.id,
  //   momentTitle: moment.title,
  //   source: moment.source,
  //   importedBy: moment.importedBy,
  //   currentUserId: userId,
  //   momentIsNew
  // });

  if (momentIsNew) return true;

  // CAS 2 : Moment existant mais contient des nouveaux contenus depuis dernière consultation
  if (!lastOpenedAt) {
    // Si jamais consulté et pas nouveau moment, alors pas de nouveau contenu détectable
    return false;
  }

  // Vérifier les nouvelles notes (posts user_added créés par autre user)
  const hasNewPosts = (moment.posts || []).some(post => {
    if (post.category !== 'user_added' || post.source !== 'imported') return false;
    if (post.uploadedBy === userId) return false; // Créé par moi

    const postDate = new Date(post.date || post.createdAt || 0);
    return postDate > lastOpenedAt;
  });

  // Vérifier les nouvelles photos (dayPhotos uploadées par autre user)
  const hasNewPhotos = (moment.dayPhotos || []).some(photo => {
    if (photo.source !== 'imported') return false;
    if (photo.uploadedBy === userId) return false; // Uploadée par moi

    const photoDate = new Date(photo.uploadedAt || photo.createdAt || 0);
    return photoDate > lastOpenedAt;
  });

  // console.log('🔍 v2.25 isMomentNew - Contenus:', { // ⭐ v2.26f : Désactivé
  //   momentId: moment.id,
  //   hasNewPosts,
  //   hasNewPhotos,
  //   lastOpenedAt: lastOpenedAt.toISOString()
  // });

  return hasNewPosts || hasNewPhotos;
}

/**
 * Compter le nombre de nouveaux souvenirs
 * @param {Array} moments - Liste de tous les moments
 * @param {string} userId - ID de l'utilisateur courant
 * @returns {number}
 */
export function countNewMemories(moments, userId) {
  if (!moments || !userId) return 0;

  return moments.filter(moment => isMomentNew(moment, userId)).length;
}

/**
 * Obtenir la liste des nouveaux souvenirs
 * @param {Array} moments - Liste de tous les moments
 * @param {string} userId - ID de l'utilisateur courant
 * @returns {Array}
 */
export function getNewMemories(moments, userId) {
  if (!moments || !userId) return [];

  return moments
    .filter(moment => isMomentNew(moment, userId))
    .sort((a, b) => {
      // Trier par date de création (plus récent en premier)
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB - dateA;
    });
}

// ========================================
// MARQUAGE AUTOMATIQUE AU SCROLL
// ========================================

/**
 * Créer un IntersectionObserver pour marquer les moments comme vus au scroll
 * @param {string} userId - ID de l'utilisateur
 * @param {Function} onMomentSeen - Callback quand un moment est vu
 * @returns {IntersectionObserver}
 */
export function createMomentVisibilityObserver(userId, onMomentSeen) {
  const options = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.5 // 50% du moment visible
  };

  // ⭐ v2.26f : Set pour éviter de marquer plusieurs fois le même moment
  const markedMoments = new Set();

  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const momentId = entry.target.dataset.momentId;
        if (!momentId) return;

        // ⭐ v2.26f : Skip si déjà marqué dans cette session observer
        if (markedMoments.has(momentId)) return;

        // ⭐ v2.26f : Vérifier localStorage avant de marquer
        const tracking = getMomentReadStatus(momentId, userId);
        if (tracking?.hasBeenOpened) {
          // Déjà marqué dans localStorage, skip
          markedMoments.add(momentId);
          return;
        }

        // Marquer comme vu après 1 seconde de visibilité
        setTimeout(() => {
          if (entry.isIntersecting && !markedMoments.has(momentId)) {
            markedMoments.add(momentId);
            markMomentAsOpened(momentId, userId);
            if (onMomentSeen) onMomentSeen(momentId);
          }
        }, 1000);
      }
    });
  };

  return new IntersectionObserver(callback, options);
}
