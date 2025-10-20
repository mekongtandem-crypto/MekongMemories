/**
 * ChatPage.jsx v2.5 - Phase 18b : Liens + Photos
 * ✅ Bouton [🔗 Liens/Photos]
 * ✅ État pendingLink + attachedPhoto
 * ✅ Preview lien avant envoi
 * ✅ Envoi message avec linkedContent
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { Send, Trash2, Edit, Camera, Link, FileText, MapPin, Image as ImageIcon } from 'lucide-react';
import PhotoViewer from '../PhotoViewer.jsx';

export default function ChatPage({ navigationContext, onClearAttachment, onStartSelectionMode }) {
  const app = useAppState();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  // Phase 17b : Photo attachée
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  
  // ⭐ NOUVEAU Phase 18b : Lien en attente
  const [pendingLink, setPendingLink] = useState(null);
  
  const [viewerState, setViewerState] = useState({ 
    isOpen: false, photo: null 
  });
  
  const messagesEndRef = useRef(null);

  // Scroll vers dernier message
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [app.currentChatSession?.notes]);

/// Détecter photo attachée ou lien depuis Memories
useEffect(() => {
  let hasCleared = false;
  
  if (navigationContext?.pendingAttachment) {
    const { type, data } = navigationContext.pendingAttachment;
    
    if (type === 'photo') {
      console.log('📎 Photo reçue depuis Memories:', data);
      setAttachedPhoto(data);
      
      if (!hasCleared) {
        console.log('🧹 Clear pendingAttachment');
        onClearAttachment?.();
        hasCleared = true;
      }
    }
  }
  
  if (navigationContext?.pendingLink) {
    console.log('🔗 Lien reçu depuis Memories:', navigationContext.pendingLink);
    setPendingLink(navigationContext.pendingLink);
    
    if (!hasCleared) {
      console.log('🧹 Clear pendingLink');
      onClearAttachment?.();
      hasCleared = true;
    }
  }
  // ⭐ MODIFIÉ : Retirer onClearAttachment des dépendances
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [navigationContext?.pendingAttachment, navigationContext?.pendingLink]);

useEffect(() => {
  window.chatPageActions = {
    showFeedback: (message) => {
      setFeedbackMessage(message);
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 2500);
    }
  };
  return () => {
    delete window.chatPageActions;
  };
}, []);

  // ========================================
  // ⭐ NOUVEAU Phase 18b : HANDLERS LIENS
  // ========================================

  const handleOpenLinkPicker = () => {
    console.log('🔗 Ouverture sélecteur de liens');
    
    if (!onStartSelectionMode) {
      console.error('❌ onStartSelectionMode non fourni !');
      return;
    }
    
    // ⭐ MODIFIÉ : Plus besoin de callback, passage via navigationContext
    onStartSelectionMode('link', null);
  };

  const handleClearPendingLink = () => {
    console.log('🧹 Clear pending link');
    setPendingLink(null);
  };

  // ========================================
  // HANDLERS MESSAGES
  // ========================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedPhoto && !pendingLink) return;

    try {
      // ⭐ MODIFIÉ : Support linkedContent
      const messageData = {
        content: newMessage.trim(),
        linkedContent: pendingLink ? {
          type: pendingLink.type,
          id: pendingLink.id,
          title: pendingLink.title
        } : null
      };
      
      await app.addMessageToSession(
        app.currentChatSession.id, 
        messageData.content, 
        attachedPhoto,
        messageData.linkedContent  // ⭐ Nouveau param
      );
      
      setNewMessage('');
      setAttachedPhoto(null);
      setPendingLink(null);
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

  // ========================================
  // PHOTO VIEWER
  // ========================================

  const openPhotoViewer = (photo) => {
    setViewerState({ isOpen: true, photo });
  };

  const closePhotoViewer = () => {
    setViewerState({ isOpen: false, photo: null });
  };

  // ========================================
  // HELPERS ICÔNES LIENS
  // ========================================

  const getLinkIcon = (type) => {
    switch(type) {
      case 'moment': return <MapPin className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      default: return <Link className="w-4 h-4" />;
    }
  };

  const getLinkColor = (type) => {
    switch(type) {
      case 'moment': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'post': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'photo': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // ========================================
  // RENDER
  // ========================================

  if (!app.currentChatSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune session de chat</h2>
        <p className="text-gray-600 mb-6">
          Sélectionnez une session depuis la page Sessions pour commencer une conversation.
        </p>
      </div>
    );
  }

  const getUserBubbleStyle = (author) => {
    const isCurrentUser = author === app.currentUser?.id;
    const style = userManager.getUserStyle(author);

    if (isCurrentUser) {
      return `${style.strong_bg} text-white rounded-l-lg rounded-tr-lg shadow-lg`;
    } else {
      return `${style.bg} ${style.text} rounded-r-lg rounded-tl-lg border ${style.border}`;
    }
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
  
  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        
        {(!app.currentChatSession.notes || app.currentChatSession.notes.length === 0) && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💭</div>
            <p className="text-gray-500">
              Aucun message pour le moment. Commencez la conversation !
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
                    {/* ⭐ NOUVEAU : Lien si présent */}
                    {message.linkedContent && (
                      <div className={`mb-2 inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getLinkColor(message.linkedContent.type)}`}>
                        {getLinkIcon(message.linkedContent.type)}
                        <span className="font-medium text-sm">
                          {message.linkedContent.title}
                        </span>
                      </div>
                    )}
                    
                    {/* Photo si présente */}
                    {message.photoData && (
                      <PhotoMessage 
                        photo={message.photoData}
                        onPhotoClick={openPhotoViewer}
                      />
                    )}
                    
                    {/* Texte */}
                    {message.content && (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                    )}
                    
                    {/* Badge modifié */}
                    {message.edited && (
                      <div className="text-xs opacity-70 italic mt-1">modifié</div>
                    )}

                    {app.currentUser && message.author === app.currentUser.id && (
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
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
<div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
  
  {/* ⭐ Preview lien (si présent) */}
  {pendingLink && (
    <div className={`mb-3 rounded-lg border-2 p-3 ${getLinkColor(pendingLink.type)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getLinkIcon(pendingLink.type)}
          <span className="font-medium truncate">{pendingLink.title}</span>
        </div>
        <button
          onClick={handleClearPendingLink}
          className="p-1 hover:bg-white/50 rounded flex-shrink-0"
          title="Retirer lien"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )}
  
  {/* Preview photo (si présente) */}
  {attachedPhoto && (
    <div className="mb-3 relative group">
      <div className="relative rounded-lg overflow-hidden border-2 border-purple-300 shadow-md">
        <PhotoPreview photo={attachedPhoto} />
        
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-bl-lg shadow-lg p-1">
          <button
            onClick={() => setAttachedPhoto(null)}
            className="p-1 hover:bg-red-100 rounded"
            title="Retirer photo"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
        
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          📎 Photo attachée
        </div>
      </div>
    </div>
  )}

  {/* ⭐ NOUVEAU LAYOUT : [🔗+] Input [✉️] */}
  <div className="flex items-end space-x-2">
    
    {/* Bouton Liens/Photos à GAUCHE */}
    <button
      onClick={handleOpenLinkPicker}
      className="flex-shrink-0 p-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
      title="Ajouter lien ou photo"
    >
      <Link className="w-6 h-6" />
    </button>
    
    {/* Input message au CENTRE */}
    <textarea
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      }}
      placeholder={
        pendingLink || attachedPhoto 
          ? "Ajouter un message (optionnel)..." 
          : "Tapez votre message... (Shift+Entrée pour envoyer)"
      }
      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      rows="2"
    />
    
    {/* Bouton Envoyer à DROITE */}
    <button
      onClick={handleSendMessage}
      disabled={!newMessage.trim() && !attachedPhoto && !pendingLink}
      className="flex-shrink-0 p-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      title="Envoyer (Shift+Entrée)"
    >
      <Send className="w-6 h-6" />
    </button>
  </div>
  
  {/* ⭐ Indicateur discret (en dessous si quelque chose attaché) */}
  {(pendingLink || attachedPhoto) && (
    <div className="mt-2 text-xs text-gray-500 flex items-center justify-center space-x-2">
      {pendingLink && <span>🔗 1 lien</span>}
      {pendingLink && attachedPhoto && <span>•</span>}
      {attachedPhoto && <span>📷 1 photo</span>}
    </div>
  )}
</div>

      {/* PhotoViewer */}
      {viewerState.isOpen && viewerState.photo && (
        <PhotoViewer 
          photo={viewerState.photo}
          gallery={[viewerState.photo]}
          contextMoment={null}
          onClose={closePhotoViewer}
          onCreateSession={null}
        />
      )}
      
      {/* Feedback temporaire */}
      {feedbackMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          {feedbackMessage}
        </div>
      )}
    </div> 
  );
}

// ========================================
// COMPOSANT PhotoMessage
// ========================================

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
        if (!photo.google_drive_id && photo.url) {
          if (isMounted) {
            setImageUrl(photo.url);
            setLoading(false);
          }
          return;
        }
        
        const url = await window.photoDataV2.resolveImageUrl(photo, true);
        if (isMounted) {
          if (url && !url.startsWith('data:image/svg+xml')) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement photo:', err);
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
    </div>
  );
}

// ========================================
// COMPOSANT PhotoPreview (pour input)
// ========================================

function PhotoPreview({ photo }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      if (!photo) return;
      
      try {
        setLoading(true);
        const url = await window.photoDataV2.resolveImageUrl(photo, false);
        if (isMounted && url && !url.startsWith('data:image/svg+xml')) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('❌ Erreur preview photo:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    resolveUrl();
    return () => { isMounted = false; };
  }, [photo]);

  if (loading) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center animate-pulse">
        <Camera className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-300 flex items-center justify-center">
        <Camera className="w-8 h-8 text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={photo.filename}
      className="w-full max-h-96 object-contain bg-gray-100"
    />
  );
}