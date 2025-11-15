/**
 * LoadingSpinner.jsx v2.7 - Phase 26 : Spinner de Chargement Générique
 * ✅ Support dark mode complet
 * ✅ Messages contextuels courts
 * ✅ Animation fun mais sobre
 * ✅ Backdrop flou pour éviter interactions
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

function LoadingSpinner({
  message = 'Chargement...',
  subMessage = 'Enregistrement sur Google Drive',
  variant = 'spin' // 'spin' | 'bounce' | 'monkey'
}) {
  // Animation fun : singe avec expression qui change
  const MonkeySpinner = () => (
    <div className="flex flex-col items-center space-y-3">
      {/* Singe avec yeux qui tournent */}
      <div className="text-6xl animate-pulse-soft">
        🐵
      </div>
      {/* Petits éléments qui sautillent */}
      <div className="flex space-x-2">
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0s'
          }}
        />
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.2s'
          }}
        />
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.4s'
          }}
        />
      </div>
    </div>
  );

  // Spinner standard avec icône Loader2
  const StandardSpinner = () => (
    <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
  );

  // Élément qui sautille avec style
  const BounceSpinner = () => (
    <div className="flex flex-col items-center space-y-3">
      <div
        className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full"
        style={{
          animation: 'bounce 1.4s infinite'
        }}
      />
      <div className="flex space-x-2">
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0s'
          }}
        />
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.2s'
          }}
        />
        <div
          className="w-2 h-2 bg-amber-500 rounded-full"
          style={{
            animation: 'bounce 1.4s infinite',
            animationDelay: '0.4s'
          }}
        />
      </div>
    </div>
  );

  // Sélectionner le spinner basé sur la variante
  const getSpinnerContent = () => {
    switch (variant) {
      case 'monkey':
        return <MonkeySpinner />;
      case 'bounce':
        return <BounceSpinner />;
      default:
        return <StandardSpinner />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn dark:bg-black/70"
      style={{ zIndex: 10000 }}
    >
      {/* Container du spinner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 max-w-sm mx-4">
        {/* Spinner animation */}
        {getSpinnerContent()}

        {/* Message principal */}
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
          {message}
        </p>

        {/* Message secondaire (optionnel) */}
        {subMessage && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {subMessage}
          </p>
        )}
      </div>

      {/* Style global pour animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-12px);
            opacity: 0.7;
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
