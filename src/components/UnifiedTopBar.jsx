/**
 * UnifiedTopBar.jsx v1.1 - Corrections UI
 * ✅ Icônes Activé/Désactivé au lieu de points
 * ✅ Avatar utilisateur dynamique
 * ✅ Contexte "Mémoire" en amber-600
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Settings, Plus, Map, Search, Dices, 
  MoreVertical, Type, Image as ImageIcon, Camera,
  CloudOff, Cloud, Edit, Trash2, MessageCircle
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
              title="Timeline (T)"
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
              title="Recherche (/)"
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
            onClick={() => {/* TODO */}}
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
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-amber-600 hidden sm:inline">
              Mémoire
            </span>
            <button 
              onClick={jumpToRandomMoment}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Moment au hasard"
            >
              <Dices className="w-4 h-4" />
            </button>
            <div className="relative">
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
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="J..."
                min="0"
                max="200"
              />
            </div>
          </div>
        );
      
      case 'chat':
        return chatSession ? (
          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-xs">
            {chatSession.gameTitle}
          </h1>
        ) : null;
      
      case 'sessions':
        const pendingCount = app.sessions?.filter(s => 
          s.user === app.currentUser && 
          s.notes?.length > 0 && 
          s.notes[s.notes.length - 1].author !== app.currentUser
        ).length || 0;
        
        return (
          <div className="text-sm text-gray-700">
            <span className="font-medium">{app.sessions?.length || 0}</span> session{app.sessions?.length > 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600">
                · <span className="font-medium">{pendingCount}</span> nouvelle{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <span className="text-sm font-medium text-gray-900">
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
        return (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-56">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Options d'affichage
            </div>
            <button
              onClick={() => setDisplayOptions(prev => ({...prev, showPostText: !prev.showPostText}))}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span>Texte des articles</span>
              </span>
              <span className="text-xs font-medium">
                {displayOptions.showPostText ? (
                  <span className="text-green-600">✓ Activé</span>
                ) : (
                  <span className="text-gray-400">Désactivé</span>
                )}
              </span>
            </button>
            <button
              onClick={() => setDisplayOptions(prev => ({...prev, showPostPhotos: !prev.showPostPhotos}))}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>Photos des articles</span>
              </span>
              <span className="text-xs font-medium">
                {displayOptions.showPostPhotos ? (
                  <span className="text-green-600">✓ Activé</span>
                ) : (
                  <span className="text-gray-400">Désactivé</span>
                )}
              </span>
            </button>
            <button
              onClick={() => setDisplayOptions(prev => ({...prev, showMomentPhotos: !prev.showMomentPhotos}))}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
            >
              <span className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Photos des moments</span>
              </span>
              <span className="text-xs font-medium">
                {displayOptions.showMomentPhotos ? (
                  <span className="text-green-600">✓ Activé</span>
                ) : (
                  <span className="text-gray-400">Désactivé</span>
                )}
              </span>
            </button>
          </div>
        );
      
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
            // Retour automatique à la page sessions après suppression
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
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 w-48">
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
              Trier par date
            </button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
              Filtrer
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
              Exporter
            </button>
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
    const currentUserObj = userManager.getUser(app.currentUser);
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
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
          >
            Se reconnecter
          </button>
        )}
      </div>
    );
  };

// APRÈS (CORRECT)
const currentUserObj = userManager.getUser(app.currentUser?.id) || app.currentUser;
  console.log('👤 Current user:', app.currentUser, 'Obj:', currentUserObj);
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
            {/* Menu contextuel */}
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

      {/* Avatar utilisateur */}
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