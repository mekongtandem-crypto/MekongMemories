/**
 * SessionsPage.jsx v3.1 - Activé et connecté au DataManager (Syntaxe Corrigée)
 * Version : v3.1
 * Date de mise à jour : 27 septembre 2025
 * Statut : Fonctionnel. Affiche les sessions, permet la création et la suppression
 * en se basant sur la logique fournie par useAppState.
 */
import React, { useState } from 'react'; // LIGNE CORRIGÉE
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { Plus, MessageCircle, Trash2, Clock } from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Note : La logique ici est déjà correcte car elle appelle les fonctions
  // que nous avons implémentées dans le DataManager (Phase 1).

  const handleCreateTestSession = async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    try {
      const testGame = {
        id: `test_${Date.now()}`,
        title: `Session Test ${new Date().toLocaleTimeString()}`,
      };

      // Cet appel va maintenant déclencher la logique réelle dans DataManager
      await app.createSession(testGame);
      
    } catch (error) {
      console.error('❌ Erreur création session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleOpenSession = async (session) => {
    // Cet appel va changer la page et définir la session de chat active
    await app.openChatSession(session);
  };

  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation();
    if (!confirm(`Supprimer la session "${sessionTitle}" ?`)) return;
    
    // Cet appel va supprimer le fichier sur Drive et mettre à jour l'état
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vos Sessions</h1>
          <p className="text-gray-600">
            {app.sessions.length} session{app.sessions.length !== 1 ? 's' : ''} de remémoration
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateTestSession}
            disabled={isCreatingSession}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-medium flex items-center space-x-2"
          >
            {isCreatingSession ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : <Plus className="w-4 h-4" />}
            <span>{isCreatingSession ? 'Création...' : 'Nouvelle Session Test'}</span>
          </button>
        </div>
      </div>

      {app.isLoading && <p>Chargement des sessions...</p>}

      {!app.isLoading && (
        <>
          {app.sessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h2>
              <p className="text-gray-600 mb-6">Créez votre première session pour commencer.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {app.sessions.map((session) => {
                const lastAuthor = getLastAuthor(session);
                const lastAuthorInfo = userManager.getUser(lastAuthor);
                const lastAuthorStyle = userManager.getUserStyle(lastAuthor);
                
                return (
                  <div key={session.id} onClick={() => handleOpenSession(session)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700">{session.gameTitle}</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${lastAuthorStyle.bg} ${lastAuthorStyle.text} border ${lastAuthorStyle.border}`}>
                            <div className="flex items-center space-x-1">
                              <span>{lastAuthorInfo?.emoji || '👤'}</span>
                              <span>{lastAuthorInfo?.id || lastAuthor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                           <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1"><MessageCircle className="w-4 h-4" /><span>{session.notes?.length || 0} messages</span></div>
                              <div className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{formatDate(session.createdAt)}</span></div>
                           </div>
                          <button onClick={(e) => handleDeleteSession(e, session.id, session.gameTitle)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer session"
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
        </>
      )}
    </div>
  );
}