/**
 * UnifiedTopBar.jsx v1.6 - Phase 14.3
 * ✅ MemoriesPage : Dropdown filtre + options inline
 * ✅ SessionsPage : Badge ✨ redirige vers Memories
 * ✅ Icônes explicites + couleurs discrètes
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, Map, Search, Dices, 
  MoreVertical, Type, Image as ImageIcon, Camera,
  CloudOff, Cloud, Edit, Trash2, MessageCircle,
  LogIn, LogOut
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
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
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

  const renderLeftAction = () => {
    switch (currentPage) {
      case 'memories':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTimelineVisible(!isTimelineVisible)}
              className={`p-2 rounded-lg transition-colors ${
                isTimelineVisible 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Timeline"
            >
              <Map className="w-5 h-5" />
            </button>
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

  const renderContext = () => {
    switch (currentPage) {
      case 'memories':
        return (
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Dropdown Filtre */}
            <select
              onChange={(e) => {
                if (window.memoriesPageFilters?.setMomentFilter) {
                  window.memoriesPageFilters.setMomentFilter(e.target.value);
                }
              }}
              className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="all">Tous</option>
              <option value="unexplored">✨ Non explorés</option>
              <option value="with_posts">📝 Avec articles</option>
              <option value="with_photos">📸 Avec photos</option>
            </select>
            
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            
            {/* Options affichage - visibles inline desktop */}
            <div className="hidden sm:flex items-center space-x-1">
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
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Random + Jour */}
            <button 
              onClick={jumpToRandomMoment}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
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
              className="w-14 sm:w-16 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm text-center focus:ring-2 focus:ring-blue-500"
              placeholder="J..."
              min="0"
              max="200"
            />
          </div>
        );
      
      case 'chat':
        return chatSession ? (
          <h1 className="text-sm font-semibold text-amber-600 truncate max-w-xs">
            {chatSession.gameTitle}
          </h1>
        ) : null;
      
      case 'sessions':
        const enrichedSessions = app.sessions?.map(s => {
          const lastMsg = s.notes?.[s.notes.length - 1];
          const isPendingYou = lastMsg && lastMsg.author !== app.currentUser;
          const daysSince = lastMsg ? (Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24) : 0;
          const isUrgent = isPendingYou && daysSince > 7;
          const isPendingOther = lastMsg && lastMsg.author === app.currentUser;
          
          return { 
            ...s, 
            isPendingYou, 
            isUrgent,
            isPendingOther: isPendingOther && !isPendingYou
          };
        }) || [];
        
        const urgentCount = enrichedSessions.filter(s => s.isUrgent).length;
        const pendingYouCount = enrichedSessions.filter(s => s.isPendingYou && !s.isUrgent).length;
        const pendingOtherCount = enrichedSessions.filter(s => s.isPendingOther).length;
        const unexploredMoments = (app.masterIndex?.moments?.length || 0) - new Set(app.sessions?.map(s => s.gameId)).size;
        
        const activeFilter = window.sessionPageState?.activeFilter || null;
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-amber-600">
              Sessions
            </span>
            
            {urgentCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.sessionPageFilters?.setGroupFilter) {
                    window.sessionPageFilters.setGroupFilter('urgent');
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'urgent'
                    ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title="Sessions urgentes (>7 jours)"
              >
                <span>🔴</span>
                <span>{urgentCount}</span>
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
            
            {unexploredMoments > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPageChange('memories');
                  setTimeout(() => {
                    window.memoriesPageFilters?.setMomentFilter?.('unexplored');
                  }, 100);
                }}
                className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold transition-colors"
                title="Moments non explorés - Voir dans Mémoires"
              >
                <span>✨</span>
                <span>{unexploredMoments}</span>
              </button>
            )}
            
            <select
              onChange={(e) => {
                if (window.sessionPageFilters?.setSortBy) {
                  window.sessionPageFilters.setSortBy(e.target.value);
                }
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="urgency">Tri: Urgence</option>
              <option value="date">Tri: Date</option>
              <option value="chrono">Tri: Voyage</option>
              <option value="activity">Tri: Activité</option>
            </select>
          </div>
        );
      
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

  const renderMenu = () => {
    switch (currentPage) {
      case 'memories':
        // Options maintenant inline - pas de menu
        return null;
      
      case 'chat':
        return (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
            <button
              onClick={() => {
                setShowMenu(false);
                onEditChatTitle();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier le titre</span>
            </button>
            
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
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <button
              disabled
              className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center space-x-2"
              title="Fonctionnalité à venir"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Fusionner les chats</span>
            </button>
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <div className="px-4 py-2 text-xs text-gray-500">
              {chatSession?.notes?.length || 0} messages
            </div>
            <div className="px-4 py-2 text-xs text-gray-500">
              {chatSession?.createdAt && new Date(chatSession.createdAt).toLocaleDateString()}
            </div>
          </div>
        );
      
      case 'sessions':
        return (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
            <button
              onClick={() => {
                setShowMenu(false);
                if (window.sessionPageActions?.openStatsModal) {
                  window.sessionPageActions.openStatsModal();
                }
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Voir les statistiques</span>
            </button>
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <div className="px-4 py-2 text-xs text-gray-500">
              {app.sessions?.length || 0} session{app.sessions?.length > 1 ? 's' : ''} au total
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
            <button 
              onClick={async () => {
                setShowMenu(false);
                await app.dataManager?.reloadMasterIndex();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Régénérer l'index
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderUserMenu = () => {
    const currentUserObj = app.currentUser;
    const isOnline = app.connection?.isOnline;
    
    return (
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
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
        <button
          onClick={() => {
            setShowUserMenu(false);
            onPageChange('settings');
          }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
        >
          Changer d'utilisateur
        </button>
        {!isOnline && (
          <button
            onClick={() => {
              setShowUserMenu(false);
              app.connect();
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600 flex items-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Se reconnecter</span>
          </button>
        )}
      </div>
    );
  };

  const currentUserObj = app.currentUser;
  const isOnline = app.connection?.isOnline;

  return (
    <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {renderLeftAction()}
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {renderContext()}
      </div>

      <div className="flex items-center space-x-2">
        {currentPage !== 'memories' && (
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

        <div className="relative hidden sm:block" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xl relative">
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