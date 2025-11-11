/**
 * SessionsPage.jsx v7.2 - Phase 25 : Système lecture NEW/UNREAD
 * ✅ NEW (🆕) vs UNREAD (👀) indépendants des groupes
 * ✅ Badge prioritaire unique (haut droite)
 * ✅ Backgrounds progressifs (NEW > UNREAD > READ)
 * ✅ Borders discrets
 * ✅ Menu contextuel "Marquer comme lu/non lu"
 * ✅ Nouveaux emojis groupes
 */
import { safeStorage } from '../../utils/storage.js'; 
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import StatsModal from '../StatsModal.jsx';
import { 
  enrichSessionWithStatus,
  sortSessions,
  formatRelativeTime,
  formatMessagePreview,
  SORT_OPTIONS,
  SESSION_STATUS
} from '../../utils/sessionUtils.js';
import { 
  Clock, MoreVertical, Edit, Trash2, 
  Check, Archive, ChevronDown, X, Eye, EyeOff
} from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  
  // États UI
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem(`mekong_sessionSort_${app.currentUser?.id}`);
    return saved || SORT_OPTIONS.MODIFIED; // ✅ Par défaut : dernière modification
  });
  const [groupFilter, setGroupFilter] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [unreadFilter, setUnreadFilter] = useState(false);
  
  // ✅ Système de tracking lecture par session
  const [sessionReadStatus, setSessionReadStatus] = useState(() => {
    const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  
  // États sections repliables
  const [openSections, setOpenSections] = useState(() => {
    return safeStorage.get(
      `mekong_sessionGroups_${app.currentUser?.id}`,
      { pending_you: true, pending_other: false, completed: false }
    );
  });
  
  const menuRefs = useRef({});

  // Sauvegarder états sections
  useEffect(() => {
    if (app.currentUser?.id) {
      safeStorage.set(
        `mekong_sessionGroups_${app.currentUser.id}`,
        openSections
      );
    }
  }, [openSections, app.currentUser]);
  
  // ✅ Sauvegarder tracking lecture
  useEffect(() => {
    if (app.currentUser?.id) {
      localStorage.setItem(
        `mekong_sessionReadStatus_${app.currentUser.id}`,
        JSON.stringify(sessionReadStatus)
      );
    }
  }, [sessionReadStatus, app.currentUser]);

  // Exposer callbacks pour TopBar
  useEffect(() => {
   window.sessionPageActions = {
      openStatsModal: () => setShowStatsModal(true),
      openPendingSections: () => {
        setOpenSections(prev => ({
          ...prev,
          pending_you: true
        }));
      }
    };
    window.sessionPageFilters = {
      setGroupFilter: setGroupFilter,
      setSortBy: setSortBy,
      setUnreadFilter: setUnreadFilter
    };
    window.sessionPageState = {
      activeFilter: groupFilter,
      unreadFilter: unreadFilter,
      currentSort: sortBy 
    };
    
    return () => {
      delete window.sessionPageActions;
      delete window.sessionPageFilters;
      delete window.sessionPageState;
    };
  }, [groupFilter, unreadFilter]);
  
  // Sauvegarder choix tri
  useEffect(() => {
    if (app.currentUser?.id) {
      localStorage.setItem(`mekong_sessionSort_${app.currentUser.id}`, sortBy);
    }
  }, [sortBy, app.currentUser]);

  // Fermer menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Enrichir sessions avec statuts
  const enrichedSessions = useMemo(() => {
    if (!app.sessions || !app.currentUser?.id) return [];
    
    return app.sessions.map(s => 
      enrichSessionWithStatus(s, app.currentUser.id)
    );
  }, [app.sessions, app.currentUser]);
  
  // ✅ Calculer état lecture pour chaque session
  const getReadState = (session) => {
    const tracking = sessionReadStatus[session.id];
    const lastMessage = session.notes?.[session.notes.length - 1];
    const lastMessageTime = lastMessage?.timestamp || session.createdAt;
    const lastMessageAuthor = lastMessage?.author || session.user;
    const sessionCreator = session.user;
    
    // ⚠️ IMPORTANT : Une session/message créé par le user courant ne peut pas être "non lu" pour lui
    
    // Si je suis le créateur et pas de message, c'est READ pour moi
    if (sessionCreator === app.currentUser?.id && !lastMessage) {
      return 'read';
    }
    
    // Si je suis l'auteur du dernier message, c'est READ pour moi
    if (lastMessageAuthor === app.currentUser?.id) {
      return 'read';
    }
    
    // NEW : jamais ouverte PAR MOI + créée par quelqu'un d'autre
    if (!tracking?.hasBeenOpened && sessionCreator !== app.currentUser?.id) {
      return 'new';
    }
    
    // UNREAD : nouveau message depuis dernière ouverture + message de quelqu'un d'autre
    if (tracking?.hasBeenOpened && 
        tracking.lastOpenedAt && 
        new Date(lastMessageTime) > new Date(tracking.lastOpenedAt) &&
        lastMessageAuthor !== app.currentUser?.id) {
      return 'unread';
    }
    
    // READ : à jour
    return 'read';
  };

  // Grouper sessions par statut
  const groupedSessions = useMemo(() => {
    const groups = {
      pending_you: [], // ✅ Contient maintenant NOTIFIED + PENDING_YOU
      pending_other: [],
      completed: []
    };
    
    enrichedSessions.forEach(s => {
      if (s.completed || s.archived) {
        groups.completed.push(s);
      } else if (s.status === SESSION_STATUS.NOTIFIED || s.status === SESSION_STATUS.PENDING_YOU) {
        // ✅ Fusion : NOTIFIED + PENDING_YOU dans même section
        groups.pending_you.push(s);
      } else if (s.status === SESSION_STATUS.PENDING_OTHER || s.status === SESSION_STATUS.ACTIVE) {
        groups.pending_other.push(s);
      } else {
        console.warn('⚠️ Session avec statut non géré:', s.status, s.id);
        groups.pending_other.push(s);
      }
    });
    
    // Trier chaque groupe
    Object.keys(groups).forEach(key => {
      groups[key] = sortSessions(groups[key], sortBy);
    });
    
    return groups;
  }, [enrichedSessions, sortBy]);

  // Filtrer selon badge TopBar cliqué + filtre unread
  const filteredGroups = useMemo(() => {
    let groups = groupFilter ? { [groupFilter]: groupedSessions[groupFilter] } : groupedSessions;
    
    // ✅ Si filtre unread actif (new ou unread)
    if (unreadFilter) {
      const filteredGroupsCopy = {};
      Object.keys(groups).forEach(key => {
        filteredGroupsCopy[key] = groups[key].filter(session => {
          const state = getReadState(session);
          // Si filtre = 'new' → uniquement NEW
          // Si filtre = 'unread' → uniquement UNREAD
          return state === unreadFilter;
        });
      });
      return filteredGroupsCopy;
    }
    
    return groups;
  }, [groupedSessions, groupFilter, unreadFilter]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleOpenSession = async (session) => {
    // ✅ Marquer comme ouverte avec timestamp
    setSessionReadStatus(prev => ({
      ...prev,
      [session.id]: {
        hasBeenOpened: true,
        lastOpenedAt: new Date().toISOString()
      }
    }));
    
    await app.openChatSession(session);
  };

  const handleStartEdit = (e, session) => {
    e.stopPropagation();
    setEditingSession(session.id);
    setEditTitle(session.gameTitle);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (e, sessionId) => {
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingSession(null);
      return;
    }

    const session = app.sessions.find(s => s.id === sessionId);
    if (session) {
      const updatedSession = { ...session, gameTitle: editTitle.trim() };
      await app.updateSession(updatedSession);
    }
    setEditingSession(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingSession(null);
  };

  const handleMarkCompleted = async (e, session) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    const updatedSession = { 
      ...session, 
      completed: !session.completed 
    };
    await app.updateSession(updatedSession);
  };

  const handleArchive = async (e, session) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    const updatedSession = { 
      ...session, 
      archived: !session.archived 
    };
    await app.updateSession(updatedSession);
  };

  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    if (!confirm(`Supprimer la session "${sessionTitle}" ?`)) return;
    await app.deleteSession(sessionId);
  };
  
  // ✅ Toggle read/unread manuel
  const handleToggleRead = (e, sessionId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    setSessionReadStatus(prev => {
      const current = prev[sessionId];
      
      if (!current?.hasBeenOpened) {
        // Marquer comme lue
        return {
          ...prev,
          [sessionId]: {
            hasBeenOpened: true,
            lastOpenedAt: new Date().toISOString()
          }
        };
      } else {
        // Marquer comme non lue (reset timestamp à 0)
        return {
          ...prev,
          [sessionId]: {
            hasBeenOpened: true,
            lastOpenedAt: '1970-01-01T00:00:00.000Z'
          }
        };
      }
    });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ========================================
  // RENDER
  // ========================================

  if (app.isLoading) {
    return <div className="p-12 text-center">Chargement des sessions...</div>;
  }

  const totalSessions = enrichedSessions.length;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      
      {/* Message filtre actif */}
      {groupFilter && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Filtre actif : {
              groupFilter === 'pending_you' ? '💬 En attente de vous' :
              groupFilter === 'pending_other' ? '📨 Messages envoyés' :
              groupFilter === 'completed' ? '✅ Sessions closes' :
              'Inconnu'
            }
          </span>
          <button
            onClick={() => setGroupFilter(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* ✅ Message filtre unread actif */}
      {unreadFilter && (
        <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
            Affichage : 👀 Non lues uniquement
          </span>
          <button
            onClick={() => setUnreadFilter(false)}
            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Sections */}
      <div className="space-y-4">
        
        
        {/* ⏳ En attente (Amber) */}
        {filteredGroups.pending_you && filteredGroups.pending_you.length > 0 && (
          <SessionGroup
            emoji="⏳"
            subtitle="Causeries en attente de vous..."
            sessions={filteredGroups.pending_you}
            isOpen={openSections.pending_you}
            onToggle={() => toggleSection('pending_you')}
            color="amber"
            currentUserId={app.currentUser?.id}
            editingSession={editingSession}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRefs={menuRefs}
            onOpen={handleOpenSession}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onMarkCompleted={handleMarkCompleted}
            onArchive={handleArchive}
            onDelete={handleDeleteSession}
            onToggleRead={handleToggleRead}
            getReadState={getReadState}
          />
        )}
        
        {/* 📨 Envoyées (Green) */}
        {filteredGroups.pending_other && filteredGroups.pending_other.length > 0 && (
          <SessionGroup
            emoji="📨"
            subtitle="Messages envoyés..."
            sessions={filteredGroups.pending_other}
            isOpen={openSections.pending_other}
            onToggle={() => toggleSection('pending_other')}
            color="green"
            currentUserId={app.currentUser?.id}
            editingSession={editingSession}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRefs={menuRefs}
            onOpen={handleOpenSession}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onMarkCompleted={handleMarkCompleted}
            onArchive={handleArchive}
            onDelete={handleDeleteSession}
            onToggleRead={handleToggleRead}
            getReadState={getReadState}
          />
        )}
        
        {/* ✅ Closes (Blue) */}
        {filteredGroups.completed && filteredGroups.completed.length > 0 && (
          <SessionGroup
            emoji="✅"
            subtitle="Sessions closes"
            sessions={filteredGroups.completed}
            isOpen={openSections.completed}
            onToggle={() => toggleSection('completed')}
            color="blue"
            currentUserId={app.currentUser?.id}
            editingSession={editingSession}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRefs={menuRefs}
            onOpen={handleOpenSession}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onMarkCompleted={handleMarkCompleted}
            onArchive={handleArchive}
            onDelete={handleDeleteSession}
            onToggleRead={handleToggleRead}
            getReadState={getReadState}
          />
        )}
        
        {totalSessions === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune session pour le moment
          </div>
        )}
        
        {totalSessions > 0 && Object.values(filteredGroups).every(g => g.length === 0) && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune session ne correspond aux filtres actifs
          </div>
        )}
        
      </div>
      
      {/* Modal Stats */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        sessions={app.sessions}
        currentUser={app.currentUser}
      />
      
    </div>
  );
}

// ========================================
// COMPOSANTS
// ========================================

function SessionGroup({ 
  emoji, subtitle, sessions, isOpen, onToggle, color,
  currentUserId, editingSession, editTitle, setEditTitle,
  openMenuId, setOpenMenuId, menuRefs,
  onOpen, onStartEdit, onSaveEdit, onCancelEdit,
  onMarkCompleted, onArchive, onDelete, onToggleRead, getReadState
}) {
  const colorClasses = {
    orange: { 
      bg: 'bg-orange-50 dark:bg-orange-900/20', 
      border: 'border-orange-100 dark:border-orange-800', 
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30', 
      badgeBg: 'bg-orange-500 dark:bg-orange-600',
      cardBg: 'bg-orange-50 dark:bg-orange-900/10'
    },
    amber: { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      border: 'border-amber-100 dark:border-amber-800', 
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30', 
      badgeBg: 'bg-amber-500 dark:bg-amber-600',
      cardBg: 'bg-amber-50 dark:bg-amber-900/10'
    },
    green: { 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      border: 'border-green-100 dark:border-green-800', 
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30', 
      badgeBg: 'bg-green-500 dark:bg-green-600',
      cardBg: 'bg-green-50 dark:bg-green-900/10'
    },
    blue: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      border: 'border-blue-100 dark:border-blue-800', 
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30', 
      badgeBg: 'bg-blue-500 dark:bg-blue-600',
      cardBg: 'bg-blue-50 dark:bg-blue-900/10'
    }
  };
  
  const colors = colorClasses[color];
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg overflow-visible`}>
      
      {/* Header compact */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 ${colors.hover} transition-colors duration-150`}
      >
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${colors.badgeBg} text-white text-xs font-bold shadow-sm`}>
            <span>{emoji}</span>
            <span>{sessions.length}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subtitle}</span>
        </div>
        
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Sessions */}
      {isOpen && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {sessions.map(session => (
            <SessionRow
              key={session.id}
              session={session}
              isEditing={editingSession === session.id}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              currentUserId={currentUserId}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              menuRefs={menuRefs}
              onOpen={onOpen}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onMarkCompleted={onMarkCompleted}
              onArchive={onArchive}
              onDelete={onDelete}
              onToggleRead={onToggleRead}
              readState={getReadState(session)}
              cardBg={colors.cardBg}
            />
          ))}
        </div>
      )}
      
    </div>
  );
}

function SessionRow({ 
  session, isEditing, editTitle, setEditTitle, currentUserId,
  openMenuId, setOpenMenuId, menuRefs,
  onOpen, onStartEdit, onSaveEdit, onCancelEdit,
  onMarkCompleted, onArchive, onDelete, onToggleRead, readState, cardBg
}) {
  const lastAuthor = session.notes?.[session.notes.length - 1]?.author || session.user;
  const lastAuthorInfo = userManager.getUser(lastAuthor);
  const lastAuthorStyle = userManager.getUserStyle(lastAuthor);
  const lastMessage = session.notes?.[session.notes.length - 1];
  
  // ✅ Backgrounds progressifs selon état lecture
  const getBackgroundClass = () => {
    if (readState === 'new') {
      return 'bg-green-100 dark:bg-green-900/40'; // Très visible
    } else if (readState === 'unread') {
      return 'bg-orange-100 dark:bg-orange-900/40'; // Moyennement visible
    } else {
      return cardBg || 'bg-white dark:bg-gray-800'; // Normal
    }
  };
  
  return (
    <div 
      onClick={() => !isEditing && onOpen(session)}
      className={`${getBackgroundClass()} rounded-lg p-3 transition-all duration-150 relative ${
        isEditing 
          ? 'border border-gray-300 dark:border-gray-600' 
          : 'border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md cursor-pointer'
      }`}
    >
      {/* Badge 🔔 Notifié (haut gauche) */}
      {session.status === SESSION_STATUS.NOTIFIED && !isEditing && (
        <div className="absolute -top-2 -left-2 flex items-center bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
          <span className="mr-1.5">🔔</span>
          <span>
            {userManager.getUser(session.statusInfo.notifiedBy)?.name || '...'}
          </span>
        </div>
      )}
      
      {/* ✅ Badge prioritaire NEW/UNREAD (haut droite) */}
      {!isEditing && readState !== 'read' && (
        <div className={`absolute -top-2 -right-2 flex items-center gap-1 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10 ${
          readState === 'new' 
            ? 'bg-green-600' 
            : 'bg-orange-600'
        }`}>
          <span>{readState === 'new' ? '🆕' : '👀'}</span>
          <span>{readState === 'new' ? 'Nouvelle' : 'Non lue'}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        
        {/* Titre */}
        <div className="flex-1 min-w-0 mr-3">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit(e, session.id);
                  if (e.key === 'Escape') onCancelEdit(e);
                }}
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded font-medium focus:ring-2 focus:ring-amber-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={(e) => onSaveEdit(e, session.id)} className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors duration-150">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{session.gameTitle}</div>
              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="flex items-center space-x-1">
                  <span className="text-sm">💬</span>
                  <span>{session.notes?.length || 0}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(lastMessage?.timestamp || session.createdAt)}</span>
                </span>
                <span className={`flex items-center space-x-1 ${lastAuthorStyle.text}`}>
                  <span>{lastAuthorInfo?.emoji || '👤'}</span>
                  <span>{lastAuthorInfo?.name}</span>
                </span>
              </div>
            </>         
          )}
        </div>
        
        {/* Menu avec z-index élevé */}
        {!isEditing && (
          <div 
            className="relative flex-shrink-0" 
            ref={el => menuRefs.current[session.id] = el}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === session.id ? null : session.id);
              }}
              className="p-1 text-gray-600 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {openMenuId === session.id && (
                <div 
                className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-30"
              >
                
                {/* ✅ Marquer comme lu/non lu (conditionnel) */}
                <button
                  onClick={(e) => onToggleRead(e, session.id)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  {readState === 'read' ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Marquer comme non lu</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Marquer comme lu</span>
                    </>
                  )}
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={(e) => onStartEdit(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={(e) => onMarkCompleted(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <Check className="w-4 h-4" />
                  <span>{session.completed ? 'Non terminée' : 'Terminée'}</span>
                </button>
                
                <button
                  onClick={(e) => onArchive(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <Archive className="w-4 h-4" />
                  <span>{session.archived ? 'Désarchiver' : 'Archiver'}</span>
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                
                <button
                  onClick={(e) => onDelete(e, session.id, session.gameTitle)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center space-x-2 transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
                
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}