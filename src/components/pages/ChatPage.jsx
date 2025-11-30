/**
 * ChatPage.jsx v3.0e - Modal 2 sections + insertion chat après conversion
 * ✅ Bouton [+] avec menu contextuel
 * ✅ Menu : 🔗 Lien souvenir, 📷 Photo rapide, 📷✨ Photo souvenir
 * ✅ Upload rapide : file picker + compression + Drive upload
 * ✅ Upload avec conversion : modal 2 sections (moment + texte optionnel)
 * ✅ PhotoToMemoryModal : Section 1 (moment) + Section 2 (Note de photo)
 * ✅ Support champ jnnn pour nouveaux moments (valeur par défaut: "undefined")
 * ✅ Note de photo : titre + descriptif (max 500 chars) → posts avec category: 'user_added'
 * ✅ Photo simple (sans texte) → dayPhotos[]
 * ✅ Ajout réel au masterIndex avec nouvelle structure
 * ✅ Insertion automatique de la photo dans le chat après conversion
 * ✅ Preview photo importée avant envoi
 * ✅ Envoi message avec photoData (source: 'imported')
 * ✅ SessionInfoPanel (slide-in)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import LinkedContent from '../LinkedContent.jsx';
import SessionInfoPanel from '../SessionInfoPanel.jsx';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { dataManager } from '../../core/dataManager.js';
import { Send, Trash2, Edit, Camera, Link, FileText, MapPin, Image as ImageIcon, Tag, Plus, Sparkles } from 'lucide-react';
import PhotoViewer from '../PhotoViewer.jsx';
import ThemeModal from '../ThemeModal.jsx';
import PhotoToMemoryModal from '../PhotoToMemoryModal.jsx';
import CrossRefsWarningModal from '../CrossRefsWarningModal.jsx';  // ⭐ v2.9u : Modal 2 cross-refs
import DeletePhotoChoiceModal from '../DeletePhotoChoiceModal.jsx';  // ⭐ v2.9u : Modal choix Drive
import { openFilePicker, processAndUploadImage } from '../../utils/imageCompression.js';
import { logger } from '../../utils/logger.js';

export default function ChatPage({ navigationContext, onClearAttachment, onStartSelectionMode }) {
  const app = useAppState();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  const [pendingLink, setPendingLink] = useState(null);

  // ⭐ v3.0a : Menu d'attachement (lien/photo rapide/photo souvenir)
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

  const [viewerState, setViewerState] = useState({
    isOpen: false, photo: null
  });
  
  // ✨ État modal thèmes
  const [themeModal, setThemeModal] = useState({
    isOpen: false,
    currentThemes: []
  });

  // ⭐ v3.0c : État modal conversion photo → souvenir
  const [photoToMemoryModal, setPhotoToMemoryModal] = useState({
    isOpen: false,
    photoData: null,
    processedData: null  // ⭐ v2.9m : Données image traitées localement
  });

  // ✨ PHASE 19C : État panel infos
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // ⭐ v2.9s : Encadrement message lié depuis cross-refs modal
  const [targetMessageId, setTargetMessageId] = useState(null);

  // ⭐ v2.9u : Modal 2 cross-refs (cas 1B depuis MemoriesPage)
  const [deletePhotoModal, setDeletePhotoModal] = useState({
    isOpen: false,
    messageId: null,
    photoData: null,
    crossRefsWarnings: []
  });

  // ⭐ v2.9u : Modal choix Drive (cas 1A photo non utilisée ailleurs)
  const [deleteChoiceModal, setDeleteChoiceModal] = useState({
    isOpen: false,
    messageId: null,
    photoFilename: null,
    deleteFromDrive: false
  });

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const messageRefs = useRef({});  // ⭐ v2.9s : Refs pour messages individuels

  // Scroll vers dernier message
  useEffect(() => {
    if (messagesEndRef.current && !targetMessageId) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [app.currentChatSession?.notes, targetMessageId]);

  // ⭐ v2.9s : Détecter et scroller vers message cible depuis cross-refs modal
  useEffect(() => {
    const messageId = navigationContext?.returnContext?.targetMessageId;
    console.log('🎯 Detection targetMessageId:', messageId);

    if (messageId) {
      setTargetMessageId(messageId);
      console.log('✅ targetMessageId set:', messageId);

      // Scroller vers le message après un court délai (attendre render)
      setTimeout(() => {
        const messageElement = messageRefs.current[messageId];
        if (messageElement) {
          console.log('📜 Scroll vers message:', messageId);
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn('⚠️ Message element non trouvé:', messageId);
        }
      }, 300);

      // Retirer l'encadrement après 10 secondes (augmenté pour visibilité)
      setTimeout(() => {
        console.log('⏱️ Retrait cadre noir');
        setTargetMessageId(null);
      }, 10000);
    }
  }, [navigationContext?.returnContext?.targetMessageId, app.currentChatSession?.id]);

// ⭐ NOUVEAU : Nettoyer liens/photos en changeant de session
useEffect(() => {
  // Chaque fois qu'on change de chat, nettoyer l'état local
    console.log('🧹 ChatPage: Session changée, nettoyage des attachements');
  setPendingLink(null);
  setAttachedPhoto(null);
  setNewMessage('');
  setEditingMessage(null);
  setAttachmentMenuOpen(false); // ⭐ v3.0a : Fermer le menu aussi
}, [app.currentChatSession?.id]); // Dépendance : l'ID de la session actuelle

  // Détecter photo attachée ou lien depuis Memories
  useEffect(() => {
console.log('🔍 DEBUG navigationContext:', {
    pendingAttachment: navigationContext?.pendingAttachment,
    pendingLink: navigationContext?.pendingLink,
    previousPage: navigationContext?.previousPage
  });

    let hasCleared = false;
    
    // ✅ PHOTO : Toujours injecter (pas de condition previousPage)
    if (navigationContext?.pendingAttachment) {
      const { type, data } = navigationContext.pendingAttachment;
      
      if (type === 'photo') {
        console.log('📎 Photo reçue depuis Memories:', data);
        setAttachedPhoto(data);
        
        if (!hasCleared) {
          console.log('🧹 Clear pendingAttachment');
          onClearAttachment?.();
          hasCleared = true;
        }
      }
    }
    
    // ⭐ LIEN : Injecter lien sélectionné depuis Memories
    if (navigationContext?.pendingLink) {
      setPendingLink(navigationContext.pendingLink);

      // Nettoyer navigationContext pour éviter persistance entre sessions
      if (!hasCleared) {
        console.log('🧹 Clear navigationContext.pendingLink');
        onClearAttachment?.();
        hasCleared = true;
      }
    }
  }, [navigationContext?.pendingAttachment, navigationContext?.pendingLink]);
  

  // ⭐ MODIFIÉ : Focus amélioré avec ref
  useEffect(() => {
    if (pendingLink || attachedPhoto) {
      // Scroll vers le bas
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Focus textarea avec ref (plus fiable)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          console.log('✅ Focus textarea après sélection contenu');
        }
      }, 100); // Délai réduit à 100ms
    }
  }, [pendingLink, attachedPhoto]);
  
  // ⭐ Phase 18c : Mémoriser position scroll avant navigation
useEffect(() => {
  const saveScrollPosition = () => {
    // ⭐ C'est window qui scroll, pas un conteneur
    const scrollPosition = window.scrollY;
    sessionStorage.setItem(`chat_scroll_${app.currentChatSession?.id}`, scrollPosition);
    console.log('💾 Position scroll sauvegardée:', scrollPosition);
  };
  
  window.saveChatScrollPosition = saveScrollPosition;
  
  return () => {
    delete window.saveChatScrollPosition;
  };
}, [app.currentChatSession?.id]);

// ✨ PHASE 19C : Exposer handlers pour TopBar menu
useEffect(() => {
  window.chatPageHandlers = {
    toggleInfoPanel: () => setIsInfoPanelOpen(prev => !prev),
    openThemeModal: handleOpenThemeModal
  };
  
  return () => {
    delete window.chatPageHandlers;
  };
}, []);

// ⭐ Phase 18c : Restaurer position scroll au retour
useEffect(() => {
  const restoreScrollPosition = () => {
    const savedPosition = sessionStorage.getItem(`chat_scroll_${app.currentChatSession?.id}`);
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
        console.log('✅ Position scroll restaurée:', savedPosition);
        sessionStorage.removeItem(`chat_scroll_${app.currentChatSession?.id}`);
      }, 200);
    }
  };
  
  restoreScrollPosition();
}, [app.currentChatSession?.id]);

  // ========================================
  //  HANDLERS LIENS (⭐ NOUVEAU Phase 18b)
  // ========================================

  const handleOpenLinkPicker = () => {
    console.log('🔗 Ouverture sélecteur de liens');
    
    if (!onStartSelectionMode) {
      console.error('❌ onStartSelectionMode non fourni !');
      return;
    }
    
    // ⭐ MODIFIÉ : Plus besoin de callback, passage via navigationContext
    onStartSelectionMode('link', null);
  };

  const handleClearPendingLink = () => {
    console.log('🧹 Clear pending link');
    setPendingLink(null);
  };

  // ========================================
  // HANDLERS MENU ATTACHEMENT (⭐ v3.0a)
  // ========================================

  const handleToggleAttachmentMenu = () => {
    setAttachmentMenuOpen(prev => !prev);
  };

  const handleInsertLink = () => {
    setAttachmentMenuOpen(false);
    handleOpenLinkPicker();
  };

  const handleInsertQuickPhoto = async () => {
    logger.info('📷 Insert photo rapide - Ouverture file picker');
    setAttachmentMenuOpen(false);

    try {
      // 1. Ouvrir le file picker
      const files = await openFilePicker(false); // false = sélection unique
      const file = files[0];

      if (!file) {
        logger.warn('Aucun fichier sélectionné');
        return;
      }

      logger.info(`📸 Fichier sélectionné: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

      // ⭐ v2.9v FIX : Traitement LOCAL pour preview instantané (pas d'upload)
      const { processImageLocally } = await import('../../utils/imageCompression.js');

      // 2. Spinner court : Traitement LOCAL uniquement (pas d'upload)
      dataManager.setLoadingOperation(
        true,
        'Préparation de l\'image...',
        'Compression et génération du thumbnail',
        'spin'
      );

      // 3. Traiter l'image LOCALEMENT (ObjectURL pour preview instantané)
      const processedData = await processImageLocally(file, app.currentUser.id);

      logger.success('✅ Image traitée en mémoire:', processedData);

      // 4. Attacher avec les données locales pour preview instantané
      // L'upload se fera au moment de l'envoi du message
      setAttachedPhoto({
        processedData,  // ⭐ Données en mémoire (ObjectURLs)
        source: 'imported',
        filename: processedData.filename
      });

      // 5. Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // 6. Focus sur le textarea pour permettre d'ajouter un message
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);

    } catch (error) {
      logger.error('❌ Erreur traitement photo rapide:', error);

      // Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // Afficher message d'erreur
      if (error.message !== 'Sélection annulée') {
        alert(`Erreur lors du traitement de la photo:\n${error.message}`);
      }
    }
  };

  const handleInsertMemoryPhoto = async () => {
    logger.info('📷✨ Insert photo souvenir - Ouverture file picker');
    setAttachmentMenuOpen(false);

    try {
      // 1. Ouvrir le file picker
      const files = await openFilePicker(false);
      const file = files[0];

      if (!file) {
        logger.warn('Aucun fichier sélectionné');
        return;
      }

      logger.info(`📸 Fichier sélectionné: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

      // ⭐ v2.9m : Importer processImageLocally au lieu de processAndUploadImage
      const { processImageLocally } = await import('../../utils/imageCompression.js');

      // 2. Spinner court : Traitement LOCAL uniquement (pas d'upload)
      dataManager.setLoadingOperation(
        true,
        'Préparation de l\'image...',
        'Compression et génération du thumbnail',
        'spin'
      );

      // 3. Traiter l'image LOCALEMENT (en mémoire, pas d'upload Drive)
      const processedData = await processImageLocally(file, app.currentUser.id);

      logger.success('✅ Image traitée en mémoire:', processedData);

      // 4. Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // 5. Ouvrir le modal de conversion IMMÉDIATEMENT avec les données locales
      // ⭐ v2.9m : photoData = null (pas encore uploadée), processedData en mémoire
      setPhotoToMemoryModal({
        isOpen: true,
        photoData: null,  // Pas encore uploadée sur Drive
        processedData     // Données en mémoire (Blobs + ObjectURLs)
      });

    } catch (error) {
      logger.error('❌ Erreur traitement photo souvenir:', error);

      // Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // Afficher message d'erreur
      if (error.message !== 'Sélection annulée') {
        alert(`Erreur lors du traitement de la photo:\n${error.message}`);
      }
    }
  };

  // ⭐ v2.9m : Handler pour fermer le modal avec cleanup
  const handleClosePhotoToMemoryModal = async () => {
    const { processedData } = photoToMemoryModal;

    // Cleanup des ObjectURLs si annulation avec processedData
    if (processedData) {
      const { cleanupProcessedImage } = await import('../../utils/imageCompression.js');
      cleanupProcessedImage(processedData);
      logger.info('🧹 Annulation : ObjectURLs nettoyés');
    }

    setPhotoToMemoryModal({
      isOpen: false,
      photoData: null,
      processedData: null
    });
  };

  const handleConvertPhotoToMemory = async (conversionData) => {
    logger.info('🔄 Conversion photo → souvenir', conversionData);

    const { photoData, processedData } = photoToMemoryModal;

    // ⭐ v2.9m : Gérer les deux cas (ancien flow + nouveau flow)
    if (!photoData && !processedData) {
      logger.error('❌ Pas de photo à convertir');
      return;
    }

    try {
      let finalPhotoData = photoData;

      // ⭐ v2.9m : Si on a des données traitées localement, les uploader d'abord
      if (processedData) {
        logger.info('☁️ Upload de l\'image traitée localement vers Drive...');

        // Importer uploadProcessedImage
        const { uploadProcessedImage } = await import('../../utils/imageCompression.js');

        // Spinner : Upload vers Drive
        dataManager.setLoadingOperation(
          true,
          'Envoi vers le cloud...',
          'Upload de l\'image vers Google Drive',
          'spin'
        );

        // Upload vers Drive
        finalPhotoData = await uploadProcessedImage(processedData, app.currentUser.id);

        logger.success('✅ Upload terminé:', finalPhotoData);
      }

      // Spinner : Création du souvenir
      dataManager.setLoadingOperation(
        true,
        'Création du souvenir...',
        'Mise à jour du master index et sauvegarde sur Drive',
        'monkey'
      );

      // ✅ v3.0d : Appel de la méthode réelle d'ajout au masterIndex
      const result = await dataManager.addImportedPhotoToMasterIndex(finalPhotoData, conversionData);

      // Désactiver le spinner
      dataManager.setLoadingOperation(false);

      if (!result.success) {
        throw new Error(result.error || 'Échec de la conversion');
      }

      // ⭐ v2.8f : Créer lien(s) ContentLinks automatique (photo/note → session)
      if (app.currentChatSession && result.contentId && result.contentType && window.contentLinks) {
        try {
          // Lien principal (post ou photo)
          await window.contentLinks.addLink({
            sessionId: app.currentChatSession.id,
            messageId: `import_${Date.now()}`,
            contentType: result.contentType,  // 'post' ou 'photo'
            contentId: result.contentId,
            contentTitle: result.contentType === 'post'
              ? (conversionData.noteTitle || 'Note de photo')
              : finalPhotoData.filename,
            linkedBy: app.currentUser
          });
          logger.success(`🔗 Lien ContentLinks créé: ${result.contentType} → session ${app.currentChatSession.id}`);

          // ⭐ v2.8f : Si c'est un post (Note de photo), créer AUSSI un lien pour la photo
          if (result.contentType === 'post' && finalPhotoData.google_drive_id) {
            await window.contentLinks.addLink({
              sessionId: app.currentChatSession.id,
              messageId: `import_photo_${Date.now()}`,
              contentType: 'photo',
              contentId: finalPhotoData.google_drive_id,
              contentTitle: finalPhotoData.filename,
              linkedBy: app.currentUser
            });
            logger.success(`🔗 Lien photo supplémentaire créé: ${finalPhotoData.google_drive_id}`);
          }
        } catch (linkError) {
          logger.error('❌ Erreur création lien ContentLinks:', linkError);
          // Non-bloquant
        }
      }

      // ⭐ v3.0e : Insérer la photo dans le chat après conversion réussie
      setAttachedPhoto(finalPhotoData);
      logger.info('📸 Photo attachée au chat après conversion');

      // Feedback
      if (window.chatPageActions?.showFeedback) {
        const message = conversionData.newMoment
          ? '✅ Nouveau moment créé et photo ajoutée !'
          : '✅ Photo ajoutée au moment !';
        window.chatPageActions.showFeedback(message);
      }

      // ⭐ v2.9m : Cleanup des ObjectURLs si on a utilisé processedData
      if (processedData) {
        const { cleanupProcessedImage } = await import('../../utils/imageCompression.js');
        cleanupProcessedImage(processedData);
        logger.debug('🧹 ObjectURLs nettoyés après upload réussi');
      }

      // Fermer le modal
      setPhotoToMemoryModal({
        isOpen: false,
        photoData: null,
        processedData: null
      });

      logger.success('🎉 Conversion terminée avec succès !');

      // ⭐ v2.8f : Scroll vers le bas pour focusser sur la textarea
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (error) {
      logger.error('❌ Erreur conversion photo:', error);
      dataManager.setLoadingOperation(false);
      alert(`Erreur lors de la conversion:\n${error.message}`);
    }
  };

  // ========================================
  // HANDLERS THÈMES
  // ========================================

  const handleOpenThemeModal = useCallback(() => {
    if (!app.currentChatSession) return;
    
    // Récupérer thèmes actuels de la session
    const sessionKey = `session:${app.currentChatSession.id}`;
    const currentThemes = window.themeAssignments?.getThemesForContent(sessionKey) || [];
    
    console.log('🏷️ Ouverture modal thèmes session:', sessionKey, currentThemes);
    
    setThemeModal({
      isOpen: true,
      currentThemes: currentThemes
    });
  }, [app.currentChatSession]);

  const handleCloseThemeModal = useCallback(() => {
    setThemeModal({
      isOpen: false,
      currentThemes: []
    });
  }, []);

  const handleSaveThemes = useCallback(async (selectedThemes) => {
    if (!app.currentChatSession || !app.currentUser) return;

    // ✨ Activer le spinner
    dataManager.setLoadingOperation(true, 'Assignation des thèmes...', 'Enregistrement sur Google Drive', 'monkey');

    const sessionKey = `session:${app.currentChatSession.id}`;

    try {
      await window.themeAssignments.assignThemes(
        sessionKey,
        selectedThemes,
        app.currentUser.id
      );

      console.log('✅ Thèmes session sauvegardés:', selectedThemes);

      handleCloseThemeModal();

      // Feedback visuel
      if (window.chatPageActions?.showFeedback) {
        window.chatPageActions.showFeedback('Thèmes sauvegardés');
      }

      // ✨ Désactiver le spinner
      dataManager.setLoadingOperation(false);
    } catch (error) {
      console.error('❌ Erreur sauvegarde thèmes:', error);
      alert('Impossible de sauvegarder les thèmes');
      // ✨ Désactiver le spinner en cas d'erreur
      dataManager.setLoadingOperation(false);
    }
  }, [app.currentChatSession, app.currentUser, handleCloseThemeModal]);
  
  useEffect(() => {
    window.chatPageActions = {
      showFeedback: (message) => {
        setFeedbackMessage(message);
        setTimeout(() => {
          setFeedbackMessage(null);
        }, 2500);
      },
      openThemeModal: handleOpenThemeModal  // ❌ PROBLÈME ICI
    };
    return () => {
      delete window.chatPageActions;
    };
  }, [handleOpenThemeModal]);

  // ========================================
  // HANDLERS MESSAGES
  // ========================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedPhoto && !pendingLink) return;

    try {
      // ⭐ v2.9v : Si photo avec processedData, uploader AVANT envoi message
      let finalPhotoData = attachedPhoto;

      if (attachedPhoto?.processedData) {
        logger.info('📤 Upload photo vers Drive avant envoi message');

        const { uploadProcessedImage } = await import('../../utils/imageCompression.js');

        // Spinner pendant l'upload
        dataManager.setLoadingOperation(
          true,
          'Upload de la photo...',
          'Envoi vers Google Drive',
          'spin'
        );

        try {
          // Upload et récupération des métadonnées Drive
          const uploadedPhotoData = await uploadProcessedImage(
            attachedPhoto.processedData,
            app.currentUser.id
          );

          logger.success('✅ Photo uploadée:', uploadedPhotoData);

          // Remplacer par les vraies données Drive
          finalPhotoData = uploadedPhotoData;

          // Cleanup des ObjectURLs
          const { cleanupProcessedImage } = await import('../../utils/imageCompression.js');
          cleanupProcessedImage(attachedPhoto.processedData);

        } catch (uploadError) {
          logger.error('❌ Erreur upload photo:', uploadError);
          dataManager.setLoadingOperation(false);
          alert(`Erreur lors de l'upload de la photo:\n${uploadError.message}`);
          return; // Annuler l'envoi du message
        }

        dataManager.setLoadingOperation(false);
      }

      // ⭐ MODIFIÉ : Support linkedContent
      const messageData = {
        content: newMessage.trim(),
        linkedContent: pendingLink ? {
          type: pendingLink.type,
          id: pendingLink.id,
          title: pendingLink.title
        } : null
      };

      await app.addMessageToSession(
        app.currentChatSession.id,
        messageData.content,
        finalPhotoData,  // ⭐ v2.9v : Photo uploadée ou null
        messageData.linkedContent
      );

      setNewMessage('');
      setAttachedPhoto(null);
      setPendingLink(null);
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    // ✨ Activer le spinner
    dataManager.setLoadingOperation(true, 'Modification du message...', 'Enregistrement sur Google Drive', 'spin');

    try {
      const updatedSession = {
        ...app.currentChatSession,
        notes: app.currentChatSession.notes.map(note =>
          note.id === editingMessage
            ? { ...note, content: editContent.trim(), edited: true }
            : note
        )
      };

      await app.updateSession(updatedSession);
      setEditingMessage(null);
      setEditContent('');

      // ✨ Désactiver le spinner
      dataManager.setLoadingOperation(false);
    } catch (error) {
      console.error('❌ Erreur modification message:', error);
      // ✨ Désactiver le spinner en cas d'erreur
      dataManager.setLoadingOperation(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
  const messageToDelete = app.currentChatSession.notes.find(m => m.id === messageId);
  if (!messageToDelete) return;

  const hasPhoto = messageToDelete?.photoData;
  const isImportedPhoto = hasPhoto && messageToDelete.photoData.source === 'imported';
  const cameFromModal = navigationContext?.returnContext?.returnPage === 'memories';

  // CAS 2 : Venu de MemoriesPage Modal 2
  if (cameFromModal) {
    // Simple confirmation
    if (!confirm('Supprimer ce message ?')) return;

    // Supprimer le message
    const result = await performMessageDeletion(messageId, false, true);

    // Auto-retour vers MemoriesPage
    if (result?.success) {
      setFeedbackMessage('Retour à la page Souvenirs...');
      setTimeout(() => {
        dataManager.updateState({
          currentPage: 'memories',
          navigationContext: {
            previousPage: 'chat',
            returnContext: {
              ...navigationContext.returnContext,
              reopenModal2: true
            }
          }
        });
      }, 800);
    }
    return;
  }

  // CAS 1 : ChatPage NORMAL
  else if (isImportedPhoto) {
    const photoId = messageToDelete.photoData.google_drive_id || messageToDelete.photoData.filename;

    // Vérifier cross-références (hors session actuelle)
    const momentRefs = dataManager.checkPhotoCrossReferences(photoId, null);
    const allSessionRefs = dataManager.checkPhotoInSessions(photoId);
    const sessionRefs = allSessionRefs.filter(ref => ref.sessionId !== app.currentChatSession.id);

    const hasCrossRefs = momentRefs.length > 0 || sessionRefs.length > 0;

    // CAS 1A : Photo NON utilisée ailleurs
    if (!hasCrossRefs) {

      // Ouvrir modal de choix
      setDeleteChoiceModal({
        isOpen: true,
        messageId,
        photoFilename: messageToDelete.photoData.filename,
        deleteFromDrive: false
      });
      return;
    }

    // CAS 1B : Photo utilisée ailleurs
    else {
      // Simple confirmation (suppression message seul, photo reste)
      if (!confirm('Supprimer ce message ?')) return;
    }
  }

  // CAS 1C : Message normal (sans photo importée)
  else {
    if (!confirm('Supprimer ce message ?')) return;
  }

  // ✨ Activer le spinner
  dataManager.setLoadingOperation(true, 'Suppression du message...', 'Enregistrement sur Google Drive', 'monkey');

  try {
    const updatedSession = { ...app.currentChatSession };
    const hasLinkedContent = messageToDelete?.linkedContent;

    // Supprimer le message
    updatedSession.notes = updatedSession.notes.filter(note => note.id !== messageId);

    await app.updateSession(updatedSession);

    // Nettoyer ContentLinks
    if (window.contentLinks && (hasLinkedContent || hasPhoto)) {
      if (hasPhoto) {
        const photo = messageToDelete.photoData;
        if (photo.google_drive_id) {
          await window.contentLinks.removeLink(updatedSession.id, 'photo', photo.google_drive_id);
        }
        if (photo.filename && photo.filename !== photo.google_drive_id) {
          await window.contentLinks.removeLink(updatedSession.id, 'photo', photo.filename);
        }
      }

      if (hasLinkedContent) {
        await window.contentLinks.removeLink(
          updatedSession.id,
          messageToDelete.linkedContent.type,
          messageToDelete.linkedContent.id
        );
      }

      // Forcer re-render
      const currentSessions = dataManager.getState().sessions;
      dataManager.updateState({ sessions: [...currentSessions] });
    }

    // Auto-retour vers MemoriesPage si venu de Modal 2
    if (cameFromModal) {
      dataManager.setLoadingOperation(false);
      setFeedbackMessage('Retour à la page Souvenirs...');

      // Attendre 800ms pour que l'utilisateur voie le message
      setTimeout(() => {
        // Retourner à MemoriesPage avec flag pour ré-ouvrir Modal 2
        app.navigateTo('memories', {
          previousPage: 'chat',
          returnContext: {
            ...navigationContext.returnContext,
            reopenModal2: true  // ⭐ Flag pour ré-ouvrir Modal 2 avec cross-refs actualisées
          }
        });
      }, 800);
      return;  // Sortir immédiatement
    }

    // ✨ Désactiver le spinner
    dataManager.setLoadingOperation(false);

  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    // ✨ Désactiver le spinner en cas d'erreur
    dataManager.setLoadingOperation(false);
  }
};

// Handlers pour modal choix Drive
const handleDeleteMessageOnly = async () => {
  const { messageId } = deleteChoiceModal;
  const cameFromModal = navigationContext?.returnContext?.returnPage === 'memories';

  setDeleteChoiceModal({ isOpen: false, messageId: null, photoFilename: null, deleteFromDrive: false });

  const result = await performMessageDeletion(messageId, false, cameFromModal);

  // Auto-retour vers MemoriesPage si venu de Modal 2
  if (result?.success && cameFromModal) {
    setFeedbackMessage('Retour à la page Souvenirs...');
    setTimeout(() => {
      dataManager.updateState({
        currentPage: 'memories',
        navigationContext: {
          previousPage: 'chat',
          returnContext: {
            ...navigationContext.returnContext,
            reopenModal2: true
          }
        }
      });
    }, 800);
  }
};

const handleDeleteMessageAndDrive = async () => {
  const { messageId } = deleteChoiceModal;
  const cameFromModal = navigationContext?.returnContext?.returnPage === 'memories';

  setDeleteChoiceModal({ isOpen: false, messageId: null, photoFilename: null, deleteFromDrive: false });

  const result = await performMessageDeletion(messageId, true, cameFromModal);

  // Auto-retour vers MemoriesPage si venu de Modal 2
  if (result?.success && cameFromModal) {
    setFeedbackMessage('Retour à la page Souvenirs...');
    setTimeout(() => {
      dataManager.updateState({
        currentPage: 'memories',
        navigationContext: {
          previousPage: 'chat',
          returnContext: {
            ...navigationContext.returnContext,
            reopenModal2: true
          }
        }
      });
    }, 800);
  }
};

// ⭐ v2.9u : Fonction commune de suppression (appelée par les handlers)
const performMessageDeletion = async (messageId, deleteFromDrive = false, cameFromModal = false) => {
  const messageToDelete = app.currentChatSession.notes.find(m => m.id === messageId);
  if (!messageToDelete) return;

  const photoDataBackup = messageToDelete.photoData ? { ...messageToDelete.photoData } : null;
  const hasLinkedContent = messageToDelete?.linkedContent;
  const hasPhoto = !!photoDataBackup;

  dataManager.setLoadingOperation(true, 'Suppression du message...', 'Enregistrement sur Google Drive', 'monkey');

  try {
    const updatedSession = { ...app.currentChatSession };

    // Nettoyer ContentLinks AVANT deletePhoto
    if (window.contentLinks && (hasLinkedContent || hasPhoto)) {
      if (hasPhoto && photoDataBackup) {
        if (photoDataBackup.google_drive_id) {
          await window.contentLinks.removeLink(updatedSession.id, 'photo', photoDataBackup.google_drive_id);
        }
        if (photoDataBackup.filename && photoDataBackup.filename !== photoDataBackup.google_drive_id) {
          await window.contentLinks.removeLink(updatedSession.id, 'photo', photoDataBackup.filename);
        }
      }
      if (hasLinkedContent) {
        await window.contentLinks.removeLink(
          updatedSession.id,
          messageToDelete.linkedContent.type,
          messageToDelete.linkedContent.id
        );
      }
    }

    // Supprimer message EN MÉMOIRE avant deletePhoto
    updatedSession.notes = updatedSession.notes.filter(note => note.id !== messageId);

    // Mettre à jour appState temporairement
    dataManager.updateState({
      sessions: app.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
    });

    // Suppression Drive si demandé
    if (deleteFromDrive && hasPhoto && photoDataBackup.source === 'imported') {
      const photoId = photoDataBackup.google_drive_id || photoDataBackup.filename;

      const result = await dataManager.deletePhoto(
        null,                        // momentId (null car photo de chat)
        photoId,                     // photoId
        photoDataBackup.filename,    // filename
        true,                        // deleteFromDrive = true
        false                        // showSpinner = false (déjà affiché)
      );

      if (result && !result.success) {
        console.error('Erreur suppression Drive:', result.reason);
        dataManager.setLoadingOperation(false);
        alert(`Erreur suppression Drive: ${result.reason}`);
        return;
      }
    }

    // Sauvegarder session
    await app.updateSession(updatedSession);

    // Forcer re-render
    if (window.contentLinks) {
      const currentSessions = dataManager.getState().sessions;
      dataManager.updateState({ sessions: [...currentSessions] });
    }

    dataManager.setLoadingOperation(false);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    dataManager.setLoadingOperation(false);
    return { success: false, error };
  }
};

// ⭐ v2.9t TÂCHE 2 : Handlers pour modal suppression photo importée (OBSOLÈTE - gardé pour compatibilité)
const handleDeletePhotoMemoryOnly = async () => {
  console.log('📝 Suppression message (mémoire seulement)');
  const { messageId } = deletePhotoModal;

  // Fermer le modal
  setDeletePhotoModal({ isOpen: false, messageId: null, photoData: null, crossRefsWarnings: [] });

  // Exécuter suppression normale (sans confirm car déjà validé par modal)
  dataManager.setLoadingOperation(true, 'Suppression du message...', 'Enregistrement sur Google Drive', 'monkey');

  try {
    const updatedSession = { ...app.currentChatSession };
    const messageToDelete = updatedSession.notes.find(m => m.id === messageId);

    // Supprimer le message
    updatedSession.notes = updatedSession.notes.filter(note => note.id !== messageId);
    await app.updateSession(updatedSession);

    // Nettoyer ContentLinks si nécessaire
    if (window.contentLinks && messageToDelete?.photoData) {
      const photo = messageToDelete.photoData;
      if (photo.google_drive_id) {
        await window.contentLinks.removeLink(updatedSession.id, 'photo', photo.google_drive_id);
      }
      if (photo.filename && photo.filename !== photo.google_drive_id) {
        await window.contentLinks.removeLink(updatedSession.id, 'photo', photo.filename);
      }

      // Forcer re-render
      const currentSessions = dataManager.getState().sessions;
      dataManager.updateState({ sessions: [...currentSessions] });
    }

    dataManager.setLoadingOperation(false);
  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    dataManager.setLoadingOperation(false);
  }
};

const handleDeletePhotoWithDrive = async () => {
  console.log('🗑️ Suppression message + Drive (désactivé si cross-refs)');
  // Ce bouton sera grisé dans le modal tant qu'il y a des cross-refs
  // Pour l'instant, on ne fait rien car les cross-refs doivent être nettoyées d'abord
  alert('Cette fonctionnalité nécessite de supprimer toutes les références aux photos d\'abord.');
};

// ========================================
// HANDLERS NAVIGATION CONTENU (⭐ PHASE 19E)
// ========================================

/**
 * 🔍 NAVIGATION LOCALE : Ouvrir PhotoViewer dans ChatPage
 * Utilisé par : LinkedContent (bouton Zoom sur photos), PhotoMessage
 * NE CHANGE PAS de page, reste dans Chat
 */
