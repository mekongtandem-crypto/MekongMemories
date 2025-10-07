/**
 * UnifiedTopBar.jsx v2.1 - Version Complète et Restaurée
 * ✅ Contient le code fonctionnel pour TOUTES les pages : Memories, Sessions, Chat, et Settings.
 * ✅ Le titre éditable pour la page Chat est correctement placé au centre.
 * ✅ Le menu "..." de la page Chat avec les statistiques et le bouton supprimer est fonctionnel.
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, Map, Search, Dices, 
  MoreVertical, Type, Image as ImageIcon, Camera,
  CloudOff, Cloud, Edit, Trash2, ArrowUpDown,
  Check, X, Bell
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { userManager } from '../core/UserManager.js';

// Helper pour formater les dates, utilisé dans le menu du chat
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

export default function UnifiedTopBar({ 
  currentPage,
  onPageChange,
  isTimelineVisible,
  setIsTimelineVisible,
  isSearchOpen,
  setIsSearchOpen,
  currentDay,
  setCurrentDay,
  jumpToDay,
  navigateDay,
  displayOptions,
  setDisplayOptions,
  jumpToRandomMoment,
  chatSession,
  onCloseChatSession
}) {
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMomentFilterMenu, setShowMomentFilterMenu] = useState(false);
  const [currentMomentFilter, setCurrentMomentFilter] = useState('all');
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [notificationState, setNotificationState] = useState('idle'); // idle, sending, sent, already_notified
  const titleInputRef = useRef(null);
  
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  const momentFilterMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
      if (momentFilterMenuRef.current && !momentFilterMenuRef.current.contains(e.target)) setShowMomentFilterMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

useEffect(() => {
    if (currentPage === 'chat' && chatSession && app.currentUser) {
        const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
        if (!otherUser) return;

        // On vérifie s'il y a une notification envoyée PAR MOI à l'autre
        const notifSentByMe = window.notificationManager?.getNotificationForSession(chatSession.id, otherUser.id);
        // On vérifie s'il y a une notification envoyée PAR L'AUTRE à moi
        const notifSentToMe = window.notificationManager?.getNotificationForSession(chatSession.id, app.currentUser.id);

        if (notifSentByMe) {
            // Une notif existe, envoyée par moi. Je peux l'annuler.
            setNotificationState('already_notified');
        } else if (notifSentToMe) {
            // Une notif existe, envoyée par l'autre. Le bouton est "verrouillé".
            setNotificationState('locked'); 
        } else {
            // Aucune notif. Je peux en envoyer une.
            setNotificationState('idle');
        }
    }
}, [chatSession, currentPage, app.currentUser]);

  const handleDayWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    navigateDay(delta);
  };

  const handleCreateTestSession = async () => {
    try {
      const sessionData = { id: `test_${Date.now()}`, title: `Session de test`, description: 'Session créée manuellement', systemMessage: '💬 Session de test créée.' };
      const newSession = await app.createSession(sessionData, 'Message de test initial', null);
      if (newSession) await app.openChatSession(newSession);
    } catch (error) { console.error('Erreur création session test:', error); alert('Impossible de créer la session'); }
  };
  
  const handleStartEditTitle = () => {
    if (!chatSession) return;
    setEditingTitle(true);
    setTitleValue(chatSession.gameTitle);
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim()) { setEditingTitle(false); return; }
    try {
      const updatedSession = { ...chatSession, gameTitle: titleValue.trim() };
      await app.updateSession(updatedSession);
      setEditingTitle(false);
    } catch (error) { console.error('❌ Erreur modification titre:', error); }
  };

  const handleCancelEditTitle = () => { setEditingTitle(false); setTitleValue(''); };

  const handleDeleteCurrentSession = async () => {
    if (!chatSession) return;
    setShowMenu(false);
    if (confirm(`Supprimer la session "${chatSession.gameTitle}" ? Cette action est irréversible.`)) {
      await app.deleteSession(chatSession.id);
      onCloseChatSession();
    }
  };
  
// REMPLACER la fonction handleSendNotification par celle-ci (avec le mot-clé async)

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
      case 'memories': return (
        <div className="flex items-center space-x-2"><button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg transition-colors ${isSearchOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`} title="Recherche"><Search className="w-5 h-5" /></button></div>
      );
      case 'chat': return (
        <button onClick={onCloseChatSession} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Retour aux sessions"><ArrowLeft className="w-5 h-5" /></button>
      );
      case 'sessions': return (
        <button onClick={handleCreateTestSession} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Nouvelle session"><Plus className="w-5 h-5" /></button>
      );
      case 'settings': return (
        <div className="p-2"><Settings className="w-5 h-5 text-gray-600" /></div>
      );
      default: return null;
    }
  };

  const renderContext = () => {
    switch (currentPage) {
      case 'memories': {
        const filterIcons = { all: '📋', unexplored: '✨', with_posts: '📄', with_photos: '📸' };
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button onClick={() => setDisplayOptions(prev => ({...prev, showPostText: !prev.showPostText}))} className={`p-1.5 rounded transition-colors ${displayOptions.showPostText ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showPostText ? 'Masquer' : 'Afficher'} texte articles`}><Type className="w-4 h-4" /></button>
              <button onClick={() => setDisplayOptions(prev => ({...prev, showPostPhotos: !prev.showPostPhotos}))} className={`p-1.5 rounded transition-colors ${displayOptions.showPostPhotos ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showPostPhotos ? 'Masquer' : 'Afficher'} photos articles`}><ImageIcon className="w-4 h-4" /></button>
              <button onClick={() => setDisplayOptions(prev => ({...prev, showMomentPhotos: !prev.showMomentPhotos}))} className={`p-1.5 rounded transition-colors ${displayOptions.showMomentPhotos ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showMomentPhotos ? 'Masquer' : 'Afficher'} photos moments`}><Camera className="w-4 h-4" /></button>
            </div>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <div className="relative hidden md:block" ref={sortMenuRef}><button onClick={() => setShowSortMenu(!showSortMenu)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Trier les moments"><ArrowUpDown className="w-4 h-4" /></button>{showSortMenu && (<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">{/* Menu de tri */}<button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('chrono'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📅</span><span>Chronologique</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('recent'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>🕐</span><span>Plus récents</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('content'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📸</span><span>Plus de contenu</span></button></div>)}</div>
            <div className="relative hidden md:block"><button onClick={() => setShowMomentFilterMenu(!showMomentFilterMenu)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Filtrer les moments"><span className="text-lg">{filterIcons[currentMomentFilter]}</span></button>{showMomentFilterMenu && (<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">{/* Menu de filtre */}<button onClick={() => { if (window.memoriesPageFilters?.setMomentFilter) { window.memoriesPageFilters.setMomentFilter('all'); } setCurrentMomentFilter('all'); setShowMomentFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📋</span><span>Tous les moments</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setMomentFilter) { window.memoriesPageFilters.setMomentFilter('unexplored'); } setCurrentMomentFilter('unexplored'); setShowMomentFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>✨</span><span>Non explorés</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setMomentFilter) { window.memoriesPageFilters.setMomentFilter('with_posts'); } setCurrentMomentFilter('with_posts'); setShowMomentFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📄</span><span>Avec articles</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setMomentFilter) { window.memoriesPageFilters.setMomentFilter('with_photos'); } setCurrentMomentFilter('with_photos'); setShowMomentFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📸</span><span>Avec photos</span></button></div>)}</div>
            <div className="flex items-center space-x-2 md:hidden"><button onClick={jumpToRandomMoment} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Moment au hasard"><Dices className="w-4 h-4" /></button><input type="number" value={currentDay} onChange={(e) => { const day = parseInt(e.target.value, 10); if (!isNaN(day)) setCurrentDay(day);}} onKeyDown={(e) => { if (e.key === 'Enter') jumpToDay(currentDay); }} className="w-14 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-blue-500" /></div>
            <span className="text-gray-300 hidden md:inline">|</span> 
            <div className="hidden md:flex items-center space-x-2"><button onClick={jumpToRandomMoment} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Moment au hasard"><Dices className="w-4 h-4" /></button><input type="number" value={currentDay} onChange={(e) => { const day = parseInt(e.target.value, 10); if (!isNaN(day)) setCurrentDay(day); }} onKeyDown={(e) => { if (e.key === 'Enter') jumpToDay(currentDay); }} onWheel={handleDayWheel} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        );
      }
      case 'sessions': {
        const currentUserId = app.currentUser?.id; if (!currentUserId) return null;
        const activeSessions = app.sessions?.filter(s => !s.archived) || [];
        const enrichedSessions = activeSessions.map(s => { const notes = s.notes || []; const lastMsg = notes.length > 0 ? notes[notes.length - 1] : null; const isPendingYou = lastMsg && lastMsg.author !== currentUserId; const isPendingOther = lastMsg && lastMsg.author === currentUserId; const hasNotif = window.notificationManager?.hasUnreadNotificationForSession(s.id, currentUserId); return { ...s, hasNotif, isPendingYou: isPendingYou && !hasNotif, isPendingOther }; });
        const totalActive = activeSessions.length; const notifiedCount = enrichedSessions.filter(s => s.hasNotif).length; const pendingYouCount = enrichedSessions.filter(s => s.isPendingYou).length; const pendingOtherCount = enrichedSessions.filter(s => s.isPendingOther).length;
        const activeFilter = window.sessionPageState?.activeFilter || null;
        return (
          <div className="flex items-center space-x-2"><button onClick={(e) => { e.stopPropagation(); if (window.sessionPageFilters?.setGroupFilter) { window.sessionPageFilters.setGroupFilter(null); } }} className={`text-sm font-semibold transition-colors ${activeFilter === null ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}`}>{totalActive} Session{totalActive > 1 ? 's' : ''}</button><span className="text-gray-300">·</span>{notifiedCount > 0 && (<button onClick={(e) => { e.stopPropagation(); if (window.sessionPageFilters?.setGroupFilter) { window.sessionPageFilters.setGroupFilter('notified'); } }} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'notified' ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}><span>🔔</span><span>{notifiedCount}</span></button>)}{pendingYouCount > 0 && (<button onClick={(e) => { e.stopPropagation(); if (window.sessionPageFilters?.setGroupFilter) { window.sessionPageFilters.setGroupFilter('pending_you'); } }} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'pending_you' ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}><span>🟡</span><span>{pendingYouCount}</span></button>)}{pendingOtherCount > 0 && (<button onClick={(e) => { e.stopPropagation(); if (window.sessionPageFilters?.setGroupFilter) { window.sessionPageFilters.setGroupFilter('pending_other'); } }} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'pending_other' ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}><span>🔵</span><span>{pendingOtherCount}</span></button>)}</div>
        );
      }
      case 'chat': {
        if (!chatSession) return null;
        if (editingTitle) {
          return (
            <div className="flex items-center space-x-2 w-full max-w-md">
              <input ref={titleInputRef} type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') handleCancelEditTitle(); }} className="flex-1 px-3 py-1 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-amber-600 text-sm" placeholder="Titre de la session..." />
              <button onClick={handleSaveTitle} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Sauvegarder (Enter)"><Check className="w-5 h-5" /></button>
              <button onClick={handleCancelEditTitle} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Annuler (Escape)"><X className="w-5 h-5" /></button>
            </div>
          );
        } else {
          return (
            <div onClick={handleStartEditTitle} className="group flex items-center justify-center w-full min-w-0 px-2 py-1 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors" title="Cliquer pour modifier le titre">
              <h2 className="text-sm font-semibold text-amber-600 truncate">{chatSession.gameTitle}</h2>
              <Edit className="w-4 h-4 ml-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
  const userStyle = userManager.getUserStyle(currentUserObj?.id); // <-- CETTE LIGNE
  const isOnline = app.connection?.isOnline;

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center">
      {/* SECTION GAUCHE */}
      <div className="w-1/4 flex items-center space-x-2">
        {renderLeftAction()}
      </div>

      {/* SECTION CENTRALE */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        {renderContext()}
      </div>

      {/* SECTION DROITE */}
      <div className="w-1/4 flex items-center justify-end space-x-2">
        
        {/* Affiche les boutons spécifiques à la page Chat */}
        {currentPage === 'chat' && (
          <>
            {/* Bouton de notification - nouveau style */}
<button
    onClick={handleSendNotification}
    disabled={notificationState === 'sending' || notificationState === 'locked'}
    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
        notificationState === 'already_notified' 
          ? 'bg-orange-500 hover:bg-orange-600'
        : notificationState === 'locked'
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-gray-200 hover:bg-gray-300'
    }`}
    title={(() => {
        const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
        const otherUserName = otherUser?.name || 'l\'autre utilisateur';
        
        if (notificationState === 'already_notified') {
            return `${otherUserName} est notifié. Cliquer pour annuler.`;
        }
        if (notificationState === 'locked') {
            return `Vous ne pouvez pas notifier, ${otherUserName} a déjà notifié cette session.`;
        }
        return `Notifier ${otherUserName}`;
    })()}
>
    <Bell className={`w-5 h-5 ${
        notificationState === 'already_notified' 
          ? 'text-white' 
          : 'text-gray-600'
    }`} />
</button>

            {/* Menu "..." */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Options de la session">
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && renderMenu()}
            </div>
          </>
        )}

        {/* Avatar (commun à toutes les pages) */}
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
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
     