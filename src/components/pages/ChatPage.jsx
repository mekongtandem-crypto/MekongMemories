/**
 * ChatPage.jsx v3.0e - Modal 2 sections + insertion chat après conversion
 * ✅ Bouton [+] avec menu contextuel
 * ✅ Menu : 🔗 Lien souvenir, 📷 Photo rapide, 📷✨ Photo souvenir
 * ✅ Upload rapide : file picker + compression + Drive upload
 * ✅ Upload avec conversion : modal 2 sections (moment + texte optionnel)
 * ✅ PhotoToMemoryModal : Section 1 (moment) + Section 2 (Photo Note)
 * ✅ Support champ jnnn pour nouveaux moments (valeur par défaut: "undefined")
 * ✅ Photo Note : titre + descriptif (max 500 chars) → posts avec category: 'user_added'
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
    photoData: null
  });

  // ✨ PHASE 19C : État panel infos
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll vers dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [app.currentChatSession?.notes]);

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
      console.log('🔗 Lien reçu depuis Memories:', navigationContext.pendingLink);
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

      // 2. Afficher le spinner de loading
      dataManager.setLoadingOperation(
        true,
        'Traitement de l\'image...',
        'Compression et upload vers Google Drive',
        'spin'
      );

      // 3. Traiter et uploader l'image
      const photoMetadata = await processAndUploadImage(file, app.currentUser.id);

      logger.success('✅ Photo uploadée avec succès:', photoMetadata);

      // 4. Attacher la photo au message
      setAttachedPhoto(photoMetadata);

      // 5. Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // 6. Focus sur le textarea pour permettre d'ajouter un message
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);

    } catch (error) {
      logger.error('❌ Erreur upload photo rapide:', error);

      // Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // Afficher message d'erreur
      alert(`Erreur lors de l'upload de la photo:\n${error.message}`);
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

      // 2. Afficher le spinner de loading
      dataManager.setLoadingOperation(
        true,
        'Traitement de l\'image...',
        'Compression et upload vers Google Drive',
        'spin'
      );

      // 3. Traiter et uploader l'image
      const photoMetadata = await processAndUploadImage(file, app.currentUser.id);

      logger.success('✅ Photo uploadée avec succès:', photoMetadata);

      // 4. Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // 5. Ouvrir le modal de conversion
      setPhotoToMemoryModal({
        isOpen: true,
        photoData: photoMetadata
      });

    } catch (error) {
      logger.error('❌ Erreur upload photo souvenir:', error);

      // Désactiver le spinner
      dataManager.setLoadingOperation(false);

      // Afficher message d'erreur
      alert(`Erreur lors de l'upload de la photo:\n${error.message}`);
    }
  };

  const handleConvertPhotoToMemory = async (conversionData) => {
    logger.info('🔄 Conversion photo → souvenir', conversionData);

    const { photoData } = photoToMemoryModal;
    if (!photoData) {
      logger.error('❌ Pas de photo à convertir');
      return;
    }

    try {
      // Afficher le spinner
      dataManager.setLoadingOperation(
        true,
        'Conversion en souvenir...',
        'Mise à jour du master index et sauvegarde sur Drive',
        'monkey'
      );

      // ✅ v3.0d : Appel de la méthode réelle d'ajout au masterIndex
      const result = await dataManager.addImportedPhotoToMasterIndex(photoData, conversionData);

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
              ? (conversionData.noteTitle || 'Photo Note')
              : photoData.filename,
            linkedBy: app.currentUser
          });
          logger.success(`🔗 Lien ContentLinks créé: ${result.contentType} → session ${app.currentChatSession.id}`);

          // ⭐ v2.8f : Si c'est un post (Photo Note), créer AUSSI un lien pour la photo
          if (result.contentType === 'post' && photoData.google_drive_id) {
            await window.contentLinks.addLink({
              sessionId: app.currentChatSession.id,
              messageId: `import_photo_${Date.now()}`,
              contentType: 'photo',
              contentId: photoData.google_drive_id,
              contentTitle: photoData.filename,
              linkedBy: app.currentUser
            });
            logger.success(`🔗 Lien photo supplémentaire créé: ${photoData.google_drive_id}`);
          }
        } catch (linkError) {
          logger.error('❌ Erreur création lien ContentLinks:', linkError);
          // Non-bloquant
        }
      }

      // ⭐ v3.0e : Insérer la photo dans le chat après conversion réussie
      setAttachedPhoto(photoData);
      logger.info('📸 Photo attachée au chat après conversion');

      // Feedback
      if (window.chatPageActions?.showFeedback) {
        const message = conversionData.newMoment
          ? '✅ Nouveau moment créé et photo ajoutée !'
          : '✅ Photo ajoutée au moment !';
        window.chatPageActions.showFeedback(message);
      }

      // Fermer le modal
      setPhotoToMemoryModal({
        isOpen: false,
        photoData: null
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
        attachedPhoto,
        messageData.linkedContent  // ⭐ Nouveau param
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
  if (!confirm('Supprimer ce message ?')) return;

  // ✨ Activer le spinner
  dataManager.setLoadingOperation(true, 'Suppression du message...', 'Enregistrement sur Google Drive', 'monkey');

  try {
    const updatedSession = { ...app.currentChatSession };

    // ⭐ NOUVEAU : Détecter si message a un lien avant suppression
    const messageToDelete = updatedSession.notes.find(m => m.id === messageId);
    const hasLink = messageToDelete?.linkedContent;

    // Supprimer le message
    updatedSession.notes = updatedSession.notes.filter(note => note.id !== messageId);

    await app.updateSession(updatedSession);
    
    // ⭐ NOUVEAU : Nettoyer ContentLinks si le message avait un lien
    if (hasLink && window.contentLinks) {
      console.log('🗑️ Nettoyage ContentLinks pour message supprimé:', messageToDelete.linkedContent);
      
      await window.contentLinks.removeLink(
        updatedSession.id,
        messageToDelete.linkedContent.type,
        messageToDelete.linkedContent.id
      );
      
      // ⭐ DEBUG : Vérifier que le lien a bien été supprimé
const linksAfter = window.contentLinks.getLinksForSession(updatedSession.id);
console.log('🔍 Liens restants pour cette session:', linksAfter);

// ⭐ DEBUG : Vérifier l'index côté contenu
const sessionsForContent = window.contentLinks.getSessionsForContent(
  messageToDelete.linkedContent.type,
  messageToDelete.linkedContent.id
);
console.log('🔍 Sessions liées à ce contenu:', sessionsForContent);
      
      console.log('✅ ContentLinks mis à jour et sauvegardé');
    }

    // ✨ Désactiver le spinner
    dataManager.setLoadingOperation(false);

  } catch (error) {
    console.error('❌ Erreur suppression message:', error);
    // ✨ Désactiver le spinner en cas d'erreur
    dataManager.setLoadingOperation(false);
  }
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

          return (
          <div
            key={message.id}
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
{message.photoData && (
  hasInteractivePhoto ? (
    // ⭐ v2.8f : Photo interactive (origin/linkée/importée) = LinkedContent avec Zoom/Localiser
    <div className="w-full max-w-full overflow-hidden mb-2">
      <LinkedContent
        linkedContent={{
          type: 'photo',
          id: message.photoData.filename || message.photoData.google_drive_id,
          title: message.photoData.filename,
          google_drive_id: message.photoData.google_drive_id,
          url: message.photoData.url,
          width: message.photoData.width,
          height: message.photoData.height,
          mime_type: message.photoData.mime_type,
          photoType: message.photoData.type,
          source: message.photoData.source,  // ⭐ v2.9l : Pour déterminer la bordure
          momentId: message.photoData.momentId  // ⭐ v2.9l : Association au souvenir
        }}
        onOpenLocal={handleOpenPhotoLocal}
        onNavigate={handleNavigateToMemories}
        masterIndex={app.masterIndex}
      />
    </div>
  ) : (
    // Photo normale sans interaction
    <PhotoMessage
      photo={message.photoData}
      onPhotoClick={openPhotoViewer}
    />
  )
)}
    
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
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 rounded shadow-lg p-1 -mr-2 -mt-2">
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
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 rounded shadow-lg p-1 -mr-2 -mt-2">
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
  
  {/* Preview photo (si présente) */}
  {attachedPhoto && (
    <div className="mb-3 relative group">
      <div className="relative rounded-lg overflow-hidden border-2 border-purple-300 shadow-md">
        <PhotoPreview photo={attachedPhoto} />
        
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-bl-lg shadow-lg p-1">
          <button
            onClick={() => setAttachedPhoto(null)}
            className="p-1 hover:bg-red-100 rounded"
            title="Retirer photo"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
        
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          📎 Photo attachée
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
    
    
    
    {/* Input message au CENTRE */}
    <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              // ✨ Entrée = Envoyer, Shift+Entrée = Retour à la ligne
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              pendingLink || attachedPhoto
                ? "Ajouter un message (optionnel)..."
                : "tapez votre message... (Entrée pour envoyer, Shift+Entrée pour retour à la ligne)"
            }
            className="flex-1 dark:text-gray-50  bg-gray-800 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows="2"
          />
    
    {/* Bouton Envoyer à DROITE */}
<button
  onClick={handleSendMessage}
  disabled={!newMessage.trim() && !attachedPhoto && !pendingLink}
  className="relative flex-shrink-0 p-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
  title="Envoyer (Entrée)"
>
  <Send className="w-6 h-6" />
  
  {/* ⭐ NOUVEAU : Pastille si contenu attaché */}
  {(pendingLink || attachedPhoto) && (
    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
      {(pendingLink ? 1 : 0) + (attachedPhoto ? 1 : 0)}
    </div>
  )}
</button>
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
      {photoToMemoryModal.isOpen && (
        <PhotoToMemoryModal
          isOpen={photoToMemoryModal.isOpen}
          photoData={photoToMemoryModal.photoData}
          onClose={() => setPhotoToMemoryModal({ isOpen: false, photoData: null })}
          moments={app.masterIndex?.moments || []}
          onConvert={handleConvertPhotoToMemory}
        />
      )}

      {/* PhotoViewer */}
      {viewerState.isOpen && viewerState.photo && (
        <PhotoViewer 
          photo={viewerState.photo}
          gallery={viewerState.gallery || [viewerState.photo]}  // ✅ Utiliser gallery depuis state
          contextMoment={null}
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
      {feedbackMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          {feedbackMessage}
        </div>
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
      // PhotoSouvenir (associée) : cadre gris épais
      borderClass = 'ring-4 ring-gray-400 dark:ring-gray-500';
      console.log('✅ Bordure: PhotoSouvenir (gris épais 4px)');
    } else {
      // PhotoENVrac (non associée) : cadre noir épais
      borderClass = 'ring-4 ring-black dark:ring-white';
      console.log('✅ Bordure: PhotoENVrac (noir épais 4px / blanc en dark)');
    }
  } else {
    console.log('⚠️ Pas de bordure - source:', photo.source, 'isImported:', isImported);
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
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      if (!photo) return;
      
      try {
        setLoading(true);
        const url = await window.photoDataV2.resolveImageUrl(photo, false);
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
    <div className="relative">
      <img
        src={imageUrl}
        alt={photo.filename}
        className={`w-full max-h-96 object-contain bg-gray-100 rounded-lg ${
          isImported ? 'border-2 border-amber-500 dark:border-amber-400' : ''
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