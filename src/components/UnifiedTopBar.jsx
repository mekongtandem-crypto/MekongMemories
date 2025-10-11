/**
 * UnifiedTopBar.jsx v2.5 - Ajout toggle thèmes
 * ✅ Bouton 🏷️ pour afficher/masquer barre thèmes
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, MoreVertical, Edit, Trash2, Check, X, Bell,
  Map, Search, Dices, FileText, Image as ImageIcon, Camera, Cloud, CloudOff, ArrowUpDown, Tag
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { userManager } from '../core/UserManager.js';

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function UnifiedTopBar({ 
  currentPage, onCloseChatSession, isTimelineVisible, setIsTimelineVisible, 
  isSearchOpen, setIsSearchOpen, displayOptions, setDisplayOptions, jumpToRandomMoment,
  currentDay, setCurrentDay, jumpToDay,
  // ✅ NOUVEAU : props pour toggle thèmes
  isThemeBarVisible, setIsThemeBarVisible
}) {

  const app = useAppState();
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMomentFilterMenu, setShowMomentFilterMenu] = useState(false);
  const [currentMomentFilter, setCurrentMomentFilter] = useState('all');
  
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [notificationState, setNotificationState] = useState('idle');
  
  const sortMenuRef = useRef(null);
  const titleInputRef = useRef(null);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
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
    if (currentPage === 'chat' && app.currentChatSession && app.currentUser) {
        const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
        if (!otherUser) return;
        const notifSentByMe = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, otherUser.id);
        const notifSentToMe = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, app.currentUser.id);
        if (notifSentByMe) setNotificationState('already_notified');
        else if (notifSentToMe) setNotificationState('locked');
        else setNotificationState('idle');
    }
  }, [app.currentChatSession, currentPage, app.currentUser]);

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

  const handleDeleteCurrentSession = async () => {
    if (!app.currentChatSession) return;
    setShowMenu(false);
    if (confirm(`Supprimer la session "${app.currentChatSession.gameTitle}" ?`)) {
      await app.deleteSession(app.currentChatSession.id);
      onCloseChatSession();
    }
  };
  
  const handleDayWheel = (e) => {
    e.preventDefault();
    const newDay = currentDay + (e.deltaY < 0 ? 1 : -1);
    setCurrentDay(Math.max(1, newDay));
  };
  
  const handleSendNotification = async () => {
    if (!app.currentChatSession || !app.currentUser) return;
    const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id);
    if (!otherUser) return;

    const existingNotif = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, otherUser.id);
    if (existingNotif && notificationState === 'already_notified') {
        await window.notificationManager.deleteNotification(existingNotif.id);
        setNotificationState('idle');
        window.chatPageActions?.showFeedback(`Notification pour ${otherUser.name} annulée`);
        return;
    }
    
    const notifFromOther = window.notificationManager?.getNotificationForSession(app.currentChatSession.id, app.currentUser.id);
    if (notifFromOther) {
        window.chatPageActions?.showFeedback(`${otherUser.name} a déjà demandé votre attention ici.`);
        return;
    }

    setNotificationState('sending');
    try {
        await app.sendNotification(otherUser.id, app.currentChatSession.id, app.currentChatSession.gameTitle);
        setNotificationState('already_notified');
        window.chatPageActions?.showFeedback(`Notification envoyée à ${otherUser.name}`);
    } catch (error) {
        console.error("Erreur d'envoi de la notification:", error);
        setNotificationState('idle');
    }
  };

  const renderLeftAction = () => {
    switch (currentPage) {
	  case 'memories':
        return (
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-lg ${isSearchOpen ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`} title={isSearchOpen ? "Fermer la recherche" : "Rechercher (/)"}>
            {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        );
      case 'chat': 
        return <button onClick={onCloseChatSession} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Retour"><ArrowLeft className="w-5 h-5" /></button>;
      case 'sessions': 
        return <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Nouvelle session"><Plus className="w-5 h-5" /></button>;
      case 'settings': 
        return <button onClick={() => app.updateCurrentPage('sessions')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Retour"><ArrowLeft className="w-5 h-5" /></button>;
      default: 
        return <div className="w-9 h-9" />;
    }
  };

  const renderContext = () => {
    switch (currentPage) {
      case 'memories': {
        const filterIcons = { all: '📋', unexplored: '✨', with_posts: '📄', with_photos: '📸' };
        
        // ✅ Compter les thèmes avec contenu
        const availableThemes = app.masterIndex?.themes || [];
        const themeCount = availableThemes.filter(theme => {
          const contents = window.themeAssignments?.getAllContentsByTheme(theme.id) || [];
          return contents.length > 0;
        }).length;

        return (
          <div className="flex items-center space-x-2">
            {/* ✅ NOUVEAU : Bouton toggle thèmes */}
            {themeCount > 0 && (
              <>
                <button 
                  onClick={() => setIsThemeBarVisible?.(!isThemeBarVisible)} 
                  className={`p-1.5 rounded transition-colors ${
                    isThemeBarVisible 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`} 
                  title={isThemeBarVisible ? "Masquer les thèmes" : "Afficher les thèmes"}
                >
                  <Tag className="w-4 h-4" />
                </button>
                <span className="text-gray-300 hidden sm:inline">|</span>
              </>
            )}

            <div className="flex items-center space-x-1">
              <button onClick={() => setDisplayOptions(prev => ({...prev, showPostText: !prev.showPostText}))} className={`p-1.5 rounded transition-colors ${displayOptions.showPostText ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showPostText ? 'Masquer' : 'Afficher'} texte articles`}><FileText className="w-4 h-4" /></button>
              <button onClick={() => setDisplayOptions(prev => ({...prev, showPostPhotos: !prev.showPostPhotos}))} className={`p-1.5 rounded transition-colors ${displayOptions.showPostPhotos ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showPostPhotos ? 'Masquer' : 'Afficher'} photos articles`}><ImageIcon className="w-4 h-4" /></button>
              <button onClick={() => setDisplayOptions(prev => ({...prev, showMomentPhotos: !prev.showMomentPhotos}))} className={`p-1.5 rounded transition-colors ${displayOptions.showMomentPhotos ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`} title={`${displayOptions.showMomentPhotos ? 'Masquer' : 'Afficher'} photos moments`}><Camera className="w-4 h-4" /></button>
            </div>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <div className="relative hidden md:block" ref={sortMenuRef}><button onClick={() => setShowSortMenu(!showSortMenu)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Trier les moments"><ArrowUpDown className="w-4 h-4" /></button>{showSortMenu && (<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48"><button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('chrono'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📅</span><span>Chronologique</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('recent'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>🕐</span><span>Plus récents</span></button>
<button onClick={() => { if (window.memoriesPageFilters?.setSortBy) { window.memoriesPageFilters.setSortBy('content'); } setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📸</span><span>Plus de contenu</span></button></div>)}</div>
            <div className="relative hidden md:block"><button onClick={() => setShowMomentFilterMenu(!showMomentFilterMenu)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Filtrer les moments"><span className="text-lg">{filterIcons[currentMomentFilter]}</span></button>{showMomentFilterMenu && (<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48"><button onClick={() => { if (window.memoriesPageFilters?.setMomentFilter) { window.memoriesPageFilters.setMomentFilter('all'); } setCurrentMomentFilter('all'); setShowMomentFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"><span>📋</span><span>Tous les moments</span></button>
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
                <button onClick={() => window.sessionPageFilters?.setGroupFilter(null)} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === null ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}><span>{totalActive}</span></button>
                <span className={`text-sm font-semibold ${activeFilter === null ? 'text-amber-600' : 'text-gray-600'}`}>Session{totalActive > 1 ? 's' : ''}</span>
                <span className="text-gray-300">·</span>
                {notifiedCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('notified')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'notified' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}><span>🔔</span><span>{notifiedCount}</span></button>)}
                {pendingYouCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('pending_you')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'pending_you' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}><span>🟡</span><span>{pendingYouCount}</span></button>)}
                {pendingOtherCount > 0 && (<button onClick={() => window.sessionPageFilters?.setGroupFilter('pending_other')} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === 'pending_other' ? 'bg-blue-500 text-white shadow-md' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}><span>🔵</span><span>{pendingOtherCount}</span></button>)}
            </div>
        );
      }
      case 'chat': {
        if (!app.currentChatSession) return null;
        if (editingTitle) {
          return (
            <div className="flex items-center space-x-2 w-full"><input ref={titleInputRef} type="text" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') handleCancelEditTitle(); }} className="flex-1 px-3 py-1 border-2 border-amber-300 rounded-lg font-semibold text-amber-600 text-sm" /><button onClick={handleSaveTitle} className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><Check className="w-5 h-5" /></button><button onClick={handleCancelEditTitle} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
          );
        } else {
          return (
            <div className="flex items-center justify-between w-full"><div onClick={handleStartEditTitle} className="group flex items-center min-w-0 pr-4 cursor-pointer" title="Modifier le titre"><h2 className="text-sm font-semibold text-amber-600 line-clamp-2">{app.currentChatSession.gameTitle}</h2><Edit className="w-4 h-4 ml-2 text-gray-500 opacity-0 group-hover:opacity-100" /></div></div>
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
    if (currentPage !== 'chat' || !app.currentChatSession) return null;
    const { notes, user, createdAt } = app.currentChatSession;
    const messageCount = notes?.length || 0;
    const createdByUser = userManager.getUser(user)?.name || 'N/A';
    const lastMessage = notes?.[messageCount - 1];
    const lastModifiedByUser = userManager.getUser(lastMessage?.author)?.name || createdByUser;

    return (
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-64 z-50">
        <div className="px-4 py-3 text-xs text-gray-500 space-y-1">
          <div><strong>{messageCount}</strong> message{messageCount > 1 ? 's' : ''}</div>
          <div>Créée par <strong>{createdByUser}</strong> le {formatDateTime(createdAt)}</div>
          {lastMessage && (<div>Dernier message par <strong>{lastModifiedByUser}</strong> le {formatDateTime(lastMessage.timestamp)}</div>)}
        </div>
        <div className="border-t border-gray-200 my-1"></div>
        <button onClick={handleDeleteCurrentSession} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"><Trash2 className="w-4 h-4" /><span>Supprimer la session</span></button>
      </div>
    );
  };

  const renderUserMenu = () => {
    const isOnline = app.connection?.isOnline;
    const allUsers = userManager.getAllUsers();
    const otherUsers = allUsers.filter(u => u.id !== app.currentUser?.id);

    return (
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-64">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2"><span className="text-2xl">{app.currentUser?.emoji || '👤'}</span><div className="flex-1"><div className="text-sm font-medium text-gray-900">{app.currentUser?.name}</div><div className="text-xs text-gray-500 flex items-center space-x-1">{isOnline ? (<><Cloud className="w-3 h-3 text-green-500" /><span>Connecté</span></>) : (<><CloudOff className="w-3 h-3 text-red-500" /><span>Déconnecté</span></>)}</div></div></div>
        </div>
        <div className="px-4 py-2 border-b border-gray-200"><div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Changer d'utilisateur</div>{otherUsers.map(user => { const style = userManager.getUserStyle(user.id); return (<button key={user.id} onClick={() => { setShowUserMenu(false); app.setCurrentUser(user.id); }} className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg mb-1 transition-all hover:bg-gray-100"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${style.bg}`}>{user.emoji}</div><span className="text-sm font-medium text-gray-900">{user.name}</span></button>)})}</div>
        {!isOnline && (<button onClick={() => { setShowUserMenu(false); app.connect(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 flex items-center space-x-2"><Cloud className="w-4 h-4" /><span>Se reconnecter</span></button>)}
      </div>
    );
  };

  const currentUserObj = app.currentUser;
  const userStyle = userManager.getUserStyle(currentUserObj?.id);
  const isOnline = app.connection?.isOnline;

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
      <div className="flex items-center">{renderLeftAction()}</div>
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">{renderContext()}</div>
      <div className="flex items-center justify-end">
        {currentPage === 'chat' && !editingTitle && (
          <div className="flex items-center space-x-2 mr-2">
            <button onClick={handleSendNotification} disabled={notificationState === 'sending' || notificationState === 'locked'} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${notificationState === 'already_notified' ? 'bg-orange-500 hover:bg-orange-600' : notificationState === 'locked' ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`} title={(() => { const otherUser = userManager.getAllUsers().find(u => u.id !== 'duo' && u.id !== app.currentUser.id); const otherUserName = otherUser?.name || '...'; if (notificationState === 'already_notified') return `Annuler la notification pour ${otherUserName}`; if (notificationState === 'locked') return `Déjà notifié par ${otherUserName}`; return `Notifier ${otherUserName}`; })()}><Bell className={`w-5 h-5 ${notificationState === 'already_notified' ? 'text-white' : 'text-gray-600'}`} /></button>
            <div className="relative" ref={menuRef}><button onClick={() => setShowMenu(!showMenu)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><MoreVertical className="w-5 h-5" /></button>{showMenu && renderMenu()}</div>
          </div>
        )}
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center p-1 hover:bg-gray-100 rounded-lg">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl relative ${userStyle.bg}`}>{currentUserObj?.emoji || '👤'}{!isOnline && (<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>)}</div>
          </button>
          {showUserMenu && renderUserMenu()}
        </div>
      </div>
    </div>
  );
}