const handleOpenPhotoLocal = (linkedContent) => {
  console.log('🔍 Ouverture photo locale:', linkedContent);
  
  // 1. Trouver le moment parent de la photo
  const parentMoment = findParentMoment(linkedContent.id);
  
  if (parentMoment) {
    // 2. Construire galerie complète (photos moment + photos posts)
    const allPhotos = [
      ...(parentMoment.dayPhotos || []),
      ...(parentMoment.postPhotos || [])
    ];
    
    // 3. Trouver photo par google_drive_id OU filename
    const photoIndex = allPhotos.findIndex(p => 
      p.google_drive_id === linkedContent.id || 
      p.filename === linkedContent.id
    );
    
    // 4. Déterminer la photo cible
    const targetPhoto = photoIndex >= 0 ? allPhotos[photoIndex] : {
      google_drive_id: linkedContent.google_drive_id || linkedContent.id,
      url: linkedContent.url,
      width: linkedContent.width,
      height: linkedContent.height,
      mime_type: linkedContent.mime_type,
      type: linkedContent.photoType,
      filename: linkedContent.title || 'Photo',
    };
    
    console.log('🎯 Photo cible:', photoIndex >= 0 ? `${photoIndex + 1}/${allPhotos.length}` : 'Photo seule');
    
    // 5. Ouvrir visionneuse locale
    setViewerState({
      isOpen: true,
      photo: targetPhoto,
      gallery: allPhotos,
      contextMoment: parentMoment,
      returnToChat: true
    });
    
  } else {
    // Fallback : Photo sans moment parent
    console.warn('⚠️ Moment parent introuvable, photo isolée');
    
    const standalonePhoto = {
      google_drive_id: linkedContent.google_drive_id || linkedContent.id,
      url: linkedContent.url,
      width: linkedContent.width,
      height: linkedContent.height,
      mime_type: linkedContent.mime_type,
      type: linkedContent.photoType,
      filename: linkedContent.title || 'Photo',
    };
    
    setViewerState({
      isOpen: true,
      photo: standalonePhoto,
      gallery: [standalonePhoto],
      contextMoment: null,
      returnToChat: true
    });
  }
};

