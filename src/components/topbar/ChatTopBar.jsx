/**
 * ChatTopBar.jsx v1.1 - Phase 25 : Refactoring TopBar
 * TopBar spécifique à la page Chat
 * ✅ Transitions 150ms
 * 
 * Layout :
 * - Gauche : ✕ Fermer
 * - Centre : Titre (éditable) | 🔔 Notification
 * - Droite : ... Menu (Infos, Thèmes, Supprimer)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Edit, Bell, MoreVertical, 
  Sparkles, Tag, Trash2, Check
} from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function ChatTopBar({ 
  onCloseChatSession 
}) {
  
  const app = useAppState();
  
  const [showMenu, setShowMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [notificationState, setNotificationState] = useState('idle');
  
  const titleInputRef = useRef(null);
  
  // Auto-focus input titre en mode édition
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);
  
  // Calcul état notification
  useEffect(() => {
    if (!app.currentChatSession || !app.currentUser) return;
    
    const otherUser = userManager.getAllUsers().find(
      u => u.id !== 'duo' && u.id !== app.currentUser.id
    );
    
    if (!otherUser) return;
    
    const notifSentByMe = window.notificationManager?.getNotificationForSession(
      app.currentChatSession.id, 
      otherUser.id
    );
    
    const notifSentToMe = window.notificationManager?.getNotificationForSession(
      app.currentChatSession.id, 
      app.currentUser.id
    );
    
    if (notifSentByMe) {
      setNotificationState('already_notified');
    } else if (notifSentToMe) {
      setNotificationState('locked');
    } else {
      setNotificationState('idle');
    }
  }, [app.currentChatSession, app.currentUser]);
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleStartEditTitle = () => {
    if (!app.currentChatSession) return;
    setEditingTitle(true);
    setTitleValue(app.currentChatSession.gameTitle);
  };
  
  const handleSaveTitle = async () => {
    if (!titleValue.trim()) {
      setEditingTitle(false);
      return;
    }
    
    const updatedSession = {
      ...app.currentChatSession,
      gameTitle: titleValue.trim()
    };
    
    await app.updateSession(updatedSession);
    setEditingTitle(false);
  };
  
  const handleCancelEditTitle = () => {
    setEditingTitle(false);
    setTitleValue('');
  };
  
  const handleDeleteCurrentSession = async () => {
    if (!app.currentChatSession) return;
    
    setShowMenu(false);
    
    if (confirm(`Supprimer la session "${app.currentChatSession.gameTitle}" ?`)) {
      await app.deleteSession(app.currentChatSession.id);
      onCloseChatSession();
    }
  };
  
  const handleSendNotification = async () => {
    if (!app.currentChatSession || !app.currentUser) return;
    
    const otherUser = userManager.getAllUsers().find(
      u => u.id !== 'duo' && u.id !== app.currentUser.id
    );
    
    if (!otherUser) return;
    
    // Si déjà notifié → Annuler
    const existingNotif = window.notificationManager?.getNotificationForSession(
      app.currentChatSession.id, 
      otherUser.id
    );
    
    if (existingNotif && notificationState === 'already_notified') {
      await window.notificationManager.deleteNotification(existingNotif.id);
      setNotificationState('idle');
      window.chatPageActions?.showFeedback(`Notification pour ${otherUser.name} annulée`);
      return;
    }
    
    // Vérifier si l'autre a déjà notifié
    const notifFromOther = window.notificationManager?.getNotificationForSession(
      app.currentChatSession.id, 
      app.currentUser.id
    );
    
    if (notifFromOther) {
      window.chatPageActions?.showFeedback(`${otherUser.name} a déjà demandé votre attention ici.`);
      return;
    }
    
    // Envoyer notification
    setNotificationState('sending');
    
    try {
      await app.sendNotification(
        otherUser.id, 
        app.currentChatSession.id, 
        app.currentChatSession.gameTitle
      );
      setNotificationState('already_notified');
      window.chatPageActions?.showFeedback(`Notification envoyée à ${otherUser.name}`);
    } catch (error) {
      console.error("Erreur d'envoi de la notification:", error);
      setNotificationState('idle');
    }
  };
  
  // ========================================
  // RENDER
  // ========================================
  
  if (!app.currentChatSession) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">Aucune session ouverte</span>
      </div>
    );
  }
  
  const otherUser = userManager.getAllUsers().find(
    u => u.id !== 'duo' && u.id !== app.currentUser?.id
  );
  const otherUserName = otherUser?.name || '...';
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">
      
      {/* ========================================
          GAUCHE : Fermer
      ======================================== */}
      <div className="flex items-center">
        <button 
          onClick={onCloseChatSession}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          title="Fermer le chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* ========================================
          CENTRE : Titre (cliquable pour éditer)
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') handleCancelEditTitle();
            }}
            className="flex-1 max-w-md px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Titre de la session"
          />
        ) : (
          <button
            onClick={handleStartEditTitle}
            className="group flex items-center min-w-0 pr-2 cursor-pointer max-w-md"
            title="Modifier le titre"
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {app.currentChatSession.gameTitle}
            </h2>
            <Edit className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-150" />
          </button>
        )}
      </div>
      
      {/* ========================================
          DROITE : Boutons édition (mode prioritaire) + Notification + Menu
      ======================================== */}
      <div className="flex items-center justify-end space-x-2">
        
        {/* Boutons validation édition (PRIORITAIRES - au-dessus de tout) */}
        {editingTitle && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveTitle}
              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-150"
              title="Valider"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelEditTitle}
              className="p-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors duration-150"
              title="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Bouton notification (masqué en mode édition) */}
        {!editingTitle && (
          <button
            onClick={handleSendNotification}
            disabled={notificationState === 'sending' || notificationState === 'locked'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${
              notificationState === 'already_notified'
                ? 'bg-orange-500 hover:bg-orange-600'
                : notificationState === 'locked'
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={
              notificationState === 'already_notified'
                ? `Annuler la notification pour ${otherUserName}`
                : notificationState === 'locked'
                  ? `Déjà notifié par ${otherUserName}`
                  : `Notifier ${otherUserName}`
            }
          >
            <Bell className={`w-5 h-5 ${
              notificationState === 'already_notified'
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`} />
          </button>
        )}
        
        {/* Menu overflow (toujours visible) */}
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
            title="Menu"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <OverflowMenu
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
          >
            {/* Actions spécifiques Chat */}
            
            {/* Infos session */}
            <button
              onClick={() => {
                setShowMenu(false);
                window.chatPageHandlers?.toggleInfoPanel?.();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-900 dark:text-gray-100">Infos session</span>
            </button>
            
            {/* Gérer thèmes */}
            <button
              onClick={() => {
                setShowMenu(false);
                window.chatPageHandlers?.openThemeModal?.();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
            >
              <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-gray-900 dark:text-gray-100">Gérer les thèmes</span>
            </button>
            
            {/* Séparateur */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            
            {/* Renommer session */}
            <button
              onClick={() => {
                setShowMenu(false);
                handleStartEditTitle();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
            >
              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">Renommer session</span>
            </button>
            
            {/* Supprimer session */}
            <button
              onClick={handleDeleteCurrentSession}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center space-x-2 transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer la session</span>
            </button>
            
          </OverflowMenu>
        </div>
        
      </div>
      
    </div>
  );
}