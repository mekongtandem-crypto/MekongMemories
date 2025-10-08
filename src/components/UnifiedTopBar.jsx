/**
 * UnifiedTopBar.jsx v2.2 - Corrections UI multiples
 * ✅ ChatPage: Titre aligné à gauche, boutons d'action déplacés.
 * ✅ SettingsPage: Bouton "Retour" fonctionnel.
 * ✅ SessionsPage: Compteur de sessions devient un badge cliquable.
 * ✅ Avatar: La couleur de fond est maintenant dynamique et basée sur le choix de l'utilisateur.
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, MoreVertical,
  Edit, Trash2, Check, X, Bell
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { userManager } from '../core/UserManager.js';

// Helper pour formater les dates
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

export default function UnifiedTopBar({ currentPage, onCloseChatSession }) {
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [notificationState, setNotificationState] = useState('idle');
  const titleInputRef = useRef(null);
  
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Gestion des clics extérieurs pour fermer les menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus sur le champ de titre lors de l'édition
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Mise à jour de l'état du bouton de notification
  useEffect(() => {
    if (currentPage === 'chat' && app.currentChatSession && app.currentUser) {
        const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
        if (!otherUser) return;

        const notifSentByMe = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, otherUser.id);
        const notifSentToMe = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, app.currentUser.id);

        if (notifSentByMe) {
            setNotificationState('already_notified');
        } else if (notifSentToMe) {
            setNotificationState('locked'); 
        } else {
            setNotificationState('idle');
        }
    }
  }, [app.currentChatSession, currentPage, app.currentUser]);

  // Handlers pour le titre du chat
  const handleStartEditTitle = () => {
    if (!app.currentChatSession) return;
    setEditingTitle(true);
    setTitleValue(app.currentChatSession.gameTitle);
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim()) { setEditingTitle(false); return; }
    const updatedSession = { ...app.currentChatSession, gameTitle: titleValue.trim() };
    await app.updateSession(updatedSession);
    setEditingTitle(false);
  };

  const handleCancelEditTitle = () => { setEditingTitle(false); setTitleValue(''); };

  // Handler pour supprimer la session
  const handleDeleteCurrentSession = async () => {
    if (!app.currentChatSession) return;
    setShowMenu(false);
    if (confirm(`Supprimer la session "${app.currentChatSession.gameTitle}" ?`)) {
      await app.deleteSession(app.currentChatSession.id);
      onCloseChatSession();
    }
  };
  
  // Handler pour les notifications
  const handleSendNotification = async () => {
    if (!chatSession || !app.currentUser) return;
    const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
    if (!otherUser) return;

    // On récupère la notification existante envoyée par l'utilisateur actuel
    const existingNotif = window.notificationManager?.getNotificationForSession(chatSession.id, otherUser.id);

    // --- LOGIQUE D'ANNULATION ---
    // Si la notif existe et que l'état est 'already_notified', on l'annule.
    if (existingNotif && notificationState === 'already_notified') {
        await window.notificationManager.deleteNotification(existingNotif.id);
        setNotificationState('idle'); // On repasse en mode "prêt à notifier"
        window.chatPageActions?.showFeedback(`Notification pour ${otherUser.name} annulée`);
        return;
    }
    
    // --- LOGIQUE DE BLOCAGE ---
    // On vérifie si l'autre utilisateur n'a pas déjà notifié la session
    const notifFromOther = window.notificationManager?.getNotificationForSession(chatSession.id, app.currentUser.id);
    if (notifFromOther) {
        window.chatPageActions?.showFeedback(`${otherUser.name} a déjà demandé votre attention ici.`);
        return; // On bloque l'envoi
    }

    // --- LOGIQUE D'ENVOI ---
    // Si aucune notification n'existe, on envoie.
    
    setNotificationState('sending');
    try {
        await app.sendNotification(otherUser.id, chatSession.id, chatSession.gameTitle);
        setNotificationState('already_notified'); // ✅ MISE À JOUR IMMÉDIATE
        window.chatPageActions?.showFeedback(`Notification envoyée à ${otherUser.name}`);
    } catch (error) {
        console.error("Erreur d'envoi de la notification:", error);
        setNotificationState('idle');
    }
};

  const renderLeftAction = () => {
    switch (currentPage) {
      case 'chat': 
        return (
          <button onClick={onCloseChatSession} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Retour aux sessions">
            <ArrowLeft className="w-5 h-5" />
          </button>
        );
      case 'sessions': 
        return (
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Nouvelle session">
            <Plus className="w-5 h-5" />
          </button>
        );
      // ✅ CORRECTION : Bouton retour pour les réglages
      case 'settings': 
        return (
          <button onClick={() => app.updateCurrentPage('sessions')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Retour aux sessions">
            <ArrowLeft className="w-5 h-5" />
          </button>
        );
      default: 
        return <div className="w-9 h-9"></div>; // Placeholder pour garder l'alignement
    }
  };

  const renderContext = () => {
    switch (currentPage) {
      // ✅ CORRECTION : Logique pour le compteur de sessions cliquable
      case 'sessions': {
        const currentUserId = app.currentUser?.id;
        if (!currentUserId) return null;
        const activeSessions = app.sessions?.filter(s => !s.archived) || [];
        const enrichedSessions = activeSessions.map(s => { 
            const notes = s.notes || []; 
            const lastMsg = notes.length > 0 ? notes[notes.length - 1] : null; 
            const isPendingYou = lastMsg && lastMsg.author !== currentUserId; 
            const isPendingOther = lastMsg && lastMsg.author === currentUserId; 
            const hasNotif = window.notificationManager?.hasUnreadNotificationForSession(s.id, currentUserId); 
            return { ...s, hasNotif, isPendingYou: isPendingYou && !hasNotif, isPendingOther }; 
        });
        const totalActive = activeSessions.length;
        const notifiedCount = enrichedSessions.filter(s => s.hasNotif).length;
        const pendingYouCount = enrichedSessions.filter(s => s.isPendingYou).length;
        const pendingOtherCount = enrichedSessions.filter(s => s.isPendingOther).length;
        const activeFilter = window.sessionPageState?.activeFilter || null;

        return (
            <div className="flex items-center space-x-2">
                <button onClick={() => window.sessionPageFilters?.setGroupFilter(null)} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === null ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                    <span>{totalActive}</span>
                </button>
                <span className={`text-sm font-semibold ${activeFilter === null ? 'text-amber-600' : 'text-gray-600'}`}>
                    Session{totalActive > 1 ? 's' : ''}
                </span>
                <span className="text-gray-300">·</span>
                {notifiedCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('notified')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'notified' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}><span>🔔</span><span>{notifiedCount}</span></button>)}
                {pendingYouCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('pending_you')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'pending_you' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}><span>🟡</span><span>{pendingYouCount}</span></button>)}
                {pendingOtherCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('pending_other')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'other' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}><span>🔵</span><span>{pendingOtherCount}</span></button>)}
            </div>
        );
      }
      
      // ✅ CORRECTION : Logique pour le titre à gauche et les boutons à droite
      case 'chat': {
        if (!app.currentChatSession) return null;

        const renderChatActions = () => (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSendNotification}
              disabled={notificationState === 'sending' || notificationState === 'locked'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  notificationState === 'already_notified' ? 'bg-orange-500 hover:bg-orange-600'
                : notificationState === 'locked' ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={(() => {
                const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
                const otherUserName = otherUser?.name || 'l\'autre utilisateur';
                if (notificationState === 'already_notified') return `${otherUserName} est notifié. Cliquer pour annuler.`;
                if (notificationState === 'locked') return `Vous ne pouvez pas notifier, ${otherUserName} a déjà notifié cette session.`;
                return `Notifier ${otherUserName}`;
              })()}
            >
              <Bell className={`w-5 h-5 ${notificationState === 'already_notified' ? 'text-white' : 'text-gray-600'}`} />
            </button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Options de la session">
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && renderMenu()}
            </div>
          </div>
        );

        if (editingTitle) {
          return (
            <div className="flex items-center space-x-2 w-full">
              <input ref={titleInputRef} type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') handleCancelEditTitle(); }} className="flex-1 px-3 py-1 border-2 border-amber-300 rounded-lg font-semibold text-amber-600 text-sm" />
              <button onClick={handleSaveTitle} className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><Check className="w-5 h-5" /></button>
              <button onClick={handleCancelEditTitle} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          );
        } else {
          return (
            <div className="flex items-center justify-between w-full">
              <div onClick={handleStartEditTitle} className="group flex items-center min-w-0 pr-4 cursor-pointer" title="Modifier le titre">
                <h2 className="text-sm font-semibold text-amber-600 line-clamp-2">
                  {app.currentChatSession.gameTitle}
                </h2>
                <Edit className="w-4 h-4 ml-2 text-gray-500 opacity-0 group-hover:opacity-100" />
              </div>
              {renderChatActions()}
            </div>
          );
        }
      }

      case 'settings':
        return <span className="text-sm font-semibold text-amber-600">Réglages</span>;
      
      default:
        return null;
    }
  };

  const renderMenu = () => {
    switch (currentPage) {
      case 'chat': {
        if (!chatSession) return null;
        const messageCount = chatSession.notes?.length || 0;
        const createdByUser = userManager.getUser(chatSession.user)?.name || 'N/A';
        const lastMessage = chatSession.notes?.[messageCount - 1];
        const lastModifiedByUser = userManager.getUser(lastMessage?.author)?.name || createdByUser;
        return (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-64 z-50">
            <div className="px-4 py-3 text-xs text-gray-500 space-y-1">
              <div><strong>{messageCount}</strong> message{messageCount > 1 ? 's' : ''}</div>
              <div>Créée par <strong>{createdByUser}</strong> le {formatDateTime(chatSession.createdAt)}</div>
              {lastMessage && (<div>Modifiée par <strong>{lastModifiedByUser}</strong> le {formatDateTime(lastMessage.timestamp)}</div>)}
            </div>
            <div className="border-t border-gray-200 my-1"></div>
            <button onClick={handleDeleteCurrentSession} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"><Trash2 className="w-4 h-4" /><span>Supprimer la session</span></button>
          </div>
        );
      }
      default: return null;
    }
  };

  const renderUserMenu = () => {
    const currentUserObj = app.currentUser;
    const isOnline = app.connection?.isOnline;
    const allUsers = [{ id: 'lambert', name: 'Lambert', emoji: userManager.getUser('lambert')?.emoji || '🚴', color: 'green' }, { id: 'tom', name: 'Tom', emoji: userManager.getUser('tom')?.emoji || '👨‍💻', color: 'blue' }, { id: 'duo', name: 'Duo', emoji: userManager.getUser('duo')?.emoji || '👥', color: 'amber' }];
    const otherUsers = allUsers.filter(u => u.id !== currentUserObj?.id);
    return (
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-64">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2"><span className="text-2xl">{currentUserObj?.emoji || '👤'}</span><div className="flex-1"><div className="text-sm font-medium text-gray-900">{currentUserObj?.name || 'Utilisateur'}</div><div className="text-xs text-gray-500 flex items-center space-x-1">{isOnline ? (<><Cloud className="w-3 h-3 text-green-500" /><span>Connecté</span></>) : (<><CloudOff className="w-3 h-3 text-red-500" /><span>Déconnecté</span></>)}</div></div></div>
        </div>
        <div className="px-4 py-2 border-b border-gray-200"><div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Changer d'utilisateur</div>{otherUsers.map(user => (<button key={user.id} onClick={() => { setShowUserMenu(false); app.setCurrentUser(user.id); }} className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg mb-1 transition-all ${user.color === 'green' ? 'hover:bg-green-50' : user.color === 'blue' ? 'hover:bg-blue-50' : 'hover:bg-amber-50'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${user.color === 'green' ? 'bg-green-100' : user.color === 'blue' ? 'bg-blue-100' : 'bg-amber-100'}`}>{user.emoji}</div><span className="text-sm font-medium text-gray-900">{user.name}</span></button>))}</div>
        {!isOnline && (<button onClick={() => { setShowUserMenu(false); app.connect(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 flex items-center space-x-2"><Cloud className="w-4 h-4" /><span>Se reconnecter</span></button>)}
      </div>
    );
  };

  const currentUserObj = app.currentUser;
  // ✅ CORRECTION : Récupération dynamique du style utilisateur
  const userStyle = userManager.getUserStyle(currentUserObj?.id);
  const isOnline = app.connection?.isOnline;

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
      {/* SECTION GAUCHE */}
      <div className="flex items-center">
        {renderLeftAction()}
      </div>

      {/* SECTION CENTRALE */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        {renderContext()}
      </div>

      {/* SECTION DROITE */}
      <div className="flex items-center justify-end">
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center p-1 hover:bg-gray-100 rounded-lg">
            {/* ✅ CORRECTION : Application de la classe de fond dynamique */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl relative ${userStyle.bg}`}>
              {currentUserObj?.emoji || '👤'}
              {!isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>
              )}
            </div>
          </button>
          {showUserMenu && renderUserMenu()}
        </div>
      </div>
    </div>
  );
}