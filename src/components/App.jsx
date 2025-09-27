// App.jsx - Version Finale Corrigée

import React from 'react';
import { useAppState } from '../hooks/useAppState.js';
import { TopNavigation, BottomNavigation } from './Navigation.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MemoriesPage from './pages/MemoriesPage.jsx'; // Assurez-vous que ce chemin est correct

// --- Détecteur d'Erreurs (Error Boundary) ---
// On le garde, c'est une bonne pratique pour attraper les futures erreurs.
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

// --- Le PageRenderer corrigé ---
// Il n'y a pas de logique complexe, il choisit juste le bon composant.
function PageRenderer({ currentPage }) {
  switch (currentPage) {
    case 'settings':
      return <SettingsPage />;
    case 'home':
    default:
      // On affiche directement MemoriesPage
      return <MemoriesPage />;
  }
}

// --- Composant Principal ---
export default function App() {
  const app = useAppState();

  // Affiche l'écran de chargement tant que les données ne sont pas prêtes.
  if (!app.isInitialized) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p className="animate-pulse text-lg">Chargement de l'application...</p>
        </div>
    );
  }

  // Affiche l'application complète une fois les données initialisées.
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <TopNavigation onPageChange={app.updateCurrentPage} app={app} />
        <main className="pb-20 md:pb-4">
          {/* On utilise notre PageRenderer pour afficher la page courante */}
          <PageRenderer currentPage={app.currentPage} />
        </main>
        <BottomNavigation currentPage={app.currentPage} onPageChange={app.updateCurrentPage} />
      </div>
    </ErrorBoundary>
  );
}