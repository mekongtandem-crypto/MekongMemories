/**
 * App.jsx v3.3 - Final UI Architecture
 * This component is the main skeleton of the application. It handles loading/error states
 * and passes the global state down to the navigation and page components.
 */
import React from 'react';
import { useAppState } from '../hooks/useAppState.js';
import { TopNavigation, BottomNavigation } from './Navigation.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MemoriesPage from './pages/MemoriesPage.jsx';

// The "router" that selects which page to display
function PageRenderer({ currentPage, app }) {
  switch (currentPage) {
    case 'settings':
      return <SettingsPage app={app} />;
    case 'memories':
    default:
      return <MemoriesPage app={app} />;
  }
}

// Loading screen component
function LoadingScreen({ message }) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">{message}</p>
                <div className="mt-4 w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        </div>
    );
}

// Error screen component
function ErrorScreen({ error }) {
    return (
        <div className="flex items-center justify-center h-screen bg-red-50 p-4">
             <div className="text-center p-6 bg-white border border-red-300 rounded-lg shadow-lg max-w-lg">
                <h1 className="text-xl font-bold text-red-700">Application Error</h1>
                <p className="mt-2 text-gray-600">A critical error occurred:</p>
                <pre className="mt-4 p-3 bg-red-100 text-red-800 text-sm text-left rounded overflow-x-auto">{error}</pre>
            </div>
        </div>
    );
}

// The main App component
export default function App() {
  const app = useAppState();

  if (app.isLoading || !app.isInitialized) {
    return <LoadingScreen message="Loading application..." />;
  }
  if (app.error) {
    return <ErrorScreen error={app.error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopNavigation app={app} onPageChange={app.updateCurrentPage} />
      
      <main className="pb-20 md:pb-4">
        <PageRenderer currentPage={app.currentPage} app={app} />
      </main>
      
      <BottomNavigation currentPage={app.currentPage} onPageChange={app.updateCurrentPage} />
    </div>
  );
}

