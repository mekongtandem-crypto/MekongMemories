/**
 * ChatPage.jsx v1.2 - Intégré dans l'architecture B
 * Gère l'interface de conversation d'une session.
 * Basé sur le code de ChatPage_A.jsx
 */


import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { ArrowLeft, Send, Edit, Trash2, Check, X } from 'lucide-react';

export default function ChatPage() {
  const app = useAppState();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // États pour édition titre/sous-titre
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [titleContent, setTitleContent] = useState('');
  const [subtitleContent, setSubtitleContent] = useState('');
  
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le bas quand des messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [app.currentChatSession?.notes]);

  // Si pas de session ouverte, afficher message d'aide
  if (!app.currentChatSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune session de chat</h2>
        <p className="text-gray-600 mb-6">
          Sélectionnez une session depuis la page Sessions pour commencer une conversation.
        </p>
        <button
          onClick={() => app.updateCurrentPage('sessions')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Sessions</span>
        </button>
      </div>
    );
  }

  // Obtenir les couleurs thématiques par utilisateur
  const getUserBubbleStyle = (author) => {
    const isCurrentUser = author === app.currentUser;
    
    // Couleurs par utilisateur selon les spécifications
    const userColors = {
      tom: {
        own: 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg shadow-lg',
        other: 'bg-blue-100 text-blue-900 rounded-r-lg rounded-tl-lg border border-blue-200'
      },
      lambert: {
        own: 'bg-green-500 text-white rounded-l-lg rounded-tr-lg shadow-lg',
        other: 'bg-green-100 text-green-900 rounded-r-lg rounded-tl-lg border border-green-200'
      },
      duo: {
        own: 'bg-amber-500 text-white rounded-l-lg rounded-tr-lg shadow-lg',
        other: 'bg-amber-100 text-amber-900 rounded-r-lg rounded-tl-lg border border-amber-200'
      }
    };
    
    const authorColors = userColors[author] || userColors.duo;
    return isCurrentUser ? authorColors.own : authorColors.other;
  };

  const getCurrentUserStyle = (author) => {
    // Placement intelligent des messages
    if (author === 'duo') {
      return 'mx-auto'; // Duo au centre
    } else if (author === app.currentUser) {
      return 'ml-auto'; // Utilisateur actuel à droite
    } else {
      return 'mr-auto'; // Autre utilisateur à gauche
    }
  };

  // Fonctions de gestion des messages
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await app.addMessageToSession(app.currentChatSession.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    try {
      const updatedSession = {
        ...app.currentChatSession,
        notes: app.currentChatSession.notes.map(note =>
          note.id === editingMessage
            ? { ...note, content: editContent.trim(), edited: true }
            : note
        )
      };

      await app.updateSession(updatedSession);
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('❌ Erreur modification message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Supprimer ce message ?')) return;

    try {
      const updatedSession = {
        ...app.currentChatSession,
        notes: app.currentChatSession.notes.filter(note => note.id !== messageId)
      };

      await app.updateSession(updatedSession);
    } catch (error) {
      console.error('❌ Erreur suppression message:', error);
    }
  };

  // Fonctions d'édition du titre
  const handleStartEditTitle = () => {
    setTitleContent(app.currentChatSession.gameTitle);
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!titleContent.trim()) {
      setEditingTitle(false);
      return;
    }

    try {
      const updatedSession = {
        ...app.currentChatSession,
        gameTitle: titleContent.trim()
      };
      await app.updateSession(updatedSession);
      setEditingTitle(false);
    } catch (error) {
      console.error('❌ Erreur modification titre:', error);
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(false);
    setTitleContent('');
  };

  // Fonctions d'édition du sous-titre
  const handleStartEditSubtitle = () => {
    // Créer un sous-titre par défaut basé sur l'utilisateur
    const defaultSubtitle = `Conversation avec ${userManager.getDisplayName(app.currentUser)}`;
    setSubtitleContent(app.currentChatSession.subtitle || defaultSubtitle);
    setEditingSubtitle(true);
  };

  const handleSaveSubtitle = async () => {
    try {
      const updatedSession = {
        ...app.currentChatSession,
        subtitle: subtitleContent.trim()
      };
      await app.updateSession(updatedSession);
      setEditingSubtitle(false);
    } catch (error) {
      console.error('❌ Erreur modification sous-titre:', error);
    }
  };

  const handleCancelEditSubtitle = () => {
    setEditingSubtitle(false);
    setSubtitleContent('');
  };

  return (
    <div className="flex flex-col h-screen max-h-[85vh]">
      
      {/* Header de la session avec édition */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={() => app.closeChatSession()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Retour aux sessions"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1">
            {/* Titre éditable */}
            <div className="flex items-center group">
              {editingTitle ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={titleContent}
                    onChange={(e) => setTitleContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEditTitle();
                    }}
                    className="flex-1 text-lg font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    title="Sauvegarder"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleStartEditTitle}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <h1 className="text-lg font-bold text-gray-900">
                    {app.currentChatSession.gameTitle}
                  </h1>
                  <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            
            {/* Sous-titre éditable */}
            <div className="flex items-center group">
              {editingSubtitle ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={subtitleContent}
                    onChange={(e) => setSubtitleContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSubtitle();
                      if (e.key === 'Escape') handleCancelEditSubtitle();
                    }}
                    className="flex-1 text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveSubtitle}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    title="Sauvegarder"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelEditSubtitle}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Annuler"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleStartEditSubtitle}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <p className="text-sm text-gray-500">
                    {app.currentChatSession.subtitle || `Conversation avec ${userManager.getDisplayName(app.currentUser)}`}
                  </p>
                  <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Info session */}
        <div className="text-right text-sm text-gray-500">
          <div>{app.currentChatSession.notes?.length || 0} messages</div>
          <div>{new Date(app.currentChatSession.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        
        {/* Message d'aide si pas de messages */}
        {(!app.currentChatSession.notes || app.currentChatSession.notes.length === 0) && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💭</div>
            <p className="text-gray-500">
              Aucun message pour le moment. Commencez la conversation !
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Entrée = nouvelle ligne • Shift+Entrée = envoyer
            </p>
          </div>
        )}

        {/* Messages avec couleurs thématiques */}
        {app.currentChatSession.notes?.map((message) => (
          <div
            key={message.id}
            className={`flex ${getCurrentUserStyle(message.author)} max-w-xs sm:max-w-md lg:max-w-lg`}
          >
            <div className="group relative">
              
              {/* Bulle de message avec couleurs thématiques */}
              <div className={`px-4 py-3 ${getUserBubbleStyle(message.author)} transition-all duration-200`}>
                
                {/* Mode édition */}
                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Sauver
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contenu du message */}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    
                    {/* Indicateur d'édition */}
                    {message.edited && (
                      <div className="text-xs opacity-70 italic mt-1">modifié</div>
                    )}
                    
                    {/* Boutons d'action (visibles au hover, seulement pour ses propres messages) */}
                    {message.author === app.currentUser && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg p-1 -mr-2 -mt-2">
                        <button
                          onClick={() => handleEditMessage(message)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-1 hover:bg-red-100 rounded ml-1"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Ref pour auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie avec raccourcis inversés */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              // MODIFICATION: Entrée = nouvelle ligne, Shift+Entrée = envoyer
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
              // Laisser le comportement par défaut pour Entrée simple (nouvelle ligne)
            }}
            placeholder="Tapez votre message... (Shift+Entrée pour envoyer)"
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center transition-colors"
            title="Envoyer message (Shift+Entrée)"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Aide avec raccourcis mis à jour */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          <span className="font-medium">Entrée</span> = nouvelle ligne • <span className="font-medium">Shift+Entrée</span> = envoyer
        </div>
      </div>
    </div>
  );
}