/**
 * SessionsPage.jsx v5.0 - Refonte complète avec Dashboard
 * ✅ Dashboard intégré
 * ✅ Filtres par statut (onglets)
 * ✅ Tri intelligent (urgence/date/chrono/activité)
 * ✅ Cards enrichies avec badges
 * ✅ Toggle vue compacte
 * ✅ Menu contextuel actions
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import SessionsDashboard from '../SessionsDashboard.jsx';
import { 
  enrichSessionWithStatus,
  filterSessionsByStatus,
  sortSessions,
  formatRelativeTime,
  formatMessagePreview,
  SESSION_STATUS,
  SORT_OPTIONS
} from '../../utils/sessionUtils.js';
import { 
  MessageCircle, Clock, MoreVertical, Edit, Trash2, 
  Check, Archive, List, Grid, ArrowUpDown, X
} from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  
  // États UI
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.URGENCY);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(`mekong_sessionsView_${app.currentUser}`) || 'cards';
  });
  
  const menuRefs = useRef({});

  // Sauvegarder préférence vue
  useEffect(() => {
    localStorage.setItem(`mekong_sessionsView_${app.currentUser}`, viewMode);
  }, [viewMode, app.currentUser]);

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
    return app.sessions.map(s => enrichSessionWithStatus(s, app.currentUser));
  }, [app.sessions, app.currentUser]);

  // Filtrer et trier
  const filteredSessions = useMemo(() => {
    const filtered = filterSessionsByStatus(enrichedSessions, statusFilter);
    return sortSessions(filtered, sortBy);
  }, [enrichedSessions, statusFilter, sortBy]);

  // Compteurs pour onglets
  const statusCounts = useMemo(() => {
    return enrichedSessions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
  }, [enrichedSessions]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleOpenSession = async (session) => {
    await app.openChatSession(session);
  };

  const handleCreateSessionFromMoment = async (moment) => {
    try {
      const sessionData = {
        id: moment.id,
        title: `Souvenirs du moment : ${moment.displayTitle || moment.title}`,
        description: `Basé sur le moment "${moment.displayTitle || moment.title}"`,
        systemMessage: `💬 Session basée sur le moment : "${moment.displayTitle || moment.title}".`
      };
      
      const newSession = await app.createSession(sessionData, null, null);
      if (newSession) {
        await app.openChatSession(newSession);
      }
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Impossible de créer la session');
    }
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

  // ========================================
  // RENDER
  // ========================================

  if (app.isLoading) {
    return <div className="p-12 text-center">Chargement des sessions...</div>;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      
      {/* Dashboard */}
      <SessionsDashboard 
  sessions={enrichedSessions}
  onCreateSession={handleCreateSessionFromMoment}
  onOpenSession={handleOpenSession}  // ✅ AJOUT
/>
      
      {/* Barre d'outils */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        
        {/* Filtres par statut (onglets) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <FilterTab
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            label="Toutes"
            count={enrichedSessions.length}
          />
          
          <FilterTab
            active={statusFilter === SESSION_STATUS.PENDING_YOU}
            onClick={() => setStatusFilter(SESSION_STATUS.PENDING_YOU)}
            label="À traiter"
            count={statusCounts[SESSION_STATUS.PENDING_YOU] || 0}
            color="amber"
          />
          
          <FilterTab
            active={statusFilter === SESSION_STATUS.STALE}
            onClick={() => setStatusFilter(SESSION_STATUS.STALE)}
            label="Urgent"
            count={statusCounts[SESSION_STATUS.STALE] || 0}
            color="orange"
          />
          
          <FilterTab
            active={statusFilter === SESSION_STATUS.PENDING_OTHER}
            onClick={() => setStatusFilter(SESSION_STATUS.PENDING_OTHER)}
            label="En attente"
            count={statusCounts[SESSION_STATUS.PENDING_OTHER] || 0}
            color="blue"
          />
          
          <FilterTab
            active={statusFilter === SESSION_STATUS.COMPLETED}
            onClick={() => setStatusFilter(SESSION_STATUS.COMPLETED)}
            label="Terminées"
            count={statusCounts[SESSION_STATUS.COMPLETED] || 0}
            color="green"
          />
        </div>
        
        {/* Tri + Vue */}
        <div className="flex items-center justify-between">
          
          {/* Sélecteur tri */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={SORT_OPTIONS.URGENCY}>Par urgence</option>
              <option value={SORT_OPTIONS.DATE}>Par date création</option>
              <option value={SORT_OPTIONS.CHRONO}>Ordre voyage</option>
              <option value={SORT_OPTIONS.ACTIVITY}>Par activité</option>
            </select>
          </div>
          
          {/* Toggle vue */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue cards"
            >
              <Grid className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue compacte"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
        </div>
      </div>
      
      {/* Liste sessions */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'all' ? 'Aucune session' : 'Aucune session dans cette catégorie'}
          </h2>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'Créez votre première session depuis la page Mémoires.'
              : 'Changez de filtre pour voir d\'autres sessions.'
            }
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Voir toutes les sessions
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'cards' ? 'grid gap-4' : 'space-y-2'}>
          {filteredSessions.map((session) => {
            const lastAuthor = getLastAuthor(session);
            const lastAuthorInfo = userManager.getUser(lastAuthor);
            const lastAuthorStyle = userManager.getUserStyle(lastAuthor);
            const isEditing = editingSession === session.id;
            
            return viewMode === 'cards' ? (
              <SessionCard
                key={session.id}
                session={session}
                isEditing={isEditing}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                lastAuthorInfo={lastAuthorInfo}
                lastAuthorStyle={lastAuthorStyle}
                currentUserId={app.currentUser}
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
            ) : (
              <SessionCompactRow
                key={session.id}
                session={session}
                isEditing={isEditing}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                lastAuthorInfo={lastAuthorInfo}
                currentUserId={app.currentUser}
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
            );
          })}
        </div>
      )}
      
    </div>
  );
}

