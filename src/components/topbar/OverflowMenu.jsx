/**
 * OverflowMenu.jsx v1.1 - Phase 25 : Refactoring TopBar
 * Menu "..." commun à toutes les TopBars
 * 
 * ✅ Transitions 150ms
 * ✅ Avatar ouvre Settings + volet User
 * 
 * Structure :
 * - Actions page (slot children)
 * - Séparateur
 * - 👤 Nom utilisateur → Settings + volet User
 * - ⚙️ Réglages → Settings  
 * - 🌙 Mode sombre (toggle inline)
 */

import React, { useRef, useEffect } from 'react';
import { Settings, User, Sun, Moon } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import { useTheme } from '../ThemeContext.jsx';
import { userManager } from '../../core/UserManager.js';
import { MessageCirclePlus } from 'lucide-react';
import { SORT_OPTIONS } from '../../utils/sessionUtils.js';

export default function OverflowMenu({ 
  isOpen, 
  onClose, 
  children, // Actions spécifiques à la page
  pageSpecificActions // ✅ NOUVEAU : {newSession, sort, currentSort, onSortChange}
}) {
  
  const app = useAppState();
  const { isDark, toggleTheme } = useTheme();
  const menuRef = useRef(null);
  
  // Fermer au clic outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const currentUser = app.currentUser;
  const userStyle = userManager.getUserStyle(currentUser?.id);
  const hasPageActions = React.Children.count(children) > 0;
  
  const handleNavigateToSettings = () => {
    onClose();
    app.updateCurrentPage('settings');
    // Ne pas ouvrir automatiquement un volet
  };
  
  // ✅ NOUVEAU : Avatar ouvre Settings + volet User
  const handleAvatarClick = () => {
  	console.log('🔍 Avatar cliqué');
    onClose();
    app.updateCurrentPage('settings');
    
    // Ouvrir le volet User après un court délai
    setTimeout(() => {
        console.log('🔍 Tentative ouverture volet User', window.settingsPageActions);
      if (window.settingsPageActions?.openSection) {
        window.settingsPageActions.openSection('users');
      } else {
      console.error('❌ window.settingsPageActions non disponible');
    }
    }, 100);
  };
  
  const handleToggleTheme = () => {
    toggleTheme();
    // Ne pas fermer le menu pour permettre de voir le changement
  };
  
  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-64 z-50"
    >
      
      {/* Actions spécifiques page (slot) */}
      {hasPageActions && (
        <>
          <div className="py-1">
            {children}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        </>
      )}
      
      {/* ✅ NOUVEAU : Actions Sessions (si pageSpecificActions fourni) */}
      {pageSpecificActions?.newSession && (
        <>
          <button
            onClick={() => {
              onClose();
              // TODO: Ouvrir modal création session ad-hoc
              console.log('⚠️ Création session ad hoc : modal à implémenter');
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
          >
            <MessageCirclePlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">Nouvelle causerie</span>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        </>
      )}
      
      {/* ✅ NOUVEAU : Tri (mobile uniquement - si fourni) */}
      {pageSpecificActions?.sort && (
        <>
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Tri des sessions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  pageSpecificActions.onSortChange?.(SORT_OPTIONS.MODIFIED);
                  onClose();
                }}
                className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                  pageSpecificActions.currentSort === SORT_OPTIONS.MODIFIED
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Par dernière modification
              </button>
              <button
                onClick={() => {
                  pageSpecificActions.onSortChange?.(SORT_OPTIONS.CREATED);
                  onClose();
                }}
                className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                  pageSpecificActions.currentSort === SORT_OPTIONS.CREATED
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Par date de création
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        </>
      )}
      
      {/* Section utilisateur - ✅ Ouvre Settings + volet User */}
      <button
        onClick={handleAvatarClick}
        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${userStyle.bg}`}>
          {currentUser?.emoji || '👤'}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {currentUser?.name || 'Utilisateur'}
        </span>
      </button>
      
      {/* Réglages */}
      <button
        onClick={handleNavigateToSettings}
        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-150"
      >
        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100">Réglages</span>
      </button>
      
      {/* Toggle Dark Mode */}
      <button
        onClick={handleToggleTheme}
        className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      >
        <div className="flex items-center space-x-2">
          {isDark ? (
            <Moon className="w-4 h-4 text-blue-500" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-gray-900 dark:text-gray-100">Mode sombre</span>
        </div>
        
        {/* Toggle switch inline */}
        <div
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 ${
            isDark ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      </button>
      
    </div>
  );
}