/**
 * App.jsx v1.3 - Spinner global création session
 * ✅ NOUVEAU : Affichage SessionCreationSpinner si isCreatingSession
 */
import React from 'react';
import { useAppState } from '../hooks/useAppState.js';
import { TopNavigation, BottomNavigation } from './Navigation.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MemoriesPage from './pages/MemoriesPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import UserSelectionPage from './pages/UserSelectionPage.jsx';
import SessionCreationSpinner from './SessionCreationSpinner.jsx'; // ✅ NOUVEAU

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

function PageRenderer({ currentPage }) {
  switch (currentPage) {
    case 'settings':
      return <SettingsPage />;
    case 'sessions':
      return <SessionsPage />;
    case 'chat':
      return <ChatPage />;
    case 'memories':
    default:
      return <MemoriesPage />;
  }
}

export default function App() {
  const app = useAppState();

  if (!app.isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="animate-pulse text-lg">Chargement des souvenirs du Mékong...</p>
      </div>
    );
  }

  if (!app.currentUser) {
    return <UserSelectionPage />;
  }
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <TopNavigation onPageChange={app.updateCurrentPage} app={app} />
        
        <main className="pb-20 md:pb-4 p-4 max-w-7xl mx-auto">
          <PageRenderer currentPage={app.currentPage} />
        </main>
        
        <BottomNavigation currentPage={app.currentPage} onPageChange={app.updateCurrentPage} />
        
        {/* ✅ NOUVEAU : Spinner global */}
        {app.isCreatingSession && <SessionCreationSpinner />}
      </div>
    </ErrorBoundary>
  );
}