// ========================================
// COMPOSANTS SESSION
// ========================================

function SessionCard({ 
  session, isEditing, editTitle, setEditTitle, 
  lastAuthorInfo, lastAuthorStyle, currentUserId,
  openMenuId, setOpenMenuId, menuRefs,
  onOpen, onStartEdit, onSaveEdit, onCancelEdit,
  onMarkCompleted, onArchive, onDelete
}) {
  const lastMessage = session.notes?.[session.notes.length - 1];
  const preview = lastMessage ? formatMessagePreview(lastMessage) : null;
  const direction = lastMessage?.author === currentUserId ? '→' : '←';
  
  return (
    <div 
      onClick={() => !isEditing && onOpen(session)}
      className={`bg-white border-2 rounded-lg p-4 transition-all ${
        isEditing 
          ? 'border-gray-300' 
          : `${session.statusConfig.borderClass} hover:shadow-md hover:border-${session.statusConfig.color}-400 cursor-pointer`
      } group`}
    >
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        
        <div className="flex-1 min-w-0 mr-3">
          
          {/* Badge statut + Titre */}
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${session.statusConfig.bgClass} ${session.statusConfig.textClass}`}>
              {session.statusConfig.icon} {session.statusConfig.label}
            </span>
          </div>
          
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
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-lg font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => onSaveEdit(e, session.id)}
                className="p-2 text-green-600 hover:bg-green-100 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 line-clamp-2">
              {session.gameTitle}
            </h3>
          )}
        </div>
        
        {/* Menu actions */}
        {!isEditing && (
          <SessionMenu
            session={session}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRefs={menuRefs}
            onStartEdit={onStartEdit}
            onMarkCompleted={onMarkCompleted}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        )}
      </div>
      
      {/* Métadonnées */}
      {!isEditing && (
        <>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{session.notes?.length || 0} msg</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`text-xl ${lastAuthorStyle.text}`}>
                {lastAuthorInfo?.emoji || '👤'}
              </span>
              <span>{direction}</span>
              <span className="font-medium">{lastAuthorInfo?.name || 'Inconnu'}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(lastMessage?.timestamp || session.createdAt)}</span>
            </div>
          </div>
          
          {/* Preview message */}
          {preview && (
            <div className="text-sm text-gray-600 italic bg-gray-50 rounded p-2 line-clamp-2">
              "{preview}"
            </div>
          )}
          
          {/* Source */}
          {session.notes?.[0]?.photoData && (
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
              <span>📸</span>
              <span>Basé sur photo {session.notes[0].photoData.filename}</span>
            </div>
          )}
        </>
      )}
      
    </div>
  );
}

function SessionCompactRow({ 
  session, isEditing, editTitle, setEditTitle, 
  lastAuthorInfo, currentUserId,
  openMenuId, setOpenMenuId, menuRefs,
  onOpen, onStartEdit, onSaveEdit, onCancelEdit,
  onMarkCompleted, onArchive, onDelete
}) {
  return (
    <div 
      onClick={() => !isEditing && onOpen(session)}
      className={`bg-white border rounded-lg p-3 transition-all flex items-center justify-between ${
        isEditing 
          ? 'border-gray-300' 
          : `${session.statusConfig.borderClass} hover:bg-gray-50 cursor-pointer`
      }`}
    >
      
      {/* Badge */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${session.statusConfig.bgClass}`}>
        {session.statusConfig.icon}
      </div>
      
      {/* Titre */}
      <div className="flex-1 min-w-0 mx-3">
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
          <div className="font-medium text-gray-900 truncate">{session.gameTitle}</div>
        )}
      </div>
      
      {/* Stats */}
      {!isEditing && (
        <>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mr-3">
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{session.notes?.length || 0}</span>
            </span>
            
            <span className={`text-lg ${userManager.getUserStyle(getLastAuthor(session)).text}`}>
              {lastAuthorInfo?.emoji || '👤'}
            </span>
          </div>
          
          {/* Menu */}
          <SessionMenu
            session={session}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRefs={menuRefs}
            onStartEdit={onStartEdit}
            onMarkCompleted={onMarkCompleted}
            onArchive={onArchive}
            onDelete={onDelete}
            compact
          />
        </>
      )}
      
    </div>
  );
}

function SessionMenu({ 
  session, openMenuId, setOpenMenuId, menuRefs,
  onStartEdit, onMarkCompleted, onArchive, onDelete, compact
}) {
  return (
    <div className="relative flex-shrink-0" ref={el => menuRefs.current[session.id] = el}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(openMenuId === session.id ? null : session.id);
        }}
        className={`${compact ? 'p-1' : 'p-2'} text-gray-600 hover:bg-gray-100 rounded-lg transition-colors`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {openMenuId === session.id && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
          
          <button
            onClick={(e) => onStartEdit(e, session)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier le titre</span>
          </button>
          
          <button
            onClick={(e) => onMarkCompleted(e, session)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>{session.completed ? 'Marquer non terminée' : 'Marquer terminée'}</span>
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
  );
}

function FilterTab({ active, onClick, label, count, color = 'gray' }) {
  const colorClasses = {
    amber: 'bg-amber-500 text-white',
    orange: 'bg-orange-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    gray: 'bg-gray-700 text-white'
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? colorClasses[color]
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

// ========================================
// HELPERS
// ========================================

function getLastAuthor(session) {
  if (!session.notes || session.notes.length === 0) return session.user;
  return session.notes[session.notes.length - 1].author;
}