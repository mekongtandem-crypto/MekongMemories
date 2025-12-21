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
  console.log(`✅ v2.25: Moment ${momentId} marqué comme consulté`);
}

/**
 * Vérifier si un moment est "nouveau" (créé par autre user, jamais consulté)
 * @param {Object} moment - Moment à vérifier
 * @param {string} userId - ID de l'utilisateur courant
 * @returns {boolean}
 */
export function isMomentNew(moment, userId) {
  if (!moment || !userId) {
    console.log('🔍 v2.25 isMomentNew: moment ou userId manquant', { moment: !!moment, userId });
    return false;
  }

  // Si le moment a source='imported', il a été créé par un utilisateur
  // Vérifier qui l'a créé (via createdBy ou importedBy)
  const createdByOther = moment.source === 'imported' &&
                         moment.importedBy &&
                         moment.importedBy !== userId;

  console.log('🔍 v2.25 isMomentNew:', {
    momentId: moment.id,
    momentTitle: moment.title,
    source: moment.source,
    importedBy: moment.importedBy,
    currentUserId: userId,
    createdByOther
  });

  if (!createdByOther) return false;

  // Vérifier si jamais consulté
  const tracking = getMomentReadStatus(moment.id, userId);
  const isNew = !tracking?.hasBeenOpened;

  console.log('🔍 v2.25 isMomentNew result:', {
    momentId: moment.id,
    tracking,
    isNew
  });

  return isNew;
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

  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const momentId = entry.target.dataset.momentId;
        if (momentId) {
          // Marquer comme vu après 1 seconde de visibilité
          setTimeout(() => {
            if (entry.isIntersecting) {
              markMomentAsOpened(momentId, userId);
              if (onMomentSeen) onMomentSeen(momentId);
            }
          }, 1000);
        }
      }
    });
  };

  return new IntersectionObserver(callback, options);
}
