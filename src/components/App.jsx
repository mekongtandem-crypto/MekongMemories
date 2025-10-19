/**
 * App.jsx v2.3 - Phase 17a : Navigation contextuelle
 * ✅ State navigationContext pour Chat ↔️ Memories
 * ✅ Fonction navigateWithContext()
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
  
  // États existants
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
  
  // ✅ NOUVEAU Phase 17a : Context navigation
  const [navigationContext, setNavigationContext] = useState({
    previousPage: null,        // Page d'où on vient
    previousChatId: null,      // ID du chat pour y retourner
    pendingAttachment: null    // Photo/post/moment à attacher (Phase 17b)
  });

  const memoriesPageRef = useRef(null);
  
  // ✅ NOUVEAU : Fonction navigation avec contexte
  const navigateWithContext = (targetPage, context = {}) => {
    setNavigationContext({
      previousPage: app.currentPage,
      previousChatId: app.currentChatSession?.id,
      ...context
    });
    app.updateCurrentPage(targetPage);
  };
  
  // ✅ NOUVEAU : Fonction retour intelligent
  const navigateBack = () => {
    const target = navigationContext.previousPage || 'sessions';
    
    // Retour au chat si besoin
    if (target === 'chat' && navigationContext.previousChatId) {
      const session = app.sessions?.find(s => s.id === navigationContext.previousChatId);
      if (session) {
        app.openChatSession(session);
      }
    } else {
      app.updateCurrentPage(target);
    }
    
    // Clear context
    setNavigationContext({
      previousPage: null,
      previousChatId: null,
      pendingAttachment: navigationContext.pendingAttachment // Conserver pour Phase 17b
    });
  };

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
          Version 2.5 - Phase 17b chat with attached photos
        </div>
      </div>
    );
  }

  if (!app.currentUser) {
    return <UserSelectionPage />;
  }

  const renderPage = () => {
    switch (app.currentPage) {
      case 'settings':
        return <SettingsPage />;
      
      case 'sessions':
        return <SessionsPage />;
      
      case 'chat':
        return (
          <ChatPage 
            editingTitle={editingChatTitle}
            setEditingTitle={setEditingChatTitle}
            navigationContext={navigationContext}
            onClearAttachment={() => setNavigationContext(prev => ({ ...prev, pendingAttachment: null }))}
          />
        );
      
      case 'memories':
      default:
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
            onNavigateBack={navigateBack}
            onAttachToChat={(item) => {
              console.log('📎 App.jsx - onAttachToChat called with:', item);
              
              // 1. Set attachment AVANT de naviguer
              setNavigationContext(prev => {
                const newContext = {
                  ...prev,
                  pendingAttachment: item
                };
                console.log('✅ App.jsx - navigationContext updated:', newContext);
                return newContext;
              });
              
              // 2. Navigate back SANS effacer pendingAttachment
              const targetPage = navigationContext.previousPage || 'sessions';
              
              if (targetPage === 'chat' && navigationContext.previousChatId) {
                const session = app.sessions?.find(s => s.id === navigationContext.previousChatId);
                if (session) {
                  app.openChatSession(session);
                }
              } else {
                app.updateCurrentPage(targetPage);
              }
              
              // 3. Clear UNIQUEMENT previousPage/previousChatId (pas pendingAttachment)
              setNavigationContext(prev => ({
                previousPage: null,
                previousChatId: null,
                pendingAttachment: prev.pendingAttachment // ✅ CONSERVER !
              }));
            }}
          />
        );
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* ✅ TopBar fixe en haut */}
        <div className="fixed top-0 left-0 right-0 z-40">
          <UnifiedTopBar 
            currentPage={app.currentPage}
            onPageChange={app.updateCurrentPage}
            isTimelineVisible={isTimelineVisible}
            setIsTimelineVisible={setIsTimelineVisible}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            currentDay={currentDay}
            setCurrentDay={setCurrentDay}
            isThemeBarVisible={isThemeBarVisible}
            setIsThemeBarVisible={setIsThemeBarVisible}
            navigationContext={navigationContext}
            onNavigateWithContext={navigateWithContext}
            onNavigateBack={navigateBack}
            jumpToDay={(day) => {
              setCurrentDay(day);
              if (memoriesPageRef.current?.jumpToDay) {
                memoriesPageRef.current.jumpToDay(day);
              }
            }}
            navigateDay={(delta) => {
              const newDay = Math.max(0, Math.min(currentDay + delta, 200));
              setCurrentDay(newDay);
            }}
            displayOptions={displayOptions}
            setDisplayOptions={setDisplayOptions}
            jumpToRandomMoment={() => {
              if (memoriesPageRef.current?.jumpToRandomMoment) {
                memoriesPageRef.current.jumpToRandomMoment();
              }
            }}
            chatSession={app.currentChatSession}
            onEditChatTitle={() => setEditingChatTitle(true)}
            onCloseChatSession={app.closeChatSession}
          />
        </div>
        
        {/* ✅ Contenu avec padding-top pour compenser TopBar fixe */}
        <main className="flex-1 pt-12 pb-16 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
        
        <BottomNavigation 
          currentPage={app.currentPage} 
          onPageChange={app.updateCurrentPage} 
          app={app}
        />
        
        {app.isCreatingSession && <SessionCreationSpinner />}
      </div>
    </ErrorBoundary>
  );
}