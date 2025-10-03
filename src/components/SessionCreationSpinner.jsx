/**
 * SessionCreationSpinner.jsx - Overlay fullscreen
 * ✅ Affichage centralisé pendant création session
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SessionCreationSpinner() {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      style={{ zIndex: 10000 }}
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4 max-w-sm mx-4">
        <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
        <p className="text-xl font-semibold text-gray-900 text-center">
          Création de la session...
        </p>
        <p className="text-sm text-gray-600 text-center">
          Enregistrement sur Google Drive
        </p>
      </div>
    </div>
  );
}