// useAppState.js - Connecté à la nouvelle logique de session

import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataManager } from '../core/dataManager.js';
import { connectionManager } from '../core/ConnectionManager.js';
import { userManager } from '../core/UserManager.js';

export function useAppState() {
  const [appState, setAppState] = useState(() => {
    // --- CORRECTION 1 : On fournit un objet vide par défaut ---
    // Si getState() renvoie undefined au début, on utilise {} pour éviter le crash.
    const initialData = dataManager.getState() || {};
    const initialConnection = connectionManager.getState() || {};

    return {
      data: initialData,
      connection: initialConnection,
    };
  });

  useEffect(() => {
    const unsubDataManager = dataManager.subscribe(newDataState => {
      setAppState(prevState => ({ ...prevState, data: newDataState || {} }));
    });
    const unsubConnectionManager = connectionManager.subscribe(newConnectionState => {
      setAppState(prevState => ({ ...prevState, connection: newConnectionState || {} }));
    });
    return () => {
      unsubDataManager();
      unsubConnectionManager();
    };
  }, []);

const connect = useCallback(() => connectionManager.connect(), []);
  const disconnect = useCallback(() => connectionManager.disconnect(), []);
  const updateCurrentPage = useCallback((pageId) => dataManager.updateCurrentPage(pageId), []);

  useEffect(() => {
    // Pas de changement ici, c'est déjà correct.
    if (appState.connection.isOffline) {
      connect();
    }
  }, [appState.connection.isOffline, connect]);
  
  const derivedUserState = useMemo(() => {
    try {
      // --- CORRECTION 2 : On ajoute une sécurité ici aussi ---
      // On s'assure que appState.data existe avant de lire currentUser.
      const userId = appState.data?.currentUser || '';
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
  }, [appState.data?.currentUser]);


  // --- FONCTIONS DE SESSION (SIMULÉES POUR L'INSTANT) ---
  const createSession = useCallback(async (gameData) => dataManager.createSession(gameData), []);
  const updateSession = useCallback(async (session) => dataManager.updateSession(session), []);
  const deleteSession = useCallback(async (sessionId) => dataManager.deleteSession(sessionId), []);
  const openChatSession = useCallback(async (session) => dataManager.openChatSession(session), []);
  const closeChatSession = useCallback(async () => dataManager.closeChatSession(), []);
  const addMessageToSession = useCallback(async (sessionId, content) => dataManager.addMessageToSession(sessionId, content), []);

  // --- L'objet retourné est maintenant enrichi des nouvelles fonctions ---
  return {
    ...appState.data,
    ...derivedUserState,
    connection: appState.connection,
    connect,
    disconnect,
    updateCurrentPage,
    // Fonctions de session
    createSession,
    updateSession,
    deleteSession,
    openChatSession,
    closeChatSession,
    addMessageToSession,
  };
}