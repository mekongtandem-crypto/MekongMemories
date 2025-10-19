// hooks/useAppState.js - Phase 15a avec notifications

import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataManager } from '../core/dataManager.js';
import { connectionManager } from '../core/ConnectionManager.js';
import { userManager } from '../core/UserManager.js';

export function useAppState() {
  // HOOK 1: useState
  const [appState, setAppState] = useState(() => ({
    data: dataManager.getState() || {},
    connection: connectionManager.getState() || {},
  }));

  // HOOK 2: useEffect (pour les abonnements)
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

  // HOOK 3: useCallback (pour la connexion)
  const connect = useCallback(() => connectionManager.connect(), []);

  // HOOK 4: useEffect (pour la connexion automatique)
  useEffect(() => {
    if (connectionManager.getState().isOffline) {
      connect();
    }
  }, [connect]);

  // HOOK 5: useMemo (pour dériver l'état de l'utilisateur)
  const derivedUserState = useMemo(() => {
    const userId = appState.data?.currentUser || null;
    const currentUserObject = userManager.getUser(userId);
    const userStyle = userManager.getUserStyle(userId);
    return { currentUser: currentUserObject, userStyle };
  }, [appState.data?.currentUser]);

  // Actions exposées à l'UI (toutes avec useCallback)
  const disconnect = useCallback(() => connectionManager.disconnect(), []);
  const updateCurrentPage = useCallback((pageId) => dataManager.updateCurrentPage(pageId), []);
  const setCurrentUser = useCallback((userId) => dataManager.setCurrentUser(userId), []);
  
  // Actions de session
  const createSession = useCallback((gameData, initialText, sourcePhoto) => 
    dataManager.createSession(gameData, initialText, sourcePhoto), []);
  const updateSession = useCallback((session) => dataManager.updateSession(session), []);
  const deleteSession = useCallback((sessionId) => dataManager.deleteSession(sessionId), []);
  const openChatSession = useCallback((session) => dataManager.openChatSession(session), []);
  const closeChatSession = useCallback(() => dataManager.closeChatSession(), []);
  const addMessageToSession = useCallback(async (sessionId, content, photoData = null) => {
  console.log('🔗 useAppState.addMessageToSession - photoData:', photoData);
  await dataManager.addMessageToSession(sessionId, content, photoData);
}, []);
  const regenerateMasterIndex = useCallback(() => dataManager.regenerateMasterIndex(), []);

  // Actions notifications (Phase 15a)
  const sendNotification = useCallback((toUserId, sessionId, sessionTitle) => 
    dataManager.sendNotification(toUserId, sessionId, sessionTitle), []);

  const getUnreadNotifications = useCallback(() => {
    if (!appState.data?.currentUser) return [];
    return dataManager.notificationManager?.getUnreadNotifications(appState.data.currentUser) || [];
  }, [appState.data?.currentUser]);

  const getUnreadNotificationCount = useCallback(() => {
    if (!appState.data?.currentUser) return 0;
    return dataManager.notificationManager?.getUnreadCount(appState.data.currentUser) || 0;
  }, [appState.data?.currentUser]);

  // On fusionne l'état brut, l'état dérivé et les actions
  return {
    ...appState.data,
    ...derivedUserState,
    connection: appState.connection,
    connect,
    disconnect,
    updateCurrentPage,
    setCurrentUser,
    createSession,
    updateSession,
    deleteSession,
    openChatSession,
    closeChatSession,
    addMessageToSession,
    regenerateMasterIndex,
    sendNotification,
    getUnreadNotifications,
    getUnreadNotificationCount,
  };
}