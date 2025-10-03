/**
 * App.jsx v2.1 - Fix jumpToRandomMoment
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
  
  // ✅ NOUVEAU : Ref pour exposer jumpToRandomMoment de MemoriesPage
  const memoriesPageRef = useRef(null);

  if (!app.isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="animate-pulse text-lg">Chargement...</p>
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
          />
        );
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <UnifiedTopBar 
          currentPage={app.currentPage}
          onPageChange={app.updateCurrentPage}
          isTimelineVisible={isTimelineVisible}
          setIsTimelineVisible={setIsTimelineVisible}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
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
        
        <main className="flex-1 pb-16 md:pb-4 overflow-auto">
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