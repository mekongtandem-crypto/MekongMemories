/**
 * SessionsPage.jsx v7.4 - v2.29 : Fix statut NEW/UNREAD
 * ✅ NEW (🆕) vs UNREAD (👀) indépendants des groupes
 * ✅ Badge prioritaire unique (haut droite)
 * ✅ Backgrounds progressifs (NEW > UNREAD > READ)
 * ✅ Borders discrets
 * ✅ Menu contextuel "Marquer comme lu/non lu"
 * ✅ Nouveaux emojis groupes
 * ✅ Bandeau notification nouveaux souvenirs (v2.25)
 * ⭐ v2.29 : Fix getReadState() - Lecture directe localStorage au lieu de state local
 */
import { safeStorage } from '../../utils/storage.js';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { dataManager } from '../../core/dataManager.js';
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
import { countNewMemories } from '../../utils/memoryUtils.js'; // ⭐ v2.25
import {
  Clock, MoreVertical, Edit, Trash2,
  Archive, ChevronDown, X, Eye, EyeOff, Check, Sparkles, ArrowRight
} from 'lucide-react';

export default function SessionsPage({ isSearchOpen, setIsSearchOpen }) {
  const app = useAppState();

  // ⭐ v2.25 : Compter nouveaux souvenirs
  const newMemoriesCount = useMemo(() => {
    if (!app.masterIndex?.moments || !app.currentUser) return 0;
    return countNewMemories(app.masterIndex.moments, app.currentUser.id);
  }, [app.masterIndex, app.currentUser]);

  // États UI
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem(`mekong_sessionSort_${app.currentUser?.id}`);
    return saved || SORT_OPTIONS.URGENCY; // ✅ Par défaut : importance
  });
  const [groupFilter, setGroupFilter] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [unreadFilter, setUnreadFilter] = useState(null); // null | 'notified' | 'new' | 'unread' | 'pending'

  // ⭐ v2.9x : État recherche (isSearchOpen vient des props depuis App.jsx)
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Synchroniser avec TopBar quand unreadFilter change
  useEffect(() => {
    if (window.sessionTopBarActions?.updateActiveFilter) {
      window.sessionTopBarActions.updateActiveFilter(unreadFilter);
    }
  }, [unreadFilter]);
  
  // ✅ Système de tracking lecture par session
  const [sessionReadStatus, setSessionReadStatus] = useState(() => {
    const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // ⭐ v2.9x : Re-lire tracking depuis localStorage quand sessions changent
  // (pour détecter mises à jour depuis ChatPage)
  useEffect(() => {
    if (app.currentUser?.id) {
      const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser.id}`);
      const tracking = saved ? JSON.parse(saved) : {};
      setSessionReadStatus(tracking);
    }
  }, [app.sessions, app.currentUser?.id]); // Re-sync quand sessions ou user changent

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

  // ⭐ v2.9x : Filtrer par recherche (titre prioritaire, puis messages)
  const searchFilteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return enrichedSessions;

    const query = searchQuery.toLowerCase().trim();

    return enrichedSessions
      .map(session => {
        // Recherche dans titre
        const titleMatch = session.gameTitle?.toLowerCase().includes(query);

        // Recherche dans messages
        const messageMatches = session.notes?.filter(note =>
          note.content?.toLowerCase().includes(query)
        ) || [];

        // Score de pertinence : titre = 100, message = 10
        const score = titleMatch ? 100 : messageMatches.length * 10;

        return { session, score, titleMatch, messageMatchCount: messageMatches.length };
      })
      .filter(item => item.score > 0)  // Garder seulement correspondances
      .sort((a, b) => b.score - a.score)  // Trier par pertinence
      .map(item => item.session);
  }, [enrichedSessions, searchQuery]);

  // ✅ Calculer état lecture pour chaque session
  // ⭐ v2.29 : FIX - Lire directement depuis localStorage pour éviter désync avec ChatPage
  const getReadState = (session) => {
    // ⭐ v2.29 : Lire tracking en temps réel depuis localStorage (pas depuis state)
    const storageKey = `mekong_sessionReadStatus_${app.currentUser?.id}`;
    const allTracking = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const tracking = allTracking[session.id];

    const lastMessage = session.notes?.[session.notes.length - 1];
    const lastMessageTime = lastMessage?.timestamp || session.createdAt;
    const lastMessageAuthor = lastMessage?.author || session.user;
    const sessionCreator = session.user;
    const sessionUpdatedAt = session.updatedAt || session.createdAt; // ⭐ v2.9g : Prendre en compte updatedAt

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

    // ⭐ v2.9g : UNREAD si session modifiée (updatedAt) OU nouveau message
    // UNREAD : nouveau message/modification depuis dernière ouverture + par quelqu'un d'autre
    if (tracking?.hasBeenOpened && tracking.lastOpenedAt) {
      const lastOpenedDate = new Date(tracking.lastOpenedAt);
      const hasNewMessage = new Date(lastMessageTime) > lastOpenedDate && lastMessageAuthor !== app.currentUser?.id;
      const hasUpdate = new Date(sessionUpdatedAt) > lastOpenedDate;

      if (hasNewMessage || hasUpdate) {
        return 'unread';
      }
    }

    // READ : à jour
    return 'read';
  };

  // Grouper sessions par statut (avec filtrage recherche)
  const groupedSessions = useMemo(() => {
    const groups = {
      pending_you: [], // ✅ Contient maintenant NOTIFIED + PENDING_YOU
      pending_other: [],
      archived: [] // ✨ Renommé de "completed" à "archived"
    };

    searchFilteredSessions.forEach(s => {
      // ✨ Vérifier seulement archived (pas completed)
      if (s.archived) {
        groups.archived.push(s);
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
      groups[key] = sortSessions(groups[key], sortBy, app.currentUser?.id);
    });

    return groups;
  }, [searchFilteredSessions, sortBy]);  // ⭐ v2.9x : Utilise sessions filtrées par recherche

  // ✅ Filtrer selon badge TopBar (4 options : null, 'notified', 'new', 'pending')
  const filteredGroups = useMemo(() => {
    let groups = groupedSessions;
    
    if (unreadFilter) {
      const filteredGroupsCopy = {};
      
      Object.keys(groups).forEach(key => {
        filteredGroupsCopy[key] = groups[key].filter(session => {
          const state = getReadState(session);
          
          switch(unreadFilter) {
            case 'notified':
              return session.status === SESSION_STATUS.NOTIFIED;
            
            case 'new':
              return state === 'new';
            
            case 'pending':
              const lastMessage = session.notes?.[session.notes.length - 1];
              const lastAuthor = lastMessage?.author || session.user;
              return lastAuthor !== app.currentUser?.id;
            
            default:
              return true;
          }
        });
      });
      
      return filteredGroupsCopy;
    }
    
    return groups;
  }, [groupedSessions, unreadFilter, app.currentUser?.id]);

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

    // ✨ Activer le spinner
    dataManager.setLoadingOperation(true, 'Modification du titre...', 'Enregistrement sur Google Drive', 'spin');

    try {
      const session = app.sessions.find(s => s.id === sessionId);
      if (session) {
        const updatedSession = { ...session, gameTitle: editTitle.trim() };
        await app.updateSession(updatedSession);
      }
      setEditingSession(null);

      // ✨ Désactiver le spinner
      dataManager.setLoadingOperation(false);
    } catch (error) {
      console.error('❌ Erreur modification titre session:', error);
      // ✨ Désactiver le spinner en cas d'erreur
      dataManager.setLoadingOperation(false);
    }
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
    <div className="p-0 max-w-5xl mx-auto">
      
      {/* ✅ Message filtre avec code couleur (Option B : 3 filtres) */}
      {unreadFilter && (
        <div className={`mb-3 p-2 rounded-lg border flex items-center justify-between ${
          unreadFilter === 'notified' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' :
          unreadFilter === 'new' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' :
          unreadFilter === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' :
          'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
        }`}>
          <span className={`text-sm font-semibold ${
            unreadFilter === 'notified' ? 'text-orange-800 dark:text-orange-200' :
            unreadFilter === 'new' ? 'text-green-800 dark:text-green-200' :
            unreadFilter === 'pending' ? 'text-amber-800 dark:text-amber-200' :
            'text-blue-800 dark:text-blue-200'
          }`}>
            Filtre actif : {
              unreadFilter === 'notified' ? 'causeries 🔔 notifiées uniquement' :
              unreadFilter === 'new' ? 'causeries 🆕 nouvelles uniquement' :
              unreadFilter === 'pending' ? 'causeries ⏳ en attente uniquement' :
              ''
            }
          </span>
          <button
            onClick={() => setUnreadFilter(null)}
            className="text-current hover:opacity-70 transition-opacity"
            title="Retirer le filtre"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ⭐ v2.9x : Champ de recherche */}
      {isSearchOpen && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les titres et messages..."
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            autoFocus
          />
          {searchQuery && (
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              {searchFilteredSessions.length} résultat{searchFilteredSessions.length > 1 ? 's' : ''} trouvé{searchFilteredSessions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* ⭐ v2.25 : Bandeau nouveaux souvenirs */}
      {newMemoriesCount > 0 && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-600 rounded-lg shadow-sm">
          <button
            onClick={() => {
              dataManager.updateState({
                currentPage: 'memories',
                navigationContext: { scrollToNewMemories: true }
              });
            }}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  {newMemoriesCount} nouveau{newMemoriesCount > 1 ? 'x' : ''} souvenir{newMemoriesCount > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Cliquez pour découvrir
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Sections */}
      <div className="p-3 space-y-4">
        
        
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
            onArchive={handleArchive}
            onDelete={handleDeleteSession}
            onToggleRead={handleToggleRead}
            getReadState={getReadState}
          />
        )}

        {/* 📚 Causeries archivées (Blue) */}
        {filteredGroups.archived && filteredGroups.archived.length > 0 && (
          <SessionGroup
            emoji="📚"
            subtitle="Causeries archivées"
            sessions={filteredGroups.archived}
            isOpen={openSections.archived}
            onToggle={() => toggleSection('archived')}
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
      {/* ⭐ v2.24 : SYSTÈME DE BADGES - 4 positions distinctes
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Position Haut-Gauche : 🔔 NOTIFIÉ (orange)
            - Notification non répondue d'un autre user

          Position Haut-Droite : 🆕 NOUVELLE (vert) | 👀 NON LUE (orange)
            - NOUVELLE : Session créée par autre user, jamais ouverte
                        (disparaît quand on répond)
            - NON LUE : Nouveau message depuis dernière ouverture
                        (disparaît quand on ouvre le chat)

          Position Bas-Gauche : 📚 ARCHIVE (bleu)
            - Demande d'archivage en attente de validation
            - Affiché uniquement pour le user qui doit répondre

          Position Bas-Droite : 🗑️ SUPPRIME (rouge)
            - Demande de suppression en attente de validation
            - Affiché uniquement pour le user qui doit répondre
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      */}

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

      {/* ⭐ v2.24 : Badge ARCHIVE (demande en attente - bas gauche) */}
      {!isEditing &&
       session.archiveRequest &&
       session.archiveRequest.status === 'pending' &&
       session.archiveRequest.requestedBy !== currentUserId && (
        <div className="absolute -bottom-2 -left-2 flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
          <span>📚</span>
          <span>Archive</span>
        </div>
      )}

      {/* ⭐ v2.24 : Badge SUPPRIME (demande en attente - bas droite) */}
      {!isEditing &&
       session.deleteRequest &&
       session.deleteRequest.status === 'pending' &&
       session.deleteRequest.requestedBy !== currentUserId && (
        <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
          <span>🗑️</span>
          <span>Supprime</span>
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
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{session.gameTitle}</div>
                {/* ⭐ v3.0 : Badge Saynète si gameContext */}
                {session.gameContext && (
                  <span className="flex-shrink-0 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                    🎭 Saynète
                  </span>
                )}
              </div>
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>

                {/* ⭐ v2.24b : Archiver (grisé si demande en cours) */}
                <button
                  onClick={(e) => onArchive(e, session)}
                  disabled={session.archiveRequest?.status === 'pending'}
                  className={`w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 flex items-center space-x-2 transition-colors duration-150 ${
                    session.archiveRequest?.status === 'pending'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>
                    {session.archiveRequest?.status === 'pending'
                      ? 'Demande d\'archivage en cours...'
                      : session.archived ? 'Désarchiver' : 'Archiver'}
                  </span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                {/* ⭐ v2.24b : Supprimer (grisé si demande en cours) */}
                <button
                  onClick={(e) => onDelete(e, session.id, session.gameTitle)}
                  disabled={session.deleteRequest?.status === 'pending'}
                  className={`w-full text-left px-4 py-2 text-red-600 dark:text-red-400 flex items-center space-x-2 transition-colors duration-150 ${
                    session.deleteRequest?.status === 'pending'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {session.deleteRequest?.status === 'pending'
                      ? 'Demande de suppression en cours...'
                      : 'Supprimer'}
                  </span>
                </button>
                
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}