/**
 * SessionsPage.jsx v4.0 - Adaptation UnifiedTopBar
 * ✅ Suppression du header redondant
 * ✅ Layout simplifié
 */
import React from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { MessageCircle, Trash2, Clock } from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();

  const handleOpenSession = async (session) => {
    await app.openChatSession(session);
  };

  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation();
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
            
            return (
              <div 
                key={session.id} 
                onClick={() => handleOpenSession(session)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">
                        {session.gameTitle}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${lastAuthorStyle.bg} ${lastAuthorStyle.text} border ${lastAuthorStyle.border}`}>
                        <div className="flex items-center space-x-1">
                          <span>{lastAuthorInfo?.emoji || '👤'}</span>
                          <span>{lastAuthorInfo?.id || lastAuthor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{session.notes?.length || 0} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id, session.gameTitle)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                        title="Supprimer session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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