/**
 * TopBar.jsx v1.0 - Phase 25 : Refactoring TopBar
 * Router principal vers les TopBars spécifiques
 * 
 * Remplace l'ancien UnifiedTopBar.jsx (533 lignes) 
 * par une architecture modulaire (6 fichiers)
 */

import React from 'react';
import SessionsTopBar from './SessionsTopBar.jsx';
import ChatTopBar from './ChatTopBar.jsx';
import MemoriesTopBar from './MemoriesTopBar.jsx';
import SettingsTopBar from './SettingsTopBar.jsx';
import GamesTopBar from './GamesTopBar.jsx';

export default function TopBar({ 
  currentPage, 
  ...props 
}) {
  
  // Router vers la TopBar spécifique
  switch (currentPage) {
    
    case 'sessions':
      return <SessionsTopBar {...props} />;
    
    case 'chat':
      return (
        <ChatTopBar 
          onCloseChatSession={props.onCloseChatSession}
        />
      );
    
    case 'memories':
      return (
        <MemoriesTopBar
          isSearchOpen={props.isSearchOpen}
          setIsSearchOpen={props.setIsSearchOpen}
          displayOptions={props.displayOptions}
          setDisplayOptions={props.setDisplayOptions}
          isThemeBarVisible={props.isThemeBarVisible}
          setIsThemeBarVisible={props.setIsThemeBarVisible}
          isTimelineVisible={props.isTimelineVisible}
          setIsTimelineVisible={props.setIsTimelineVisible}
          jumpToRandomMoment={props.jumpToRandomMoment}
          navigationContext={props.navigationContext}
          selectedTheme={props.selectedTheme}
          setSelectedTheme={props.setSelectedTheme}
          editionMode={props.editionMode}
          onToggleEditionMode={props.onToggleEditionMode}
          onCancelEditionMode={props.onCancelEditionMode}
          memoriesPageRef={props.memoriesPageRef}
        />
      );
    
    case 'saynetes':
      return <GamesTopBar />;

    case 'settings':
      return <SettingsTopBar />;

    default:
      return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page inconnue
          </span>
        </div>
      );
  }
}
