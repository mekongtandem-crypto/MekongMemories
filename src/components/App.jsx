/**
 * App.jsx v2.8 - Phase 24 : DarkMode
 * 
 */

// ============================================
// IMPORTS
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { APP_VERSION, APP_NAME, PHASE, BUILD_DATE } from '../config/version.js';
import { useAppState } from '../hooks/useAppState.js';
import { ThemeProvider } from './ThemeContext.jsx';
import TopBar from './topbar/TopBar.jsx';
import { BottomNavigation } from './Navigation.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MemoriesPage from './pages/MemoriesPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import StartupPage from './pages/StartupPage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
// ⭐ v2.14 : Context pour MemoriesPage
import { MemoriesDisplayProvider } from './memories/context/MemoriesDisplayContext.jsx';
import { enrichMomentsWithData } from './memories/layout/helpers.js';

// ============================================
// ERROR BOUNDARY
// ============================================

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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function App() {
  
  // ============================================
  // 1. ÉTAT GLOBAL (useAppState)
  // ============================================
  
  const app = useAppState();
  
  // ============================================
  // 2. ÉTATS LOCAUX (useState)
  // ============================================
  
  // Timeline & Display
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [displayOptions, setDisplayOptions] = useState({
    showPostText: true,
    showPostPhotos: true,
    showMomentPhotos: true
  });
  
  // UI States
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [isThemeBarVisible, setIsThemeBarVisible] = useState(false);
  
  // Navigation Context
  const [navigationContext, setNavigationContext] = useState({
    previousPage: null,
    pendingAttachment: null,
    sessionMomentId: null,
    pendingLink: null  
  });

  // Mode Sélection (Phase 18b)
  const [selectionMode, setSelectionMode] = useState({
    active: false,
    type: null,
    callback: null
  });

  // ⭐ v2.9 : Mode Édition
  const [editionMode, setEditionMode] = useState({
    active: false
  });

  // ============================================
  // 3. RÉFÉRENCES (useRef)
  // ============================================
  
  const memoriesPageRef = useRef(null);

  // ============================================
  // 4. HANDLERS (useCallback) - TOUS EN PREMIER
  // ============================================
  
  // 4.1 - Navigation principale
  
  /**
   * Navigation depuis Chat vers contenu dans Memories
   * Utilisé par les liens dans les messages
   */
  const handleNavigateToContentFromChat = useCallback((linkedContent) => {
    console.log('🧭 Navigation Chat → Memories/Photo:', linkedContent);
    
    // Sauvegarder position scroll Chat
    if (window.saveChatScrollPosition) {
      window.saveChatScrollPosition();
    }
    
    setNavigationContext({
      previousPage: 'chat',
      pendingAttachment: null,
      sessionMomentId: linkedContent.type === 'moment' ? linkedContent.id : null,
      pendingLink: null,
      targetContent: linkedContent
    });
    
    app.updateCurrentPage('memories');
  }, [app]);

  /**
   * Changement de page via BottomNavigation
   */
  const handlePageChange = useCallback((newPage) => {
    console.log('📄 Changement page:', app.currentPage, '→', newPage);
    console.log('🔍 navigationContext LOCAL:', navigationContext);
    console.log('🔍 app.navigationContext:', app.navigationContext);
    console.log('🔍 app.navigationContext.returnContext:', app.navigationContext?.returnContext);

    // Désactiver mode sélection si actif
    if (selectionMode.active) {
      console.log('❌ Annulation mode sélection lors navigation manuelle');
      setSelectionMode({
        active: false,
        type: null,
        callback: null
      });
    }

    // ⭐ v2.9 : Désactiver mode édition si actif
    if (editionMode.active) {
      console.log('❌ Annulation mode édition lors navigation');
      setEditionMode({ active: false });
    }

    // ⭐ v2.9s : Si retour avec returnContext, ne pas écraser le navigationContext
    if (app.navigationContext?.returnContext) {
      console.log('🔄 Retour avec returnContext détecté, préservation du contexte');
      app.updateCurrentPage(newPage);
      return;
    }

    // Navigation spéciale Chat → Memories (transmettre momentId)
    if (newPage === 'memories' && app.currentPage === 'chat' && app.currentChatSession?.gameId) {
      console.log('🎯 Navigation Chat → Memories détectée, momentId:', app.currentChatSession.gameId);

      setNavigationContext({
        previousPage: 'chat',
        pendingAttachment: null,
        sessionMomentId: app.currentChatSession.gameId,
        pendingLink: null
      });
    } else {
      setNavigationContext({
        previousPage: null,
        pendingAttachment: null,
        sessionMomentId: null,
        pendingLink: null
      });
    }

    app.updateCurrentPage(newPage);
  }, [app, selectionMode.active, editionMode.active]);

  /**
   * Navigation avec contexte (générique)
   */
  const handleNavigateWithContext = useCallback((targetPage, context = {}) => {
    console.log('🧭 Navigation avec contexte:', targetPage, context);

    setNavigationContext({
      previousPage: app.currentPage,
      pendingAttachment: context.attachment || null,
      sessionMomentId: context.sessionMomentId || null,
      pendingLink: null
    });

    app.updateCurrentPage(targetPage);
  }, [app]);

  /**
   * Retour vers page précédente (bouton ← TopBar)
   */
  const handleNavigateBack = useCallback(() => {
    const previousPage = navigationContext.previousPage || 'sessions';
    console.log('← Retour vers:', previousPage);
    console.log('🔍 STACK TRACE:', new Error().stack);
    
    setNavigationContext({
      previousPage: null,
      pendingAttachment: null,
      sessionMomentId: null,
      pendingLink: null  
    });
    
    app.updateCurrentPage(previousPage);
  }, [navigationContext, app]);

  /**
   * PHASE 19D : Ouverture session depuis Memories
   * Utilisé par SessionListModal et SessionInfoPanel
   */
  const handleOpenSessionFromMemories = useCallback((session) => {
    console.log('💬 Ouverture session depuis Memories:', session.id);
    
    // Sauvegarder contexte pour retour
    setNavigationContext(prev => ({
      ...prev,
      previousPage: 'memories'
    }));
    
    // Ouvrir la session
    app.openChatSession(session);
  }, [app]);

  // 4.2 - Mode sélection (Phase 18b)
  
  /**
   * Démarrer mode sélection (bouton 🔗 dans ChatPage)
   */
  const handleStartSelectionMode = useCallback((type, callback) => {
    console.log('🔗 Démarrage mode sélection:', type);
    
    // Récupérer gameId si vient d'une session
    const gameId = (app.currentPage === 'chat' && app.currentChatSession?.gameId) 
      ? app.currentChatSession.gameId 
      : null;
    
    console.log('🎯 Auto-open moment:', gameId);
    
    setSelectionMode({
      active: true,
      type: type,
      callback: callback
    });
    
    setNavigationContext({
      previousPage: app.currentPage,
      pendingAttachment: null,
      sessionMomentId: gameId,
      pendingLink: null
    });
    
    app.updateCurrentPage('memories');
  }, [app]);

  /**
   * Annuler mode sélection (bouton ❌ TopBar)
   */
  const handleCancelSelectionMode = useCallback(() => {
    console.log('✖️ Annulation mode sélection');

    const previousPage = navigationContext.previousPage || 'chat';

    setSelectionMode({
      active: false,
      type: null,
      callback: null
    });

    setNavigationContext({
      previousPage: null,
      pendingAttachment: null,
      sessionMomentId: null,
      pendingLink: null
    });

    app.updateCurrentPage(previousPage);
  }, [navigationContext, app]);

  /**
   * ⭐ v2.9 : Activer/désactiver mode édition
   */
  const handleToggleEditionMode = useCallback(() => {
    setEditionMode(prev => {
      const newState = !prev.active;
      console.log(newState ? '📝 Activation mode édition' : '✖️ Désactivation mode édition');
      return { active: newState };
    });
  }, []);

  const handleCancelEditionMode = useCallback(() => {
    console.log('✖️ Annulation mode édition');
    setEditionMode({ active: false });
  }, []);

  // ⭐ v2.9 : Exposer editionMode globalement
  useEffect(() => {
    window.appState = {
      editionMode: editionMode
    };
  }, [editionMode]);

  /**
   * Validation sélection contenu
   */
  const handleContentSelected = useCallback((contentData) => {
    console.log('✅ Contenu sélectionné:', contentData);
    
    const previousPage = navigationContext.previousPage || 'chat';
    
    setSelectionMode({
      active: false,
      type: null,
      callback: null
    });
    
    // Conserver previousPage pour validation ChatPage
    setNavigationContext({
      previousPage: 'memories',
      pendingAttachment: null,
      sessionMomentId: null,
      pendingLink: contentData
    });
    
    app.updateCurrentPage(previousPage);
  }, [navigationContext, app]);

  // 4.3 - Attachements & Photos
  
  /**
   * Attacher contenu au chat (photo/moment)
   */
  const handleAttachToChat = useCallback((attachment) => {
    console.log('📎 Attachement vers chat:', attachment);
    
    setNavigationContext(prev => ({
      ...prev,
      pendingAttachment: attachment,
      sessionMomentId: null
    }));
    
    app.updateCurrentPage('chat');
  }, [app]);

  /**
   * Nettoyer attachement après utilisation
   */
  const handleClearAttachment = useCallback(() => {
    console.log('🧹 Clear attachment et pendingLink');
    setNavigationContext(prev => ({
      ...prev,
      pendingAttachment: null,
      pendingLink: null
    }));
  }, []);

  // 4.4 - MemoriesPage actions
  
  /**
   * Jump vers moment aléatoire
   */
  const handleJumpToRandomMoment = useCallback(() => {
    console.log('🎲 [App.jsx] handleJumpToRandomMoment appelé');
    console.log('🎲 [App.jsx] memoriesPageRef.current:', memoriesPageRef.current);
    if (memoriesPageRef.current?.jumpToRandomMoment) {
      console.log('🎲 [App.jsx] Appel de memoriesPageRef.current.jumpToRandomMoment()');
      memoriesPageRef.current.jumpToRandomMoment();
    } else {
      console.error('❌ [App.jsx] memoriesPageRef.current.jumpToRandomMoment N\'EXISTE PAS !');
    }
  }, []);

  /**
   * Jump vers jour spécifique
   */
  const handleJumpToDay = useCallback((day) => {
    if (memoriesPageRef.current?.jumpToDay) {
      memoriesPageRef.current.jumpToDay(day);
    }
  }, []);

  // ============================================
  // 5. EFFETS (useEffect) - APRÈS les useCallback
  // ============================================
  
  // Effet 1 : Reset navigationContext lors changement de session
  // ⚠️ IMPORTANT : Ne pas effacer previousPage si navigation intentionnelle
  useEffect(() => {
    if (app.currentChatSession?.id) {
      console.log('🧹 Changement session détecté');
      
      // ⭐ PHASE 19D : Préserver previousPage s'il existe (navigation intentionnelle)
      setNavigationContext(prev => {
        const shouldPreservePreviousPage = prev.previousPage != null;
        
        if (shouldPreservePreviousPage) {
          console.log('✅ Préservation previousPage:', prev.previousPage);
          return {
            ...prev,
            pendingAttachment: null,  // Reset seulement les attachements
            pendingLink: null         // et les liens
            // previousPage et sessionMomentId sont préservés
          };
        }
        
        // Si pas de previousPage, reset complet (navigation normale depuis Sessions)
        console.log('🔄 Reset complet navigationContext');
        return {
          previousPage: null,
          pendingAttachment: null,
          sessionMomentId: null,
          pendingLink: null
        };
      });
    }
  }, [app.currentChatSession?.id]);
  
  // Effet 2 : Exposer handler navigation pour ChatPage (window callback)
  useEffect(() => {
    window.navigateToContentFromChat = handleNavigateToContentFromChat;
    
    return () => {
      delete window.navigateToContentFromChat;
    };
  }, [handleNavigateToContentFromChat]);

  // ============================================
  // 6. CONDITIONAL RENDERS (StartupPage)
  // ============================================
  
  // Afficher StartupPage jusqu'à initialisation complète
  if (!app.isInitialized || !app.currentUser) {
    return (
      <ErrorBoundary>
        <StartupPage onReady={() => {
          console.log('✅ Startup terminé, app prête');
        }} />
      </ErrorBoundary>
    );
  }

  // ============================================
  // 7. RENDER PAGE (Switch)
  // ============================================
  
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
            navigationContext={app.navigationContext || navigationContext || { previousPage: null, pendingAttachment: null, sessionMomentId: null, pendingLink: null }}
            onNavigateBack={handleNavigateBack}
            onAttachToChat={handleAttachToChat}
            selectionMode={selectionMode}
            onContentSelected={handleContentSelected}
            onOpenSessionFromMemories={handleOpenSessionFromMemories}
            editionMode={editionMode}
            onToggleEditionMode={handleToggleEditionMode}
            onCancelEditionMode={handleCancelEditionMode}
          />
        );
      
      case 'sessions':
        return (
          <SessionsPage
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
          />
        );
      
      case 'chat':
        return (
          <ChatPage
            navigationContext={app.navigationContext || navigationContext}
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

  // ============================================
  // 8. RENDER PRINCIPAL
  // ============================================

  // ⭐ v2.14 : Préparer momentsData pour MemoriesDisplayProvider
  const momentsData = app.currentPage === 'memories'
    ? enrichMomentsWithData(app.masterIndex?.moments)
    : null;

  // ⭐ v2.14 : Wrapper conditionnel pour Provider
  const ContentWrapper = ({ children }) => {
    if (app.currentPage === 'memories' && momentsData) {
      return (
        <MemoriesDisplayProvider momentsData={momentsData}>
          {children}
        </MemoriesDisplayProvider>
      );
    }
    return <>{children}</>;
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ContentWrapper>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">

            {/* TopBar fixe */}
            <div className="fixed top-0 left-0 right-0 z-40">
              <TopBar
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
              selectedTheme={selectedTheme}
              setSelectedTheme={setSelectedTheme}
              editionMode={editionMode}
              onToggleEditionMode={handleToggleEditionMode}
              onCancelEditionMode={handleCancelEditionMode}
              memoriesPageRef={memoriesPageRef}
            />
          </div>

          {/* Contenu principal - ✅ Ajouter padding-top pour compenser TopBar fixe */}
          <main className="flex-1 pt-12 pb-16 overflow-auto">
            {renderPage()}
          </main>

          {/* BottomNavigation fixe */}
          {app.isInitialized && (
            <BottomNavigation
              currentPage={app.currentPage}
              onPageChange={handlePageChange}
              app={app}
              navigationContext={app.navigationContext || navigationContext}
            />
          )}
          
          {/* ✨ Spinner générique pour opérations async */}
          {app.loadingOperation?.active && (
            <LoadingSpinner
              message={app.loadingOperation.message}
              subMessage={app.loadingOperation.subMessage}
              variant={app.loadingOperation.variant}
            />
          )}
          </div>
        </ContentWrapper>
      </ErrorBoundary>
    </ThemeProvider>
  );
}