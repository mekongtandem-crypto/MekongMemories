import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { Plus, MessageCircle, Trash2, Clock } from 'lucide-react';

export default function SessionsPage() {
  const app = useAppState();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Créer une session de test
  const handleCreateTestSession = async () => {
    if (isCreatingSession) return;
    
    setIsCreatingSession(true);
    try {
      const testGame = {
        id: Date.now(),
        title: `Session Test ${new Date().toLocaleTimeString()}`,
        description: 'Session de test créée depuis SessionsPage'
      };

      const newSession = await app.createSession(testGame);
      console.log('✅ Session créée:', newSession);
      
    } catch (error) {
      console.error('❌ Erreur création session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Ouvrir une session en mode chat (clic direct sur session)
  const handleOpenSession = async (session) => {
    console.log('🔥 SessionsPage - Ouverture chat pour session:', session.gameTitle);
    try {
      await app.openChatSession(session);
      console.log('✅ Chat ouvert avec succès');
    } catch (error) {
      console.error('❌ Erreur ouverture chat:', error);
    }
  };

  // Supprimer une session (avec propagation stopée)
  const handleDeleteSession = async (e, sessionId, sessionTitle) => {
    e.stopPropagation(); // Empêcher l'ouverture de la session
    
    if (!confirm(`Supprimer la session "${sessionTitle}" ?`)) return;
    
    try {
      await app.deleteSession(sessionId);
      console.log('✅ Session supprimée:', sessionId);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
    }
  };

  // Obtenir le dernier auteur d'une session
  const getLastAuthor = (session) => {
    if (!session.notes || session.notes.length === 0) {
      return session.user; // Créateur par défaut
    }
    return session.notes[session.notes.length - 1].author;
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vos Sessions</h1>
          <p className="text-gray-600">
            {app.sessions.length} session{app.sessions.length !== 1 ? 's' : ''} de remémoration
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCreateTestSession}
            disabled={isCreatingSession}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center space-x-2"
          >
            {isCreatingSession ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{isCreatingSession ? 'Création...' : 'Nouvelle Session Test'}</span>
          </button>
          
          <button
            onClick={() => app.updateCurrentPage('games')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
          >
            Parcourir les Jeux
          </button>
        </div>
      </div>

      {/* État de chargement */}
      {app.loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des sessions...</p>
        </div>
      )}

      {/* Liste des sessions */}
      {!app.loading && (
        <>
          {app.sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune session</h2>
              <p className="text-gray-600 mb-6">
                Créez votre première session de remémoration pour commencer.
              </p>
              <button
                onClick={handleCreateTestSession}
                disabled={isCreatingSession}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium"
              >
                {isCreatingSession ? 'Création...' : 'Créer une Session'}
              </button>
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
                      
                      {/* Informations session */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          {/* Titre de la session */}
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                            {session.gameTitle}
                          </h3>
                          
                          {/* Badge du dernier auteur */}
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

                          {/* Bouton Supprimer (visible au hover) */}
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id, session.gameTitle)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all"
                            title="Supprimer session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Indicateur visuel de clic */}
                    <div className="mt-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      💬 Cliquer pour ouvrir la conversation
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Conseils d'utilisation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">💡 Comment utiliser</h3>
        <div className="text-amber-800 text-sm space-y-1">
          <div><strong>Cliquer sur une session</strong> → Ouvre directement la conversation</div>
          <div><strong>Badge coloré</strong> → Indique qui a écrit le dernier message</div>
          <div><strong>Survol session</strong> → Révèle le bouton de suppression</div>
        </div>
      </div>

      {/* Debug info si en mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">🛠️ Debug Info</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <div><strong>Sessions:</strong> {app.sessions.length}</div>
            <div><strong>Utilisateur actuel:</strong> {app.currentUser || 'Aucun'}</div>
            <div><strong>Chat session actuelle:</strong> {app.currentChatSession?.id || 'Aucune'}</div>
            <div><strong>Page actuelle:</strong> {app.currentPage}</div>
          </div>
        </div>
      )}
    </div>
  );
}