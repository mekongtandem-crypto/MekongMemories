/**
 * ChatPage.jsx v2.0 - Header compact + Photos
 * ✅ Header réduit à 40px (une ligne)
 * ✅ Affichage photos avec photoData
 * ✅ Miniature cliquable → PhotoViewer
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { ArrowLeft, Send, Edit, Trash2, Check, X, MoreVertical } from 'lucide-react';
import PhotoViewer from '../PhotoViewer.jsx';

export default function ChatPage() {
  const app = useAppState();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleContent, setTitleContent] = useState('');
  
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null 
  });
  
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [app.currentChatSession?.notes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getUserBubbleStyle = (author) => {
    const isCurrentUser = author === app.currentUser?.id;
    
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
    if (author === 'duo') {
      return 'mx-auto';
    } else if (author === app.currentUser?.id) {
      return 'ml-auto';
    } else {
      return 'mr-auto';
    }
  };

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

  const handleStartEditTitle = () => {
    setTitleContent(app.currentChatSession.gameTitle);
    setEditingTitle(true);
    setShowMenu(false);
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

  const openPhotoViewer = (photo) => {
    setViewerState({ isOpen: true, photo });
  };

  const closePhotoViewer = () => {
    setViewerState({ isOpen: false, photo: null });
  };

  return (
    <div className="flex flex-col h-screen max-h-[85vh]">
      
      {/* ✅ NOUVEAU : Header compact 40px */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between" style={{ height: '40px' }}>
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <button
            onClick={() => app.closeChatSession()}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="Retour aux sessions"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {editingTitle ? (
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={titleContent}
                onChange={(e) => setTitleContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="flex-1 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
              />
              <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:bg-green-100 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingTitle(false)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h1 className="text-sm font-semibold text-gray-900 truncate flex-1">
              {app.currentChatSession.gameTitle}
            </h1>
          )}
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Menu"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
              <button
                onClick={handleStartEditTitle}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier le titre</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <div className="px-4 py-2 text-xs text-gray-500">
                {app.currentChatSession.notes?.length || 0} messages
              </div>
              <div className="px-4 py-2 text-xs text-gray-500">
                Créée le {new Date(app.currentChatSession.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        
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

        {app.currentChatSession.notes?.map((message) => (
          <div
            key={message.id}
            className={`flex ${getCurrentUserStyle(message.author)} max-w-xs sm:max-w-md lg:max-w-lg`}
          >
            <div className="group relative">
              
              <div className={`px-4 py-3 ${getUserBubbleStyle(message.author)} transition-all duration-200`}>
                
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
                    {/* ✅ NOUVEAU : Affichage photo si photoData existe */}
                    {message.photoData && (
                      <PhotoMessage 
                        photo={message.photoData}
                        onPhotoClick={openPhotoViewer}
                      />
                    )}
                    
                    {/* Contenu texte */}
                    {message.content && (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    )}
                    
                    {message.edited && (
                      <div className="text-xs opacity-70 italic mt-1">modifié</div>
                    )}

                    {app.currentUser && message.author === app.currentUser.id && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg p-1 -mr-2 -mt-2">
                        <button onClick={() => handleEditMessage(message)} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
                          <Edit className="w-3 h-3 text-gray-600" />
                        </button>
                        <button onClick={() => handleDeleteMessage(message.id)} className="p-1 hover:bg-red-100 rounded ml-1" title="Supprimer">
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
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
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
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          <span className="font-medium">Entrée</span> = nouvelle ligne • <span className="font-medium">Shift+Entrée</span> = envoyer
        </div>
      </div>

      {/* ✅ NOUVEAU : PhotoViewer pour messages avec photo */}
      {viewerState.isOpen && viewerState.photo && (
        <PhotoViewer 
          photo={viewerState.photo}
          gallery={[viewerState.photo]}
          contextMoment={null}
          onClose={closePhotoViewer}
          onCreateSession={null}
        />
      )}
    </div>
  );
}

// ✅ NOUVEAU : Composant PhotoMessage
function PhotoMessage({ photo, onPhotoClick }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const resolveUrl = async () => {
      if (!photo) {
        if (isMounted) setError(true);
        return;
      }
      try {
        const url = await window.photoDataV2.resolveImageUrl(photo, true);
        if (isMounted) {
          if (url && !url.startsWith('data:image/svg+xml')) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    resolveUrl();
    return () => { isMounted = false; };
  }, [photo]);

  if (loading) {
    return (
      <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center mb-2">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-48 h-48 bg-red-100 rounded-lg flex items-center justify-center mb-2">
        <div className="text-red-500 text-sm">Erreur chargement</div>
      </div>
    );
  }

  return (
    <div 
      className="mb-2 cursor-pointer group relative"
      onClick={() => onPhotoClick(photo)}
    >
      <img
        src={imageUrl}
        alt={photo.filename}
        className="max-w-[200px] rounded-lg shadow-md hover:shadow-lg transition-shadow"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>
      <div className="text-xs text-gray-500 mt-1">{photo.filename}</div>
    </div>
  );
}