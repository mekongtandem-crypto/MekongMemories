import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataManager } from '../core/dataManager.js';
import { connectionManager } from '../core/ConnectionManager.js';
import { userManager } from '../core/UserManager.js';

export function useAppState() {
  const [appState, setAppState] = useState(() => ({
    data: dataManager.getState(),
    connection: connectionManager.getState(),
  }));

  useEffect(() => {
    const unsubDataManager = dataManager.subscribe(newDataState => {
      setAppState(prevState => ({ ...prevState, data: newDataState }));
    });
    const unsubConnectionManager = connectionManager.subscribe(newConnectionState => {
      setAppState(prevState => ({ ...prevState, connection: newConnectionState }));
    });
    return () => {
      unsubDataManager();
      unsubConnectionManager();
    };
  }, []);

  const connect = useCallback(() => connectionManager.connect(), []);
  const disconnect = useCallback(() => connectionManager.disconnect(), []);
  const updateCurrentPage = useCallback(async (pageId) => dataManager.updateCurrentPage(pageId), []);

  useEffect(() => {
    if (appState.connection.isOffline) {
      connect();
    }
  }, [appState.connection.isOffline, connect]);

  const derivedUserState = useMemo(() => {
    try {
      const userId = appState.data.currentUser || '';
      const currentUser = userManager.getUser(userId);
      const userStyle = userManager.getUserStyle(userId);
      return { currentUser, userStyle };
    } catch (error) {
      console.error("ERREUR CRITIQUE DANS useAppState :", error);
      return { 
        currentUser: null, 
        userStyle: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800' }
      };
    }
  }, [appState.data.currentUser]);

  // --- FONCTIONS DE SESSION (SIMULÉES POUR L'INSTANT) ---
  const createSession = useCallback(async (sessionData) => {
    console.log('ACTION: createSession appelée avec:', sessionData);
    const newSession = { ...sessionData, id: sessionData.id || `session_${Date.now()}`, notes: [] };
    alert(`Nouvelle session créée (simulation) : ${newSession.title}`);
    return newSession;
  }, []);

  const updateSession = useCallback(async (session) => {
    console.log('ACTION: updateSession appelée pour:', session.id);
    alert(`Session mise à jour (simulation) : ${session.title}`);
    return session;
  }, []);

  const openChatSession = useCallback(async (session) => {
    console.log('ACTION: openChatSession appelée pour:', session.id);
    alert(`Navigation vers la page de chat pour la session (simulation) : ${session.title}`);
  }, []);

  return {
    ...appState.data,
    ...derivedUserState,
    connection: appState.connection,
    connect,
    disconnect,
    updateCurrentPage,
    createSession,
    updateSession,
    openChatSession,
  };
}