/**
 * ⭐ v2.8e : Vérifier si une photo est linkée à du contenu (moment/post)
 * Utilisé pour afficher les icônes Zoom/Localiser
 */
const isPhotoLinkedToContent = (photoData) => {
  if (!window.contentLinks || !photoData) return false;

  // Vérifier par google_drive_id OU filename
  const photoId = photoData.google_drive_id || photoData.filename;
  if (!photoId) return false;

  try {
    const links = window.contentLinks.getLinksForContent('photo', photoId);
    return links && links.length > 0;
  } catch (error) {
    console.error('Erreur vérification liens photo:', error);
    return false;
  }
};

/**
 * ⭐ v2.9l2 : Trouver le momentId d'une photo importée dans le masterIndex
 * Retourne le momentId si la photo est associée à un moment, sinon null
 */
const findPhotoMomentId = (photoData, masterIndex) => {
  if (!photoData || !masterIndex?.moments) return null;

  const photoId = photoData.google_drive_id || photoData.filename;
  if (!photoId) return null;

  // Chercher dans tous les moments
  for (const moment of masterIndex.moments) {
    // Chercher dans dayPhotos
    if (moment.dayPhotos) {
      const foundInDay = moment.dayPhotos.find(p =>
        p.google_drive_id === photoId || p.filename === photoId
      );
      if (foundInDay) {
        console.log(`📍 Photo trouvée dans moment ${moment.id} (dayPhotos)`);
        return moment.id;
      }
    }

    // Chercher dans les photos des posts
    if (moment.posts) {
      for (const post of moment.posts) {
        if (post.photos) {
          const foundInPost = post.photos.find(p =>
            p.google_drive_id === photoId || p.filename === photoId
          );
          if (foundInPost) {
            console.log(`📍 Photo trouvée dans moment ${moment.id} (post photos)`);
            return moment.id;
          }
        }
      }
    }
  }

  return null;
};

