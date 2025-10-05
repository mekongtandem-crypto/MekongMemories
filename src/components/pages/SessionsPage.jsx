/**
 * SessionsPage.jsx v6.1 - Phase 14.3
 * ✅ Suppression SuggestionsModal (redirige vers Memories)
 * ✅ Icônes 💬 au lieu de <MessageCircle />
 * ✅ Liste groupée auto par statut
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import StatsModal from '../StatsModal.jsx';
import { 
  enrichSessionWithStatus,
  sortSessions,
  formatRelativeTime,
  formatMessagePreview,
  SORT_OPTIONS
} from '../../utils/sessionUtils.js';
import { 
  Clock, MoreVertical, Edit, Trash2, 
  Check, Archive, ChevronDown, X
} from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  
  // États UI
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.URGENCY);
  const [groupFilter, setGroupFilter] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // États sections repliables
  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem(`mekong_sessionGroups_${app.currentUser}`);
    return saved ? JSON.parse(saved) : {
      urgent: true,
      pending_you: true,
      pending_other: false,
      completed: false
    };
  });
  
  const menuRefs = useRef({});

  // Sauvegarder états sections
  useEffect(() => {
    localStorage.setItem(`mekong_sessionGroups_${app.currentUser}`, JSON.stringify(openSections));
  }, [openSections, app.currentUser]);

  // Exposer callbacks pour TopBar
  useEffect(() => {
    window.sessionPageActions = {
      openStatsModal: () => setShowStatsModal(true)
    };
    window.sessionPageFilters = {
      setGroupFilter: setGroupFilter,
      setSortBy: setSortBy
    };
    window.sessionPageState = {
      activeFilter: groupFilter
    };
    
    return () => {
      delete window.sessionPageActions;
      delete window.sessionPageFilters;
      delete window.sessionPageState;
    };
  }, [groupFilter]);

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
    return app.sessions.map(s => {
      const lastMsg = s.notes?.[s.notes.length - 1];
      const isPendingYou = lastMsg && lastMsg.author !== app.currentUser;
      const daysSince = lastMsg ? (Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24) : 0;
      const isUrgent = isPendingYou && daysSince > 7;
      const isPendingOther = lastMsg && lastMsg.author === app.currentUser;
      
      return enrichSessionWithStatus({
        ...s,
        isPendingYou,
        isUrgent,
        isPendingOther: isPendingOther && !isPendingYou,
        daysSince
      }, app.currentUser);
    });
  }, [app.sessions, app.currentUser]);

  // Grouper sessions par statut
  const groupedSessions = useMemo(() => {
    const groups = {
      urgent: [],
      pending_you: [],
      pending_other: [],
      completed: []
    };
    
    enrichedSessions.forEach(s => {
      if (s.completed) {
        groups.completed.push(s);
      } else if (s.isUrgent) {
        groups.urgent.push(s);
      } else if (s.isPendingYou) {
        groups.pending_you.push(s);
      } else if (s.isPendingOther) {
        groups.pending_other.push(s);
      }
    });
    
    // Trier chaque groupe
    Object.keys(groups).forEach(key => {
      groups[key] = sortSessions(groups[key], sortBy);
    });
    
    return groups;
  }, [enrichedSessions, sortBy]);

  // Filtrer selon badge TopBar cliqué
  const filteredGroups = useMemo(() => {
    if (!groupFilter) return groupedSessions;
    
    return {
      [groupFilter]: groupedSessions[groupFilter]
    };
  }, [groupedSessions, groupFilter]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleOpenSession = async (session) => {
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
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-blue-900">
            <span className="font-medium">Filtre actif :</span>
            <span className="text-2xl">
              {groupFilter === 'urgent' && '🔴'}
              {groupFilter === 'pending_you' && '🟡'}
              {groupFilter === 'pending_other' && '🔵'}
            </span>
            <span>
              {groupFilter === 'urgent' && 'Urgent'}
              {groupFilter === 'pending_you' && 'À traiter'}
              {groupFilter === 'pending_other' && 'En attente'}
            </span>
          </div>
          <button
            onClick={() => setGroupFilter(null)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Voir tout</span>
          </button>
        </div>
      )}
      
      {/* Liste groupée */}
      {totalSessions === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h2>
          <p className="text-gray-600 mb-6">Créez votre première session depuis la page Mémoires.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Groupe URGENT */}
          {filteredGroups.urgent && filteredGroups.urgent.length > 0 && (
            <SessionGroup
              title="🔥 URGENT"
              subtitle={`Plus de 7 jours sans réponse`}
              sessions={filteredGroups.urgent}
              isOpen={openSections.urgent}
              onToggle={() => toggleSection('urgent')}
              color="orange"
              currentUserId={app.currentUser}
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
            />
          )}
          
          {/* Groupe À TRAITER */}
          {filteredGroups.pending_you && filteredGroups.pending_you.length > 0 && (
            <SessionGroup
              title="🟡 À TRAITER"
              subtitle="En attente de votre réponse"
              sessions={filteredGroups.pending_you}
              isOpen={openSections.pending_you}
              onToggle={() => toggleSection('pending_you')}
              color="amber"
              currentUserId={app.currentUser}
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
            />
          )}
          
          {/* Groupe EN ATTENTE (autres) */}
          {filteredGroups.pending_other && filteredGroups.pending_other.length > 0 && (
            <SessionGroup
              title="🔵 EN ATTENTE"
              subtitle="Attente d'autres utilisateurs"
              sessions={filteredGroups.pending_other}
              isOpen={openSections.pending_other}
              onToggle={() => toggleSection('pending_other')}
              color="blue"
              currentUserId={app.currentUser}
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
            />
          )}
          
          {/* Groupe TERMINÉES */}
          {filteredGroups.completed && filteredGroups.completed.length > 0 && (
            <SessionGroup
              title="✅ TERMINÉES"
              subtitle="Sessions complétées"
              sessions={filteredGroups.completed}
              isOpen={openSections.completed}
              onToggle={() => toggleSection('completed')}
              color="green"
              currentUserId={app.currentUser}
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
            />
          )}
          
        </div>
      )}
      
      {/* Modal Stats */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        sessions={app.sessions}
        masterIndex={app.masterIndex}
        currentUser={app.currentUser}
      />
      
    </div>
  );
}

