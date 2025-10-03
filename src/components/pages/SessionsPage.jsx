/**
 * SessionsPage.jsx v4.1 - Menu contextuel amélioré
 * ✅ Éditer titre dans le menu "..."
 * ✅ Supprimer session dans le menu "..."
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { MessageCircle, Clock, MoreVertical, Edit, Trash2 } from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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

  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    if (!confirm(`Supprimer la session "${sessionTitle}" ?`)) return;
    await app.deleteSession(sessionId);
  };

  const getLastAuthor = (session) => {
    if (!session.notes || session.notes.length === 0) return session.user;
    return session.notes[session.notes.length - 1].author;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (app.isLoading) {
    return <div className="p-12 text-center">Chargement des sessions...</div>;
  }

  return (
    <div className="p-4">
      {app.sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h2>
          <p className="text-gray-600 mb-6">Créez votre première session depuis la page Mémoires.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {app.sessions.map((session) => {
            const lastAuthor = getLastAuthor(session);
            const lastAuthorInfo = userManager.getUser(lastAuthor);
            const lastAuthorStyle = userManager.getUserStyle(lastAuthor);
            const isEditing = editingSession === session.id;
            
            return (
              <div 
                key={session.id} 
                onClick={() => !isEditing && handleOpenSession(session)}
                className={`bg-white border border-gray-200 rounded-lg p-4 transition-all ${
                  isEditing ? '' : 'hover:shadow-md hover:border-amber-300 cursor-pointer'
                } group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center justify-between mb-2">
                      {isEditing ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(e, session.id);
                              if (e.key === 'Escape') handleCancelEdit(e);
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-lg font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => handleSaveEdit(e, session.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 truncate">
                          {session.gameTitle}
                        </h3>
                      )}
                      
                      {!isEditing && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${lastAuthorStyle.bg} ${lastAuthorStyle.text} border ${lastAuthorStyle.border}`}>
                            <div className="flex items-center space-x-1">
                              <span>{lastAuthorInfo?.emoji || '👤'}</span>
                              <span>{lastAuthorInfo?.id || lastAuthor}</span>
                            </div>
                          </div>
                          
                          <div className="relative" ref={el => menuRefs.current[session.id] = el}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === session.id ? null : session.id);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {openMenuId === session.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
                                <button
                                  onClick={(e) => handleStartEdit(e, session)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span>Modifier le titre</span>
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={(e) => handleDeleteSession(e, session.id, session.gameTitle)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{session.notes?.length || 0} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}