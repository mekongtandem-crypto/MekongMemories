// ==================== DÉBUT DU FICHIER ====================
/**
 * sessionUtils.js v2.0 - Phase 15 : Système notifications
 * ✅ SUPPRIMÉ : SESSION_STATUS.STALE (urgent 7 jours)
 * ✅ AJOUTÉ : SESSION_STATUS.NOTIFIED (priorité 1)
 */

// ========================================
// CONSTANTES
// ========================================

export const SESSION_STATUS = {
  NOTIFIED: 'notified',        // ✅ NOUVEAU - Priorité 1
  PENDING_YOU: 'pending_you',  // Priorité 2
  PENDING_OTHER: 'pending_other', // Priorité 3
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const STATUS_CONFIG = {
  [SESSION_STATUS.NOTIFIED]: {
    label: 'Notifiée',
    icon: '🔔',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    priority: 1
  },
  [SESSION_STATUS.PENDING_YOU]: {
    label: 'À traiter',
    icon: '🟡',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    priority: 2
  },
  [SESSION_STATUS.PENDING_OTHER]: {
    label: 'En attente',
    icon: '🔵',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-300',
    priority: 3
  },
  [SESSION_STATUS.ACTIVE]: {
    label: 'Active',
    icon: '🟢',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    priority: 4
  },
  [SESSION_STATUS.COMPLETED]: {
    label: 'Terminée',
    icon: '✅',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    priority: 5
  },
  [SESSION_STATUS.ARCHIVED]: {
    label: 'Archivée',
    icon: '📦',
    color: 'gray',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-200',
    priority: 6
  }
};

export const SORT_OPTIONS = {
  URGENCY: 'urgency',
  DATE: 'date',
  CHRONO: 'chrono',
  ACTIVITY: 'activity'
};

export const SUGGESTION_MODES = {
  CONTENT: 'content',
  CHRONO: 'chrono',
  RANDOM: 'random'
};

// ========================================
// CALCUL STATUTS
// ========================================

export function calculateSessionStatus(session, currentUserId) {
  // États méta (priorité absolue)
  if (session.archived) return { status: SESSION_STATUS.ARCHIVED };
  if (session.completed) return { status: SESSION_STATUS.COMPLETED };

  // PRIORITÉ 1 : Notification non répondue
  // On utilise getNotificationForSession pour récupérer l'objet complet
  const notification = window.notificationManager?.getNotificationForSession(
    session.id, 
    currentUserId
  );

  if (notification) {
    // On retourne le statut ET l'expéditeur de la notif
    return { status: SESSION_STATUS.NOTIFIED, notifiedBy: notification.from };
  }
  
  // Session vide = active pour l'instant
  if (!session.notes || session.notes.length === 0) {
    return { status: SESSION_STATUS.ACTIVE };
  }
  
  const lastMessage = session.notes[session.notes.length - 1];
  const daysSinceLastMsg = (Date.now() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60 * 24);
  
  // PRIORITÉ 2 : À traiter (dernier msg ≠ currentUser)
  if (lastMessage.author !== currentUserId) {
    return { status: SESSION_STATUS.PENDING_YOU };
  }
  
  // PRIORITÉ 3 : En attente (dernier msg = currentUser)
  // Sous-cas : si très récent (< 24h) = ACTIVE
  if (daysSinceLastMsg < 1) {
    return { status: SESSION_STATUS.ACTIVE };
  }

  return { status: SESSION_STATUS.PENDING_OTHER };
}

export function enrichSessionWithStatus(session, currentUserId) {
  // statusInfo contient maintenant { status: '...', notifiedBy: '...' }
  const statusInfo = calculateSessionStatus(session, currentUserId);
  const config = STATUS_CONFIG[statusInfo.status];
  
  return {
    ...session,
    // On garde "status" pour la compatibilité avec le reste du code (tri, filtres)
    status: statusInfo.status, 
    statusInfo, // On stocke l'objet complet
    statusConfig: config
  };
}

// ========================================
// STATISTIQUES
// ========================================

export function calculateSessionStats(sessions, currentUserId, masterIndex) {
  const enrichedSessions = sessions.map(s => enrichSessionWithStatus(s, currentUserId));
  
  const exploredMomentIds = new Set(sessions.map(s => s.gameId));
  const totalMoments = masterIndex?.moments?.length || 0;
  const exploredMoments = exploredMomentIds.size;
  
  const byStatus = enrichedSessions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  
  const totalMessages = sessions.reduce((sum, s) => sum + (s.notes?.length || 0), 0);
  
  return {
    exploredMoments,
    totalMoments,
    unexploredMoments: totalMoments - exploredMoments,
    notified: byStatus[SESSION_STATUS.NOTIFIED] || 0,
    pendingYou: byStatus[SESSION_STATUS.PENDING_YOU] || 0,
    pendingOther: byStatus[SESSION_STATUS.PENDING_OTHER] || 0,
    active: byStatus[SESSION_STATUS.ACTIVE] || 0,
    completed: byStatus[SESSION_STATUS.COMPLETED] || 0,
    archived: byStatus[SESSION_STATUS.ARCHIVED] || 0,
    totalMessages,
    totalSessions: sessions.length
  };
}

export function getActivitySinceLastVisit(sessions, currentUserId, lastVisit) {
  if (!lastVisit) return { newSessions: [], newMessages: [] };
  
  const lastVisitTime = new Date(lastVisit).getTime();
  
  const newSessions = sessions.filter(s => 
    new Date(s.createdAt).getTime() > lastVisitTime
  );
  
  const newMessages = sessions
    .filter(s => s.notes?.some(note => 
      new Date(note.timestamp).getTime() > lastVisitTime && 
      note.author !== currentUserId
    ))
    .map(s => ({
      session: s,
      newCount: s.notes.filter(note => 
        new Date(note.timestamp).getTime() > lastVisitTime && 
        note.author !== currentUserId
      ).length
    }))
    .filter(item => item.newCount > 0);
  
  return { newSessions, newMessages };
}

// ========================================
// FILTRAGE
// ========================================

export function filterSessionsByStatus(sessions, statusFilter) {
  if (statusFilter === 'all') return sessions;
  return sessions.filter(s => s.status === statusFilter);
}

// ========================================
// TRI
// ========================================

export function sortSessions(sessions, sortBy) {
  const sorted = [...sessions];
  
  switch (sortBy) {
    case SORT_OPTIONS.URGENCY:
      return sorted.sort((a, b) => {
        if (a.statusConfig.priority !== b.statusConfig.priority) {
          return a.statusConfig.priority - b.statusConfig.priority;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    
    case SORT_OPTIONS.DATE:
      return sorted.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    
    case SORT_OPTIONS.CHRONO:
      return sorted.sort((a, b) => {
        const dayA = a.gameId ? parseInt(a.gameId.split('_')[1] || 0) : 0;
        const dayB = b.gameId ? parseInt(b.gameId.split('_')[1] || 0) : 0;
        return dayA - dayB;
      });
    
    case SORT_OPTIONS.ACTIVITY:
      return sorted.sort((a, b) => 
        (b.notes?.length || 0) - (a.notes?.length || 0)
      );
    
    default:
      return sorted;
  }
}

// ========================================
// SUGGESTIONS MOMENTS
// ========================================

function calculateContentScore(moment) {
  const photoScore = (moment.dayPhotos?.length || 0);
  const postScore = (moment.posts?.length || 0) * 3;
  return photoScore + postScore;
}

export function suggestUnexploredMoments(masterIndex, sessions, mode, limit = 5) {
  if (!masterIndex?.moments) return [];
  
  const exploredMomentIds = new Set(sessions.map(s => s.gameId));
  let unexplored = masterIndex.moments.filter(m => !exploredMomentIds.has(m.id));
  
  switch (mode) {
    case SUGGESTION_MODES.CONTENT:
      unexplored = unexplored.sort((a, b) => 
        calculateContentScore(b) - calculateContentScore(a)
      );
      break;
    
    case SUGGESTION_MODES.CHRONO:
      unexplored = unexplored.sort((a, b) => a.dayStart - b.dayStart);
      break;
    
    case SUGGESTION_MODES.RANDOM:
      unexplored = unexplored.sort(() => Math.random() - 0.5);
      break;
  }
  
  return unexplored.slice(0, limit);
}

// ========================================
// FORMATAGE
// ========================================

export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffMs = now - past;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `il y a ${hours}h`;
  if (minutes > 0) return `il y a ${minutes}min`;
  return 'à l\'instant';
}

export function formatMessagePreview(message, maxLength = 60) {
  if (!message?.content) return '';
  
  const cleaned = message.content
    .replace(/\n/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}

// ========================================
// PHASE 19C : ORIGINE ENRICHIE
// ========================================

/**
 * Récupère infos origine d'une session AVEC enrichissement titre réel
 */
export function getOriginInfo(session, masterIndex) {
  if (!session?.originContent) return null;
  
  const { type, id } = session.originContent;
  let enrichedContent = { ...session.originContent };
  let originThemes = [];
  
  //  Récupérer le vrai titre depuis masterIndex
  if (masterIndex?.moments) {
    switch(type) {
      case 'moment':
        const moment = masterIndex.moments.find(m => m.id === id);
        if (moment) {
          enrichedContent.title = moment.displayTitle || moment.title;
        }
        break;
      
      case 'post':
        for (const moment of masterIndex.moments) {
          const post = moment.posts?.find(p => p.id === id);
          if (post) {
            const postTitle = post.content?.split('\n')[0] || 'Article';
            enrichedContent.title = postTitle;
            break;
          }
        }
        break;
      
      case 'photo':
        // Chercher la photo dans tous les moments
        for (const moment of masterIndex.moments) {
          // Chercher dans dayPhotos
          const dayPhoto = moment.dayPhotos?.find(p => 
            p.filename === id || p.google_drive_id === id
          );
          if (dayPhoto) {
            enrichedContent.title = `Photo de ${moment.displayTitle || moment.title}`;
            enrichedContent.contextMoment = moment;
            break;
          }
          
          // Chercher dans postPhotos
          if (moment.posts) {
            for (const post of moment.posts) {
              const postPhoto = post.photos?.find(p => 
                p.filename === id || p.google_drive_id === id
              );
              if (postPhoto) {
                const postTitle = post.content?.split('\n')[0] || 'Article';
                enrichedContent.title = `Photo de "${postTitle}"`;
                enrichedContent.contextPost = post;
                enrichedContent.contextMoment = moment;
                break;
              }
            }
          }
          
          if (enrichedContent.contextMoment) break;
        }
        break;
    }
  }
  
  // Récupérer thèmes via themeAssignments
  if (window.themeAssignments?.isLoaded) {
    const themeIds = window.themeAssignments.getThemesForContent(type, id);
    if (themeIds?.length > 0 && masterIndex?.themes) {
      originThemes = themeIds
        .map(tid => masterIndex.themes.find(t => t.id === tid))
        .filter(Boolean);
    }
  }
  
  return {
    originContent: enrichedContent,
    originThemes
  };
}

/**
 * Formatte titre origine pour affichage
 */
export function formatOriginTitle(originContent) {
  if (!originContent) return 'N/A';
  
  switch(originContent.type) {
    case 'moment':
      return originContent.title || 'Moment';
    case 'post':
      const postTitle = originContent.title || 'Article';
      return postTitle.length > 40 ? postTitle.substring(0, 40) + '...' : postTitle;
    case 'photo':
      return originContent.filename || originContent.title || 'Photo';
    default:
      return originContent.title || 'Contenu';
  }
}

/**
 * Retourne icône selon type contenu
 */
export function getOriginIcon(contentType) {
  switch(contentType) {
    case 'moment': return '⭐';
    case 'post': return '📰';
    case 'photo': return '📷';
    default: return '📌';
  }
}

// ========================================
// PHASE 19D : COMPTEURS SESSIONS (v2.1 - Optimisé ContentLinks)
// ========================================

/**
 * Récupère sessions liées à un contenu
 * 
 * ⭐ v2.1 Phase 19D : OPTIMISATION - Utilise ContentLinks au lieu de parcourir toutes les sessions
 * AVANT : O(n) - Parcourait toutes les sessions (~500ms pour 50 sessions)
 * APRÈS : O(1) - Lookup direct dans l'index (~5ms)
 * 
 * @param {Array} sessions - Liste complète des sessions (pour enrichissement)
 * @param {string} contentType - 'photo' | 'post' | 'moment'
 * @param {string} contentId - ID du contenu
 * @returns {Array} Sessions complètes
 */
export function getSessionsForContent(sessions, contentType, contentId) {
  if (!sessions || !contentType || !contentId) return [];
  
  // ⭐ OPTIMISATION : Utiliser ContentLinks si disponible
  if (window.contentLinks?.isLoaded) {
    try {
      // 1. Récupérer sessionIds via l'index (rapide : O(1))
      const sessionIds = window.contentLinks.getSessionsForContent(contentType, contentId);
      
      // 2. Enrichir avec objets sessions complets
      const linkedSessions = sessionIds
        .map(sessionId => sessions.find(s => s.id === sessionId))
        .filter(Boolean);  // Supprimer undefined si session supprimée
      
      // console.log(`⚡ getSessionsForContent(${contentType}, ${contentId}) via ContentLinks:`, linkedSessions.length);
      return linkedSessions;
      
    } catch (error) {
      console.warn('⚠️ ContentLinks error, fallback recherche manuelle:', error);
      // Fallback vers recherche manuelle en cas d'erreur
    }
  }
  
  // ⚠️ FALLBACK : Recherche manuelle (lent si ContentLinks indisponible)
  console.warn('⚠️ ContentLinks non disponible, recherche manuelle (lent)');
  
  return sessions.filter(session => {
    // Match origine directe
    if (session.originContent?.type === contentType && 
        session.originContent?.id === contentId) {
      return true;
    }
    
    // Match moment via momentId/gameId
    if (contentType === 'moment') {
      return session.momentId === contentId || session.gameId === contentId;
    }
    
    // ⭐ NOUVEAU : Match liens dans messages (très coûteux sans ContentLinks !)
    if (session.notes) {
      return session.notes.some(note => 
        note.linkedContent?.type === contentType && 
        note.linkedContent?.id === contentId
      );
    }
    
    return false;
  });
}

// ==================== FIN DU FICHIER ====================