// ========================================
// COMPOSANTS
// ========================================

function SessionGroup({ 
  title, subtitle, sessions, isOpen, onToggle, color,
  currentUserId, editingSession, editTitle, setEditTitle,
  openMenuId, setOpenMenuId, menuRefs,
  onOpen, onStartEdit, onSaveEdit, onCancelEdit,
  onMarkCompleted, onArchive, onDelete
}) {
  const colorClasses = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100' }
  };
  
  const colors = colorClasses[color];
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden`}>
      
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${colors.hover} transition-colors`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{title.split(' ')[0]}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-900">
              {title.substring(title.indexOf(' ') + 1)} ({sessions.length})
            </div>
            <div className="text-xs text-gray-600">{subtitle}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Sessions */}
      {isOpen && (
        <div className="p-3 border-t border-gray-200 space-y-2">
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
  onMarkCompleted, onArchive, onDelete
}) {
  const lastAuthor = session.notes?.[session.notes.length - 1]?.author || session.user;
  const lastAuthorInfo = userManager.getUser(lastAuthor);
  const lastAuthorStyle = userManager.getUserStyle(lastAuthor);
  const lastMessage = session.notes?.[session.notes.length - 1];
  
  return (
    <div 
      onClick={() => !isEditing && onOpen(session)}
      className={`bg-white border rounded-lg p-3 transition-all ${
        isEditing 
          ? 'border-gray-300' 
          : 'border-gray-200 hover:border-gray-400 hover:shadow-md cursor-pointer'
      }`}
    >
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
                className="flex-1 px-2 py-1 border border-gray-300 rounded font-medium focus:ring-2 focus:ring-amber-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={(e) => onSaveEdit(e, session.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="font-medium text-gray-900 truncate">{session.gameTitle}</div>
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
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
        
        {/* Menu */}
        {!isEditing && (
          <div className="relative flex-shrink-0" ref={el => menuRefs.current[session.id] = el}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === session.id ? null : session.id);
              }}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {openMenuId === session.id && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
                
                <button
                  onClick={(e) => onStartEdit(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={(e) => onMarkCompleted(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{session.completed ? 'Non terminée' : 'Terminée'}</span>
                </button>
                
                <button
                  onClick={(e) => onArchive(e, session)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>{session.archived ? 'Désarchiver' : 'Archiver'}</span>
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={(e) => onDelete(e, session.id, session.gameTitle)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
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