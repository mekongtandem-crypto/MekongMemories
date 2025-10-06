/**
 * UnifiedTopBar.jsx v1.8 - Phase 15 finale
 * ✅ Avatar toujours visible (desktop + mobile)
 * ✅ Menu tri Memories en bouton dédié
 * ✅ Suppression menu tri Sessions
 * ✅ Suppression "Régénérer" Settings
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, Map, Search, Dices, 
  MoreVertical, Type, Image as ImageIcon, Camera,
  CloudOff, Cloud, Edit, Trash2, ArrowUpDown
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { userManager } from '../core/UserManager.js';

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
  onEditChatTitle,
  onCloseChatSession
}) {
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
const [showSortMenu, setShowSortMenu] = useState(false);
const [showMomentFilterMenu, setShowMomentFilterMenu] = useState(false); // ✅ NOUVEAU
const [currentMomentFilter, setCurrentMomentFilter] = useState('all');     // ✅ NOUVEAU  
  const menuRef = useRef(null);
const userMenuRef = useRef(null);
const sortMenuRef = useRef(null);
const momentFilterMenuRef = useRef(null); // ✅ NOUVEAU

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
    if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
      setShowUserMenu(false);
    }
    if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
      setShowSortMenu(false);
    }
    // ✅ NOUVEAU
    if (momentFilterMenuRef.current && !momentFilterMenuRef.current.contains(e.target)) {
      setShowMomentFilterMenu(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const handleDayWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    navigateDay(delta);
  };

  const handleCreateTestSession = async () => {
    try {
      const sessionData = {
        id: `test_${Date.now()}`,
        title: `Session de test`,
        description: 'Session créée manuellement',
        systemMessage: '💬 Session de test créée.'
      };
      
      const newSession = await app.createSession(sessionData, 'Message de test initial', null);
      if (newSession) {
        await app.openChatSession(newSession);
      }
    } catch (error) {
      console.error('Erreur création session test:', error);
      alert('Impossible de créer la session');
    }
  };

  // ========================================
  // RENDER LEFT ACTION
  // ========================================

  const renderLeftAction = () => {
    switch (currentPage) {
      case 'memories':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isSearchOpen 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Recherche"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        );
      
      case 'chat':
        return (
          <button
            onClick={onCloseChatSession}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Retour aux sessions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        );
      
      case 'sessions':
        return (
          <button
            onClick={handleCreateTestSession}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Nouvelle session"
          >
            <Plus className="w-5 h-5" />
          </button>
        );
      
      case 'settings':
        return (
          <div className="p-2">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
        );
      
      default:
        return null;
    }
  };

  // ========================================
  // RENDER CONTEXT (Centre)
  // ========================================

  const renderContext = () => {
    switch (currentPage) {
      case 'memories': {
  // ✅ État du filtre moment actif
  const filterIcons = {
    all: '📋',
    unexplored: '✨',
    with_posts: '📄',
    with_photos: '📸'
  };
  
  return (
    <div className="flex items-center space-x-2">
      
      {/* ========================================
          PRIORITÉ 1 : Filtres contenu (TOUJOURS visibles)
          ======================================== */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setDisplayOptions(prev => ({...prev, showPostText: !prev.showPostText}))}
          className={`p-1.5 rounded transition-colors ${
            displayOptions.showPostText 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={`${displayOptions.showPostText ? 'Masquer' : 'Afficher'} texte articles`}
        >
          <Type className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setDisplayOptions(prev => ({...prev, showPostPhotos: !prev.showPostPhotos}))}
          className={`p-1.5 rounded transition-colors ${
            displayOptions.showPostPhotos 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={`${displayOptions.showPostPhotos ? 'Masquer' : 'Afficher'} photos articles`}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setDisplayOptions(prev => ({...prev, showMomentPhotos: !prev.showMomentPhotos}))}
          className={`p-1.5 rounded transition-colors ${
            displayOptions.showMomentPhotos 
              ? 'bg-green-100 text-green-700' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={`${displayOptions.showMomentPhotos ? 'Masquer' : 'Afficher'} photos moments`}
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
      
      {/* Séparateur visuel */}
      <span className="text-gray-300 hidden sm:inline">|</span>
      
      {/* ========================================
          PRIORITÉ 2 : Tri moments (visible desktop)
          ======================================== */}
      <div className="relative hidden md:block" ref={sortMenuRef}>
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Trier les moments"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>
        
        {showSortMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setSortBy) {
                  window.memoriesPageFilters.setSortBy('chrono');
                }
                setShowSortMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📅</span>
              <span>Chronologique</span>
            </button>
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setSortBy) {
                  window.memoriesPageFilters.setSortBy('recent');
                }
                setShowSortMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>🕐</span>
              <span>Plus récents</span>
            </button>
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setSortBy) {
                  window.memoriesPageFilters.setSortBy('content');
                }
                setShowSortMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📸</span>
              <span>Plus de contenu</span>
            </button>
          </div>
        )}
      </div>
      
      {/* ========================================
          PRIORITÉ 3 : Filtre moment (icône dynamique)
          ======================================== */}
      <div className="relative hidden md:block">
        <button
          onClick={() => setShowMomentFilterMenu(!showMomentFilterMenu)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Filtrer les moments"
        >
          <span className="text-lg">{filterIcons[currentMomentFilter]}</span>
        </button>
        
        {showMomentFilterMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setMomentFilter) {
                  window.memoriesPageFilters.setMomentFilter('all');
                }
                setCurrentMomentFilter('all');
                setShowMomentFilterMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Tous les moments</span>
            </button>
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setMomentFilter) {
                  window.memoriesPageFilters.setMomentFilter('unexplored');
                }
                setCurrentMomentFilter('unexplored');
                setShowMomentFilterMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Non explorés</span>
            </button>
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setMomentFilter) {
                  window.memoriesPageFilters.setMomentFilter('with_posts');
                }
                setCurrentMomentFilter('with_posts');
                setShowMomentFilterMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Avec articles</span>
            </button>
            <button
              onClick={() => {
                if (window.memoriesPageFilters?.setMomentFilter) {
                  window.memoriesPageFilters.setMomentFilter('with_photos');
                }
                setCurrentMomentFilter('with_photos');
                setShowMomentFilterMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📸</span>
              <span>Avec photos</span>
            </button>
          </div>
        )}
      </div>
      
      {/* ========================================
          OVERFLOW MOBILE : Actions secondaires
          ======================================== */}
      <div className="flex items-center space-x-2 md:hidden">
        
        
        <button 
          onClick={jumpToRandomMoment}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Moment au hasard"
        >
          <Dices className="w-4 h-4" />
        </button>
        
        <input 
          type="number" 
          value={currentDay} 
          onChange={(e) => {
            const day = parseInt(e.target.value, 10);
            if (!isNaN(day)) setCurrentDay(day);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') jumpToDay(currentDay);
          }}
          className="w-14 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-blue-500"
          placeholder="J..."
          min="0"
          max="200"
        />
      </div>
      
      {/* Desktop : Navigation jour */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={`p-1.5 rounded-lg transition-colors ${
            isSearchOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Recherche"
        >
          <Search className="w-4 h-4" />
        </button>
        
        <button 
          onClick={jumpToRandomMoment}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Moment au hasard"
        >
          <Dices className="w-4 h-4" />
        </button>
        
        <input 
          type="number" 
          value={currentDay} 
          onChange={(e) => {
            const day = parseInt(e.target.value, 10);
            if (!isNaN(day)) setCurrentDay(day);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') jumpToDay(currentDay);
          }}
          onWheel={handleDayWheel}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500"
          placeholder="J..."
          min="0"
          max="200"
        />
      </div>
      
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
          
          const hasNotif = window.notificationManager?.hasUnreadNotificationForSession(
            s.id, 
            currentUserId
          );
          
          return { 
            ...s, 
            hasNotif,
            isPendingYou: isPendingYou && !hasNotif,
            isPendingOther
          };
        });
        
        const totalActive = activeSessions.length;
        const notifiedCount = enrichedSessions.filter(s => s.hasNotif).length;
        const pendingYouCount = enrichedSessions.filter(s => s.isPendingYou).length;
        const pendingOtherCount = enrichedSessions.filter(s => s.isPendingOther).length;
        
        const activeFilter = window.sessionPageState?.activeFilter || null;
        
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.sessionPageFilters?.setGroupFilter) {
                  window.sessionPageFilters.setGroupFilter(null);
                }
              }}
              className={`text-sm font-semibold transition-colors ${
                activeFilter === null
                  ? 'text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              {totalActive} Session{totalActive > 1 ? 's' : ''}
            </button>
            
            <span className="text-gray-300">·</span>
            
            {notifiedCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.sessionPageFilters?.setGroupFilter) {
                    window.sessionPageFilters.setGroupFilter('notified');
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'notified'
                    ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title="Sessions avec notifications non répondues"
              >
                <span>🔔</span>
                <span>{notifiedCount}</span>
              </button>
            )}
            
            {pendingYouCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.sessionPageFilters?.setGroupFilter) {
                    window.sessionPageFilters.setGroupFilter('pending_you');
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'pending_you'
                    ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                }`}
                title="Sessions en attente de votre réponse"
              >
                <span>🟡</span>
                <span>{pendingYouCount}</span>
              </button>
            )}
            
            {pendingOtherCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.sessionPageFilters?.setGroupFilter) {
                    window.sessionPageFilters.setGroupFilter('pending_other');
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'pending_other'
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title="Sessions en attente d'autres utilisateurs"
              >
                <span>🔵</span>
                <span>{pendingOtherCount}</span>
              </button>
            )}
          </div>
        );
      }
      
      case 'settings':
        return (
          <span className="text-sm font-semibold text-amber-600">
            Réglages
          </span>
        );
      
      default:
        return null;
    }
  };

  // ========================================
  // RENDER MENU (...)
  // ========================================

  const renderMenu = () => {
    switch (currentPage) {
      case 'chat':
  if (!chatSession) return null;
  
  // ✅ Infos session
  const messageCount = chatSession.notes?.length || 0;
  const createdAt = chatSession.createdAt ? new Date(chatSession.createdAt) : null;
  const creatorId = chatSession.user;
  const creatorInfo = userManager.getUser(creatorId);
  
  const lastMessage = chatSession.notes?.[chatSession.notes.length - 1];
  const lastModifiedAt = lastMessage?.timestamp ? new Date(lastMessage.timestamp) : createdAt;
  const lastAuthorId = lastMessage?.author || creatorId;
  const lastAuthorInfo = userManager.getUser(lastAuthorId);
  
  return (
    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-64">
      
      {/* ✅ Infos session */}
      <div className="px-4 py-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span className="font-semibold">{messageCount}</span>
          <span>message{messageCount > 1 ? 's' : ''}</span>
        </div>
        
        {createdAt && (
          <div className="text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <span>📅 Créée le</span>
              <span className="font-medium">{createdAt.toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span>par</span>
              <span>{creatorInfo?.emoji}</span>
              <span className="font-medium">{creatorInfo?.name || 'Inconnu'}</span>
            </div>
          </div>
        )}
        
        {lastModifiedAt && lastModifiedAt !== createdAt && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <span>✏️ Modifiée le</span>
              <span className="font-medium">{lastModifiedAt.toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span>par</span>
              <span>{lastAuthorInfo?.emoji}</span>
              <span className="font-medium">{lastAuthorInfo?.name || 'Inconnu'}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <button
        onClick={async () => {
          setShowMenu(false);
          if (chatSession && confirm(`Supprimer la session "${chatSession.gameTitle}" ?`)) {
            await app.deleteSession(chatSession.id);
            app.closeChatSession();
          }
        }}
        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
      >
        <Trash2 className="w-4 h-4" />
        <span>Supprimer la session</span>
      </button>
      
    </div>
  );
      
      // ✅ Sessions, Memories, Settings : Plus de menu
      default:
        return null;
    }
  };

  // ========================================
  // RENDER USER MENU
  // ========================================

  const renderUserMenu = () => {
    const currentUserObj = app.currentUser;
    const isOnline = app.connection?.isOnline;
    
    const allUsers = [
      { id: 'lambert', name: 'Lambert', emoji: userManager.getUser('lambert')?.emoji || '🚴', color: 'green' },
      { id: 'tom', name: 'Tom', emoji: userManager.getUser('tom')?.emoji || '👨‍💻', color: 'blue' },
      { id: 'duo', name: 'Duo', emoji: userManager.getUser('duo')?.emoji || '👥', color: 'amber' }
    ];
    
    const otherUsers = allUsers.filter(u => u.id !== currentUserObj?.id);
    
    return (
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-64">
        
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{currentUserObj?.emoji || '👤'}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {currentUserObj?.name || 'Utilisateur'}
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                {isOnline ? (
                  <>
                    <Cloud className="w-3 h-3 text-green-500" />
                    <span>Connecté</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 text-red-500" />
                    <span>Déconnecté</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Changer d'utilisateur
          </div>
          
          {otherUsers.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setShowUserMenu(false);
                app.setCurrentUser(user.id);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg mb-1 transition-all ${
                user.color === 'green' ? 'hover:bg-green-50' :
                user.color === 'blue' ? 'hover:bg-blue-50' :
                'hover:bg-amber-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                user.color === 'green' ? 'bg-green-100' :
                user.color === 'blue' ? 'bg-blue-100' :
                'bg-amber-100'
              }`}>
                {user.emoji}
              </div>
              <span className="text-sm font-medium text-gray-900">{user.name}</span>
            </button>
          ))}
        </div>
        
        {!isOnline && (
          <button
            onClick={() => {
              setShowUserMenu(false);
              app.connect();
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 flex items-center space-x-2"
          >
            <Cloud className="w-4 h-4" />
            <span>Se reconnecter</span>
          </button>
        )}
        
      </div>
    );
  };

  // ========================================
  // RENDER PRINCIPAL
  // ========================================

  const currentUserObj = app.currentUser;
  const isOnline = app.connection?.isOnline;

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
      
      {/* Section gauche */}
      <div className="flex items-center space-x-2">
        {renderLeftAction()}
      </div>

      {/* Section centre */}
      <div className="flex-1 flex items-center justify-center px-4">
        {renderContext()}
      </div>

      {/* Section droite */}
      <div className="flex items-center space-x-2">
        
        {/* Menu ... (seulement Chat maintenant) */}
        {currentPage === 'chat' && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && renderMenu()}
          </div>
        )}
        
        {/* ✅ Avatar TOUJOURS visible (plus de hidden sm:block) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl relative ${
              currentUserObj?.id === 'lambert' ? 'bg-green-100' :
              currentUserObj?.id === 'tom' ? 'bg-blue-100' :
              'bg-amber-100'
            }`}>
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