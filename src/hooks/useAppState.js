// hooks/useAppState.js - Phase 20 avec reloadMasterIndex()

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

  // HOOK 5: useMemo (pour dÃ©river l'Ã©tat de l'utilisateur)
  const derivedUserState = useMemo(() => {
    const userId = appState.data?.currentUser || null;
    const currentUserObject = userManager.getUser(userId);
    const userStyle = userManager.getUserStyle(userId);
    return { currentUser: currentUserObject, userStyle };
  }, [appState.data?.currentUser]);

  // Actions exposÃ©es Ã  l'UI (toutes avec useCallback)
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
  const addMessageToSession = useCallback(async (sessionId, content, photoData = null, linkedContent = null) => {
  // console.log('ðŸ”— useAppState.addMessageToSession - photoData:', photoData);
  // console.log('ðŸ”— useAppState.addMessageToSession - linkedContent:', linkedContent);
  await dataManager.addMessageToSession(sessionId, content, photoData, linkedContent);
}, []);
  const regenerateMasterIndex = useCallback(() => dataManager.regenerateMasterIndex(), []);
  const reloadMasterIndex = useCallback(() => dataManager.reloadMasterIndex(), []); // ✅ FIX v2.6.5

  // ⭐ v2.9 : Actions CRUD Moments, Posts, Photos
  const updateMoment = useCallback((moment) => dataManager.updateMoment(moment), []);
  const deleteMoment = useCallback((momentId, cascadeOptions) => dataManager.deleteMoment(momentId, cascadeOptions), []);
  const updatePost = useCallback((momentId, post) => dataManager.updatePost(momentId, post), []);
  const deletePost = useCallback((momentId, postId) => dataManager.deletePost(momentId, postId), []);
  const deletePhoto = useCallback((momentId, photoId, filename, deleteFromDrive, showSpinner) =>
    dataManager.deletePhoto(momentId, photoId, filename, deleteFromDrive, showSpinner), []);

  // ⭐ v2.9q : Nouvelles actions - Analyse impact et nettoyage global
  const analyzeDeleteImpact = useCallback((type, params) => dataManager.analyzeDeleteImpact(type, params), []);
  const cleanPhotoEverywhere = useCallback((photoId, filename) => dataManager.cleanPhotoEverywhere(photoId, filename), []);
  const navigateToMoment = useCallback((momentId, returnContext) => dataManager.navigateToMoment(momentId, returnContext), []);
  const navigateToSession = useCallback((sessionId, returnContext) => dataManager.navigateToSession(sessionId, returnContext), []);

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

  // ========================================
  // CONTENTLINKS - PHASE 19D
  // ========================================
  
  /**
   * Récupérer toutes les sessions liées à un contenu
   * 
   * USAGE :
   * - PhotoViewer : Afficher pastille 💬 avec compteur
   * - MemoriesPage : Pastilles sur moments/posts/photos
   * - SessionListModal : Liste cliquable des sessions
   * 
   * @param {string} contentType - 'photo' | 'post' | 'moment'
   * @param {string} contentId - ID du contenu
   * @returns {Array} Sessions complètes (avec originContent + liens dans messages)
   * 
   * EXEMPLE :
   * const sessions = getAllSessionsForContent('photo', 'dragon.jpg')
   * // → [{ id: 'sid_123', gameTitle: 'Souvenirs...', ... }]
   */
  const getAllSessionsForContent = useCallback((contentType, contentId) => {
    if (!appState.data?.sessions || !dataManager.contentLinks) {
      return [];
    }
    
    // Récupérer les sessionIds via ContentLinks (rapide : O(1))
    const sessionIds = dataManager.contentLinks.getSessionsForContent(contentType, contentId);
    
    // Enrichir avec les objets sessions complets
    const sessions = sessionIds
      .map(sessionId => appState.data.sessions.find(s => s.id === sessionId))
      .filter(Boolean);  // Supprimer les undefined si session supprimée
    
    console.log(`🔍 getAllSessionsForContent(${contentType}, ${contentId}):`, sessions.length, 'sessions');
    
    return sessions;
  }, [appState.data?.sessions]);

  // ========================================
  // EXPOSITION DE L'ÉTAT ET DES ACTIONS
  // ========================================

  // On fusionne l'Ã©tat brut, l'Ã©tat dÃ©rivÃ© et les actions
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
    reloadMasterIndex, // ✅ FIX v2.6.5
    sendNotification,
    getUnreadNotifications,
    getUnreadNotificationCount,

    // ⭐ v2.9 : Actions CRUD Moments, Posts, Photos
    updateMoment,
    deleteMoment,
    updatePost,
    deletePost,
    deletePhoto,

    // ⭐ v2.9q : Nouvelles actions - Analyse impact et nettoyage global
    analyzeDeleteImpact,
    cleanPhotoEverywhere,
    navigateToMoment,
    navigateToSession,

    // ⭐ CORRECTION BUG 2 - Phase 18/19 : Exposition contentLinks pour pastilles 💬
    // AVANT : contentLinks non exposé → getSessionsForContent() retournait toujours []
    // APRÈS : app.contentLinks accessible depuis MemoriesPage/PhotoViewer
    contentLinks: dataManager.contentLinks,

    // ⭐ NEW Phase 19D : Fonction helper pour récupérer sessions liées à un contenu
    getAllSessionsForContent,
  };
}