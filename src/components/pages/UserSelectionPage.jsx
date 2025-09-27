// src/components/pages/UserSelectionPage.jsx

import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { userManager } from '../../core/UserManager';

export default function UserSelectionPage() {
  const { setCurrentUser } = useAppState();
  const allUsers = userManager.getAllUsers();

  return (
    <div className="flex flex-col items-center justify-center h-screen -mt-16 bg-gray-50">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🐘</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Qui est aux commandes ?</h1>
      <p className="text-gray-600 mb-8">Veuillez sélectionner un profil pour continuer.</p>
      
      <div className="space-y-4">
        {allUsers.map((user) => {
          // --- LA CORRECTION EST ICI ---
          // 1. On appelle la fonction pour générer l'objet de style pour cet utilisateur
          const style = userManager.getUserStyle(user.id);
          
          return (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user.id)}
              // 2. On utilise notre variable `style` (et non user.style) pour les classes CSS
              className={`w-72 flex items-center space-x-4 p-4 border rounded-lg transition-transform transform hover:scale-105 ${style.bg} ${style.border}`}
            >
              <span className="text-4xl">{user.emoji}</span>
              <div>
                <span className={`text-xl font-bold ${style.text}`}>{user.name}</span>
                <p className={`text-sm ${style.text} opacity-80`}>{user.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}