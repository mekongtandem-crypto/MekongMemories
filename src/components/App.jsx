/**
 * App.jsx v2.6 - Phase 18b Étape 2 : Mode sélection
 * ✅ État selectionMode pour workflow liens
 * ✅ Handlers startSelection / cancelSelection / onContentSelected
 */
import React, { useState, useRef } from 'react';
import { useAppState } from '../hooks/useAppState.js';
import UnifiedTopBar from './UnifiedTopBar.jsx';
import { BottomNavigation } from './Navigation.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MemoriesPage from './pages/MemoriesPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import UserSelectionPage from './pages/UserSelectionPage.jsx';
import SessionCreationSpinner from './SessionCreationSpinner.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("--- ERREUR DE RENDU ATTRAPÉE PAR L'ERROR BOUNDARY ---", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700">
          <h1 className="font-bold text-lg">Oups ! L'application a rencontré une erreur.</h1>
          <pre className="mt-2 p-2 bg-white text-sm whitespace-pre-wrap">
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const app = useAppState();
  
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [displayOptions, setDisplayOptions] = useState({
    showPostText: true,
    showPostPhotos: true,
    showMomentPhotos: true
  });
  
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [isThemeBarVisible, setIsThemeBarVisible] = useState(false);
  
  const [navigationContext, setNavigationContext] = useState({
  previousPage: null,
  pendingAttachment: null,
  sessionMomentId: null,
  pendingLink: null  
});

  // ⭐ NOUVEAU Phase 18b : Mode sélection pour liens
  const [selectionMode, setSelectionMode] = useState({
  active: false,  // â†' DÃ©sactivÃ© par dÃ©faut
  type: null,
  callback: null
});

  const memoriesPageRef = useRef(null);

  if (!app.isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-black text-center p-4">
        <div className="text-6xl mb-4 animate-bounce">
          🐘
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Mémoire du Mékong
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Chargement de vos souvenirs...
        </p>
        <div className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500">
          Version 2.6 - Phase 18b Étape 2
        </div>
      </div>
    );
  }

  if (!app.currentUser) {
    return (
      <ErrorBoundary>
        <UserSelectionPage />
      </ErrorBoundary>
    );
  }

  const handleJumpToRandomMoment = () => {
    if (memoriesPageRef.current?.jumpToRandomMoment) {
      memoriesPageRef.current.jumpToRandomMoment();
    }
  };

  const handleJumpToDay = (day) => {
    if (memoriesPageRef.current?.jumpToDay) {
      memoriesPageRef.current.jumpToDay(day);
    }
  };

  const handleNavigateWithContext = (targetPage, context = {}) => {
    console.log('🧭 Navigation avec contexte:', targetPage, context);
    
    setNavigationContext({
      previousPage: app.currentPage,
      pendingAttachment: context.attachment || null,
      sessionMomentId: context.sessionMomentId || null
    });
    
    app.updateCurrentPage(targetPage);
  };

  const handlePageChange = (newPage) => {
  console.log('🔄 Changement page:', app.currentPage, '→', newPage);
  
  if (newPage === 'memories' && app.currentPage === 'chat' && app.currentChatSession?.gameId) {
    console.log('🎯 Navigation Chat → Memories détectée, momentId:', app.currentChatSession.gameId);
    
    setNavigationContext({
      previousPage: 'chat',
      pendingAttachment: null,
      sessionMomentId: app.currentChatSession.gameId,
      pendingLink: null  // ⭐ AJOUTER
    });
  } else {
    setNavigationContext({
      previousPage: null,
      pendingAttachment: null,
      sessionMomentId: null,
      pendingLink: null  // ⭐ AJOUTER
    });
  }
  
  app.updateCurrentPage(newPage);
};

  const handleNavigateBack = () => {
  const previousPage = navigationContext.previousPage || 'sessions';
  console.log('← Retour vers:', previousPage);
  
  setNavigationContext({
    previousPage: null,
    pendingAttachment: null,
    sessionMomentId: null,
    pendingLink: null  // ⭐ AJOUTER
  });
  
  app.updateCurrentPage(previousPage);
};

  const handleAttachToChat = (attachment) => {
    console.log('📎 Attachement vers chat:', attachment);
    
    setNavigationContext(prev => ({
      ...prev,
      pendingAttachment: attachment,
      sessionMomentId: null
    }));
    
    app.updateCurrentPage('chat');
  };

  const handleClearAttachment = () => {
    console.log('🧹 Clear attachment');
    setNavigationContext(prev => ({
      ...prev,
      pendingAttachment: null
    }));
  };

  // ⭐ NOUVEAU : Handlers mode sélection
  const handleStartSelectionMode = (type, callback) => {
  console.log('🔗 Démarrage mode sélection:', type);
  
  setSelectionMode({
    active: true,
    type: type,
    callback: callback  // ⭐ On garde le callback pour compatibilité
  });
  
  setNavigationContext({
    previousPage: app.currentPage,
    pendingAttachment: null,
    sessionMomentId: null,
    pendingLink: null  // ⭐ AJOUTER
  });
  
  app.updateCurrentPage('memories');
};

  const handleCancelSelectionMode = () => {
    console.log('✖️ Annulation mode sélection');
    
    const previousPage = navigationContext.previousPage || 'chat';
    
    setSelectionMode({
      active: false,
      type: null,
      callback: null
    });
    
    // Retour page précédente
    setNavigationContext({
      previousPage: null,
      pendingAttachment: null,
      sessionMomentId: null
    });
    
    app.updateCurrentPage(previousPage);
  };

  const handleContentSelected = (contentData) => {
  console.log('✅ Contenu sélectionné:', contentData);
  
  // ⭐ MODIFIÉ : Passer via navigationContext au lieu du callback direct
  const previousPage = navigationContext.previousPage || 'chat';
  
  setSelectionMode({
    active: false,
    type: null,
    callback: null
  });
  
  // ⭐ Transmettre le contenu via navigationContext
  setNavigationContext({
    previousPage: null,
    pendingAttachment: null,
    sessionMomentId: null,
    pendingLink: contentData  // ⭐ NOUVEAU
  });
  
  app.updateCurrentPage(previousPage);
};

  const renderPage = () => {
    switch (app.currentPage) {
      case 'memories':
        return (
          <MemoriesPage
            ref={memoriesPageRef}
            isTimelineVisible={isTimelineVisible}
            setIsTimelineVisible={setIsTimelineVisible}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            displayOptions={displayOptions}
            isThemeBarVisible={isThemeBarVisible}
            navigationContext={navigationContext}
            onNavigateBack={handleNavigateBack}
            onAttachToChat={handleAttachToChat}
            selectionMode={selectionMode}
            onContentSelected={handleContentSelected}
          />
        );
      
      case 'sessions':
        return <SessionsPage />;
      
      case 'chat':
        return (
          <ChatPage 
            navigationContext={navigationContext}
            onClearAttachment={handleClearAttachment}
            onStartSelectionMode={handleStartSelectionMode}
          />
        );
      
      case 'settings':
        return <SettingsPage />;
      
      default:
        return <div>Page inconnue</div>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* TopBar fixe */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <UnifiedTopBar
            currentPage={app.currentPage}
            onCloseChatSession={app.closeChatSession}
            isTimelineVisible={isTimelineVisible}
            setIsTimelineVisible={setIsTimelineVisible}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            displayOptions={displayOptions}
            setDisplayOptions={setDisplayOptions}
            jumpToRandomMoment={handleJumpToRandomMoment}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            jumpToDay={handleJumpToDay}
            isThemeBarVisible={isThemeBarVisible}
            setIsThemeBarVisible={setIsThemeBarVisible}
            navigationContext={navigationContext}
            onNavigateWithContext={handleNavigateWithContext}
            onNavigateBack={handleNavigateBack}
            selectionMode={selectionMode}
            onCancelSelectionMode={handleCancelSelectionMode}
          />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 pt-12 pb-16 overflow-auto">
          {renderPage()}
        </main>

        {/* BottomNavigation fixe */}
        {app.isInitialized && (
          <BottomNavigation 
            currentPage={app.currentPage}
            onPageChange={handlePageChange}
            app={app}
            navigationContext={navigationContext}
          />
        )}
        
        {/* Spinner création session */}
        {app.isCreatingSession && <SessionCreationSpinner />}
      </div>
    </ErrorBoundary>
  );
}