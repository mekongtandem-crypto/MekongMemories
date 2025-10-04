// ==================== DÉBUT DU FICHIER ====================
/**
 * sessionUtils.js - Utilitaires pour SessionsPage
 * Calcul de statuts, tri, filtrage, suggestions
 */

// ========================================
// CONSTANTES
// ========================================

export const SESSION_STATUS = {
  PENDING_YOU: 'pending_you',
  PENDING_OTHER: 'pending_other',
  ACTIVE: 'active',
  STALE: 'stale',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const STATUS_CONFIG = {
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
    priority: 4
  },
  [SESSION_STATUS.ACTIVE]: {
    label: 'Active',
    icon: '🟢',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
    priority: 5
  },
  [SESSION_STATUS.STALE]: {
    label: 'Urgent',
    icon: '🟠',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-300',
    priority: 1
  },
  [SESSION_STATUS.COMPLETED]: {
    label: 'Terminée',
    icon: '✅',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    borderClass: 'border-gray-300',
    priority: 6
  },
  [SESSION_STATUS.ARCHIVED]: {
    label: 'Archivée',
    icon: '📦',
    color: 'gray',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-200',
    priority: 7
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
  if (session.archived) return SESSION_STATUS.ARCHIVED;
  if (session.completed) return SESSION_STATUS.COMPLETED;
  
  if (!session.notes || session.notes.length === 0) {
    return SESSION_STATUS.ACTIVE;
  }
  
  const lastMessage = session.notes[session.notes.length - 1];
  const daysSinceLastMsg = (Date.now() - new Date(lastMessage.timestamp)) / (1000 * 60 * 60 * 24);
  
  if (lastMessage.author === currentUserId) {
    return daysSinceLastMsg < 1 ? SESSION_STATUS.ACTIVE : SESSION_STATUS.PENDING_OTHER;
  }
  
  return daysSinceLastMsg > 7 ? SESSION_STATUS.STALE : SESSION_STATUS.PENDING_YOU;
}

export function enrichSessionWithStatus(session, currentUserId) {
  const status = calculateSessionStatus(session, currentUserId);
  const config = STATUS_CONFIG[status];
  
  return {
    ...session,
    status,
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
    pendingYou: byStatus[SESSION_STATUS.PENDING_YOU] || 0,
    pendingOther: byStatus[SESSION_STATUS.PENDING_OTHER] || 0,
    active: byStatus[SESSION_STATUS.ACTIVE] || 0,
    stale: byStatus[SESSION_STATUS.STALE] || 0,
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
// ==================== FIN DU FICHIER ====================