/**
 * 📍 NAVIGATION GLOBALE : Aller dans Memories et localiser le contenu
 * Utilisé par : LinkedContent (bouton Localiser), SessionInfoPanel
 *
 * Comportements par type :
 * - Moment : Ouvrir le moment dans Memories
 * - Post : Ouvrir parent moment + scroll vers post
 * - Photo : Trouver parent moment + ouvrir PhotoViewer là-bas
 */
const handleNavigateToMemories = (linkedContent) => {
  console.log('📍 Navigation vers Memories:', linkedContent);
  
  // Sauvegarder position scroll pour retour
  if (window.saveChatScrollPosition) {
    window.saveChatScrollPosition();
  }
  
  // Utiliser le système de navigation global (App.jsx)
  if (window.navigateToContentFromChat) {
    window.navigateToContentFromChat(linkedContent);
  } else {
    console.error('❌ window.navigateToContentFromChat non disponible');
  }
};

/**
 * 🎯 HANDLER UNIFIÉ : Appelé par SessionInfoPanel
 * Route vers navigation Memories pour tous les types
 */
const handleNavigateFromPanel = (contentType, contentId) => {
  // Récupérer les métadonnées complètes du contenu
  let linkedContent = { type: contentType, id: contentId };
  
  // Pour les photos, enrichir avec les métadonnées Drive si disponibles
  if (contentType === 'photo' && app.masterIndex?.moments) {
    for (const moment of app.masterIndex.moments) {
      // Chercher dans dayPhotos
      const dayPhoto = moment.dayPhotos?.find(p => 
        p.filename === contentId || p.google_drive_id === contentId
      );
      if (dayPhoto) {
        linkedContent = {
          ...linkedContent,
          google_drive_id: dayPhoto.google_drive_id,
          url: dayPhoto.url,
          width: dayPhoto.width,
          height: dayPhoto.height,
          mime_type: dayPhoto.mime_type,
          photoType: dayPhoto.type,
          title: dayPhoto.filename
        };
        break;
      }
      
      // Chercher dans postPhotos
      if (moment.posts) {
        for (const post of moment.posts) {
          const postPhoto = post.photos?.find(p => 
            p.filename === contentId || p.google_drive_id === contentId
          );
          if (postPhoto) {
            linkedContent = {
              ...linkedContent,
              google_drive_id: postPhoto.google_drive_id,
              url: postPhoto.url,
              width: postPhoto.width,
              height: postPhoto.height,
              mime_type: postPhoto.mime_type,
              photoType: postPhoto.type,
              title: postPhoto.filename
            };
            break;
          }
        }
      }
    }
  }
  
  handleNavigateToMemories(linkedContent);
};


// Helper : Trouver moment parent d'une photo
const findParentMoment = (photoFilename) => {
  if (!app.masterIndex?.moments) return null;
  
  for (const moment of app.masterIndex.moments) {
    // Chercher dans dayPhotos
    if (moment.dayPhotos?.some(p => p.filename === photoFilename)) {
      return moment;
    }
    
    // Chercher dans les photos de posts
    if (moment.posts) {
      for (const post of moment.posts) {
        if (post.photos?.some(p => p.filename === photoFilename)) {
          return moment;
        }
      }
    }
  }
  
  return null;
};



  // ========================================
  // PHOTO VIEWER
  // ========================================

  const openPhotoViewer = (photo) => {
    setViewerState({ isOpen: true, photo });
  };

  const closePhotoViewer = () => {
    setViewerState({ isOpen: false, photo: null });
  };

  // ========================================
  // HELPERS ICÔNES LIENS
  // ========================================

  const getLinkIcon = (type) => {
    switch(type) {
      case 'moment': return <MapPin className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      default: return <Link className="w-4 h-4" />;
    }
  };

  const getLinkColor = (type) => {
    switch(type) {
      case 'moment': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'post': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'photo': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // ========================================
  // RENDER
  // ========================================

// ⭐ DEBUG linkedContent
useEffect(() => {
  if (app.currentChatSession?.notes) {
    const messagesWithLinks = app.currentChatSession.notes.filter(m => m.linkedContent);
    if (messagesWithLinks.length > 0) {
      console.log('🔗 Messages avec liens:', messagesWithLinks.map(m => ({
  id: m.id,
  linkedContent: m.linkedContent,
  // ⭐ Voir la structure complète
  linkedContentFull: JSON.stringify(m.linkedContent, null, 2)
})));
    }
  }
}, [app.currentChatSession?.notes]);




  if (!app.currentChatSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune session de chat</h2>
        <p className="text-gray-600 mb-6">
          Sélectionnez une session depuis la page Sessions pour commencer une conversation.
        </p>
      </div>
    );
  }

  const getUserBubbleStyle = (author) => {
    const isCurrentUser = author === app.currentUser?.id;
    const style = userManager.getUserStyle(author);

    if (isCurrentUser) {
      return `${style.strong_bg} text-white rounded-l-lg rounded-tr-lg shadow-lg`;
    } else {
      return `${style.bg} ${style.text} rounded-r-lg rounded-tl-lg border ${style.border}`;
    }
  };  

  const getCurrentUserStyle = (author) => {
    if (author === 'duo') {
      return 'mx-auto';
    } else if (author === app.currentUser?.id) {
      return 'ml-auto';
    } else {
      return 'mr-auto';
    }
  };
  
// ========================================
// COMPOSANT LinkPhotoPreview
// ========================================

function LinkPhotoPreview({ photo }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      if (!photo) return;
      
      try {
        const url = await window.photoDataV2?.resolveImageUrl(photo, true);
        if (isMounted && url && !url.startsWith('data:image/svg+xml')) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('❌ Erreur preview photo lien:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    resolveUrl();
    return () => { isMounted = false; };
  }, [photo]);

  if (loading) {
    return (
      <div className="w-48 h-32 bg-gray-200 animate-pulse flex items-center justify-center">
        <Camera className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    // ⭐ MODIFIÉ : max-w-48 au lieu de w-full
    <div className="max-w-48 max-h-32 overflow-hidden bg-gray-100 rounded-t-lg">
      <img
        src={imageUrl}
        alt={photo.title}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
  
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">

      {/* Zone des messages */}
      <div 
      	ref={messagesContainerRef} 
      	className="flex-1 overflow-y-auto p-4 space-y-3">
        
        {(!app.currentChatSession.notes || app.currentChatSession.notes.length === 0) && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💭</div>
            <p className="text-gray-500">
              Aucun message pour le moment. Commencez la conversation !
            </p>
          </div>
        )}

        {app.currentChatSession.notes?.map((message) => {
          // ⭐ v2.8f : Détecter si photo nécessite icônes Zoom/Localiser
          const hasInteractivePhoto = message.photoData && (
            message.id.endsWith('-origin') ||
            isPhotoLinkedToContent(message.photoData) ||
            message.photoData.source === 'imported'  // ⭐ Photos importées aussi
          );

          // ⭐ v2.8f : Séparer zones hover pour TOUS messages avec photo+texte
          const shouldSeparateHoverZones = message.photoData && message.content;

          // ⭐ v2.9s : Déterminer si ce message doit être encadré
          const isTargeted = message.id === targetMessageId;

          // ⭐ Modif 2 : Auto-afficher boutons Éditer/Supprimer si message ciblé
          const buttonOpacity = isTargeted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

          if (isTargeted) {
            console.log('🎯 Message CIBLÉ détecté:', message.id, 'hasPhoto:', !!message.photoData);
          }

          return (
          <div
            key={message.id}
            ref={(el) => {
              if (el) messageRefs.current[message.id] = el;
              else delete messageRefs.current[message.id];
            }}
            className={`flex ${getCurrentUserStyle(message.author)} max-w-xs sm:max-w-md lg:max-w-lg`}
          >
            <div className={shouldSeparateHoverZones ? "relative" : "group relative"}>

              <div className={`px-4 py-3 ${getUserBubbleStyle(message.author)} transition-all duration-200`}>
                
                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm resize-none"
                      rows="3"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Sauver
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                  
                    {/* ⭐ Lien enrichi */}
                    {/* ⭐ PHASE 19E : Double handler (local + navigation) */}
    {message.linkedContent && (
      <div className="w-full max-w-full overflow-hidden mb-2">
        <LinkedContent 
          linkedContent={message.linkedContent}
          onOpenLocal={handleOpenPhotoLocal}
          onNavigate={handleNavigateToMemories}
          masterIndex={app.masterIndex}
        />
      </div>
    )}
    
    {/* Photo si présente */}
{message.photoData && (() => {
  // ⭐ v2.9l2 : Enrichir photoData avec momentId depuis masterIndex
  const enrichedPhotoData = {
    ...message.photoData,
    momentId: message.photoData.momentId || findPhotoMomentId(message.photoData, app.masterIndex)
  };

  return hasInteractivePhoto ? (
    // ⭐ v2.8f : Photo interactive (origin/linkée/importée) = LinkedContent avec Zoom/Localiser
    // ⭐ v2.9t : Cadre NOIR épais + animation si message ciblé depuis cross-refs modal
    <div className={`w-full max-w-full overflow-hidden mb-2 transition-all duration-300 ${
      isTargeted ? 'ring-8 ring-black dark:ring-white rounded-xl shadow-2xl animate-pulse' : ''
    }`}>
      <LinkedContent
        linkedContent={{
          type: 'photo',
          id: enrichedPhotoData.filename || enrichedPhotoData.google_drive_id,
          title: enrichedPhotoData.filename,
          google_drive_id: enrichedPhotoData.google_drive_id,
          url: enrichedPhotoData.url,
          width: enrichedPhotoData.width,
          height: enrichedPhotoData.height,
          mime_type: enrichedPhotoData.mime_type,
          photoType: enrichedPhotoData.type,
          source: enrichedPhotoData.source,  // ⭐ v2.9l : Pour déterminer la bordure
          momentId: enrichedPhotoData.momentId  // ⭐ v2.9l2 : Association enrichie depuis masterIndex
        }}
        onOpenLocal={handleOpenPhotoLocal}
        onNavigate={handleNavigateToMemories}
        masterIndex={app.masterIndex}
      />
    </div>
  ) : (
    // Photo normale sans interaction
    // ⭐ v2.9t : Cadre NOIR épais + animation si message ciblé
    <div className={`transition-all duration-300 ${
      isTargeted ? 'ring-8 ring-black dark:ring-white rounded-xl shadow-2xl animate-pulse' : ''
    }`}>
      <PhotoMessage
        photo={enrichedPhotoData}
        onPhotoClick={openPhotoViewer}
      />
    </div>
  );
})()}
    
    {/* Texte - ⭐ v2.8f : Groupe séparé si photo+texte */}
    {message.content && (
      <div className={shouldSeparateHoverZones ? "group relative" : ""}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Badge modifié */}
        {message.edited && (
          <div className="text-xs opacity-70 italic mt-1">modifié</div>
        )}

        {/* ⭐ v2.8f : Boutons édition/suppression DANS le groupe texte si zones séparées */}
        {shouldSeparateHoverZones && app.currentUser && message.author === app.currentUser.id && (
          <div className={`absolute top-0 right-0 ${buttonOpacity} transition-opacity bg-white dark:bg-gray-700 rounded shadow-lg p-1 -mr-2 -mt-2`}>
            <button
              onClick={() => handleEditMessage(message)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              title="Modifier"
            >
              <Edit className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => handleDeleteMessage(message.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded ml-1"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>
    )}

    {/* ⭐ v2.8f : Boutons HORS du groupe texte si pas de séparation */}
    {!shouldSeparateHoverZones && app.currentUser && message.author === app.currentUser.id && (
      <div className={`absolute top-0 right-0 ${buttonOpacity} transition-opacity bg-white dark:bg-gray-700 rounded shadow-lg p-1 -mr-2 -mt-2`}>
        <button
          onClick={() => handleEditMessage(message)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          title="Modifier"
        >
          <Edit className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={() => handleDeleteMessage(message.id)}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded ml-1"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
        </button>
      </div>
    )}
  </>
)}
              </div>
            </div>
          </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
<div className="bg-white dark:bg-gray-800 border-t border-gray-200 p-4 flex-shrink-0">
  
  {/* ⭐ Preview lien (si présent) */}
{pendingLink && (
  <div className={`mb-3 rounded-lg border-2 overflow-hidden ${getLinkColor(pendingLink.type)}`}>
    
    {/* ⭐ Preview photo avec thumbnail */}
    {pendingLink.type === 'photo' && pendingLink.google_drive_id && (
      <LinkPhotoPreview photo={pendingLink} />
    )}
    
    {/* Infos + bouton retirer */}
    <div className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getLinkIcon(pendingLink.type)}
          <span className="font-medium truncate">{pendingLink.title}</span>
        </div>
        <button
          onClick={handleClearPendingLink}
          className="p-1 hover:bg-white/50 rounded flex-shrink-0"
          title="Retirer lien"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)}
  
  {/* ⭐ v3.0a : LAYOUT avec menu [+] Input [✉️] */}
  <div className="flex items-end space-x-2">

    {/* Bouton [+] avec menu contextuel à GAUCHE */}
    <div className="relative flex-shrink-0">
      <button
        onClick={handleToggleAttachmentMenu}
        className="p-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
        title="Ajouter contenu"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Menu contextuel */}
      {attachmentMenuOpen && (
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAttachmentMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-[220px]">
            {/* Option 1 : Lier un souvenir */}
            <button
              onClick={handleInsertLink}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
            >
              <Link className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Lier un souvenir
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Depuis la timeline
                </div>
              </div>
            </button>

            {/* Option 2 : Photo rapide */}
            <button
              onClick={handleInsertQuickPhoto}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left"
            >
              <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Insérer photo (rapide)
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Sans association moment
                </div>
              </div>
            </button>

            {/* Option 3 : Photo souvenir */}
            <button
              onClick={handleInsertMemoryPhoto}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <Camera className="w-5 h-5 text-green-600 dark:text-green-400" />
                <Sparkles className="w-3 h-3 text-green-400 dark:text-green-300 absolute -top-1 -right-1" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Insérer photo souvenir
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Avec association moment
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
    
    
    
    {/* ⭐ Input area iMessage-style : + petit à gauche, textarea au milieu, send intégré à droite */}
    <div className="flex items-end gap-2">
      {/* Bouton + (plus petit et discret) */}
      <button
        onClick={() => setShowPhotoMenu(!showPhotoMenu)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        title="Ajouter photo"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Conteneur textarea + bouton send intégré */}
      <div className="flex-1 flex flex-col border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-colors overflow-hidden">
        {/* Preview photo intégrée (si présente) */}
        {attachedPhoto && (
          <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-shrink-0">
              <PhotoPreview photo={attachedPhoto} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-900 dark:text-amber-200 font-medium truncate flex items-center space-x-1">
                <ImageIcon className="w-3 h-3" />
                <span>{attachedPhoto.filename || 'Photo'}</span>
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Prête à envoyer
              </p>
            </div>
            <button
              onClick={() => setAttachedPhoto(null)}
              className="flex-shrink-0 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Retirer photo"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {/* Textarea + bouton send */}
        <div className="flex items-end">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              pendingLink || attachedPhoto
                ? "Ajouter un message (optionnel)..."
                : "Message..."
            }
            className="flex-1 bg-transparent p-3 pr-1 resize-none focus:outline-none text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500"
            rows="1"
            style={{ maxHeight: '120px', minHeight: '40px' }}
          />

          {/* Bouton send intégré en bas à droite */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !attachedPhoto && !pendingLink}
            className="flex-shrink-0 p-2 mb-1 mr-1 rounded-full bg-transparent enabled:bg-amber-500 enabled:hover:bg-amber-600 disabled:text-gray-300 dark:disabled:text-gray-600 enabled:text-white transition-colors"
            title="Envoyer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>


</div>

{/* ✨ PHASE B : ThemeModal */}
      {themeModal.isOpen && (
        <ThemeModal
          isOpen={themeModal.isOpen}
          onClose={handleCloseThemeModal}
          availableThemes={app.masterIndex?.themes || []}
          currentThemes={themeModal.currentThemes}
          onSave={handleSaveThemes}
          title="Assigner des thèmes à cette session"
          contentType="session"
        />
      )}

      {/* ⭐ v3.0c : PhotoToMemoryModal */}
      {/* ⭐ v2.9m : processedData + cleanup handler */}
      {photoToMemoryModal.isOpen && (
        <PhotoToMemoryModal
          isOpen={photoToMemoryModal.isOpen}
          photoData={photoToMemoryModal.photoData}
          processedData={photoToMemoryModal.processedData}
          onClose={handleClosePhotoToMemoryModal}
          moments={app.masterIndex?.moments || []}
          onConvert={handleConvertPhotoToMemory}
        />
      )}

      {/* PhotoViewer */}
      {viewerState.isOpen && viewerState.photo && (
        <PhotoViewer
          photo={viewerState.photo}
          gallery={viewerState.gallery || [viewerState.photo]}  // ✅ Utiliser gallery depuis state
          contextMoment={viewerState.contextMoment}
          onClose={closePhotoViewer}
          onCreateSession={null}
          onOpenSession={(session) => {           // ⭐ AJOUTER
    app.openChatSession(session);
  }}
        />
      )}
      
      {/* ✨ PHASE 19C : SessionInfoPanel */}
      <SessionInfoPanel
        isOpen={isInfoPanelOpen}
        onClose={() => setIsInfoPanelOpen(false)}
        session={app.currentChatSession}
        masterIndex={app.masterIndex}
        onNavigateToContent={handleNavigateFromPanel}
      />

      {/* Feedback temporaire */}
      {/* ⭐ v2.9v FIX : Modal feedback avec z-index élevé */}
      {feedbackMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[10002]" style={{ pointerEvents: 'none' }}>
          <div className="bg-black/80 text-white px-6 py-4 rounded-xl shadow-2xl text-base font-medium animate-pulse">
            {feedbackMessage}
          </div>
        </div>
      )}

      {/* ⭐ v2.9u CAS 1A : Modal choix suppression Drive */}
      {deleteChoiceModal.isOpen && (
        <DeletePhotoChoiceModal
          isOpen={deleteChoiceModal.isOpen}
          onClose={() => setDeleteChoiceModal({ isOpen: false, messageId: null, photoFilename: null, deleteFromDrive: false })}
          photoFilename={deleteChoiceModal.photoFilename}
          onDeleteMessageOnly={handleDeleteMessageOnly}
          onDeleteMessageAndDrive={handleDeleteMessageAndDrive}
        />
      )}

      {/* ⭐ v2.9u : Modal 2 cross-refs (OBSOLÈTE pour ChatPage - gardé pour compatibilité) */}
      {deletePhotoModal.isOpen && (
        <CrossRefsWarningModal
          isOpen={deletePhotoModal.isOpen}
          onClose={() => setDeletePhotoModal({ isOpen: false, messageId: null, photoData: null, crossRefsWarnings: [] })}
          itemName={deletePhotoModal.photoData?.filename || 'Photo'}
          itemType="message avec photo"
          crossRefsWarnings={deletePhotoModal.crossRefsWarnings}
          onConfirmMemoryOnly={handleDeletePhotoMemoryOnly}
          onConfirmWithDrive={handleDeletePhotoWithDrive}
          onNavigateToMoment={(momentId) => {
            // Fermer modal et naviguer vers moment
            setDeletePhotoModal({ isOpen: false, messageId: null, photoData: null, crossRefsWarnings: [] });
            dataManager.updateState({
              currentPage: 'memories',
              navigationContext: {
                previousPage: 'chat',
                targetMomentId: momentId,
                returnContext: {
                  fromPage: 'chat',
                  chatSessionId: app.currentChatSession.id
                }
              }
            });
          }}
          onNavigateToSession={(sessionId, messageId) => {
            // Fermer modal et naviguer vers session
            setDeletePhotoModal({ isOpen: false, messageId: null, photoData: null, crossRefsWarnings: [] });
            app.openChatSession(app.sessions.find(s => s.id === sessionId));
            // TODO: Scroll to message with messageId
          }}
        />
      )}
    </div>
  );
}

// ========================================
// COMPOSANT PhotoMessage
// ========================================

function PhotoMessage({ photo, onPhotoClick }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      if (!photo) {
        if (isMounted) setError(true);
        return;
      }
      
      try {
        if (!photo.google_drive_id && photo.url) {
          if (isMounted) {
            setImageUrl(photo.url);
            setLoading(false);
          }
          return;
        }
        
        const url = await window.photoDataV2.resolveImageUrl(photo, true);
        if (isMounted) {
          if (url && !url.startsWith('data:image/svg+xml')) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement photo:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    resolveUrl();
    return () => { isMounted = false; };
  }, [photo]);

  if (loading) {
    return (
      <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center mb-2">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-48 h-48 bg-red-100 rounded-lg flex items-center justify-center mb-2">
        <div className="text-red-500 text-sm">Erreur chargement</div>
      </div>
    );
  }

  // ⭐ v2.9l : Distinguer photos importées et leur association
  const isImported = photo.source === 'imported';
  const hasAssociation = photo.momentId;  // Photo associée à un souvenir

  // 🔍 Debug: Log pour vérifier les valeurs
  console.log('📸 PhotoMessage - Debug bordure:', {
    filename: photo.filename,
    source: photo.source,
    momentId: photo.momentId,
    isImported,
    hasAssociation
  });

  // Déterminer la bordure appropriée
  let borderClass = '';
  if (isImported) {
    if (hasAssociation) {
      // PhotoSouvenir (associée) : cadre JAUNE/AMBER vif
      borderClass = 'border-4 border-amber-500 dark:border-amber-400';
    } else {
      // PhotoENVrac (non associée) : cadre ROUGE vif
      borderClass = 'border-4 border-red-500 dark:border-red-400';
    }
  } else {
  }

  return (
    <div
      className="mb-2 cursor-pointer group relative"
      onClick={() => onPhotoClick(photo)}
    >
      <img
        src={imageUrl}
        alt={photo.filename}
        className={`max-w-[200px] rounded-lg shadow-md hover:shadow-lg transition-shadow ${borderClass}`}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg"></div>

      {/* Badge ⬆️ pour photos importées */}
      {isImported && (
        <div className="absolute bottom-2 right-2 bg-amber-500 dark:bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-lg">
          ⬆️
        </div>
      )}
    </div>
  );
}

// ========================================
// COMPOSANT PhotoPreview (pour input)
// ========================================

function PhotoPreview({ photo }) {
  // ⭐ v2.9w2 : Initialiser immédiatement l'URL si ObjectURL disponible (0 latence)
  const initialUrl = photo?.processedData?.thumbPreviewUrl || null;
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(!initialUrl); // Pas de loading si ObjectURL

  useEffect(() => {
    let isMounted = true;

    const resolveUrl = async () => {
      if (!photo) return;

      // Si déjà un ObjectURL, ne rien faire
      if (photo.processedData?.thumbPreviewUrl) {
        logger.debug('📸 Preview: ObjectURL déjà disponible (instantané)');
        return;
      }

      try {
        setLoading(true);

        // Résoudre depuis Drive (photo déjà uploadée)
        logger.debug('📸 Preview: Résolution depuis Drive');
        const url = await window.photoDataV2.resolveImageUrl(photo, true);
        if (isMounted && url && !url.startsWith('data:image/svg+xml')) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('❌ Erreur preview photo:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    resolveUrl();
    return () => { isMounted = false; };
  }, [photo]);

  if (loading) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center animate-pulse">
        <Camera className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-300 flex items-center justify-center">
        <Camera className="w-8 h-8 text-gray-500" />
      </div>
    );
  }

  // ⭐ v3.0b : Distinguer photos importées avec bordure + badge
  const isImported = photo.source === 'imported';

  return (
    <div className="mb-2">
      <img
        src={imageUrl}
        alt={photo.filename}
        className={`max-w-[200px] rounded-lg shadow-md ${
          isImported ? 'border-4 border-amber-500 dark:border-amber-400' : ''
        }`}
      />

      {/* Badge pour photos importées */}
      {isImported && (
        <div className="absolute bottom-2 right-2 bg-amber-500 dark:bg-amber-400 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1 shadow-lg">
          <span>⬆️</span>
          <span>Photo importée</span>
        </div>
      )}
    </div>
  );
}