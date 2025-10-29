/**
 * SessionCreationModal.jsx v1.1 - Titre éditable + focus message
 * ✅ Titre éditable avec valeur par défaut
 * ✅ Curseur dans textarea par défaut
 * ✅ Fix z-index au-dessus du PhotoViewer
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Image, FileText } from 'lucide-react';

export default function SessionCreationModal({ 
  source,
  contextMoment,
  currentUser,
  onClose,
  onConfirm
}) {
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [openAfterCreate, setOpenAfterCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const textareaRef = useRef(null);

  // Initialiser le titre par défaut
  useEffect(() => {
    let defaultTitle = '';
    
    if (source.filename) {
      defaultTitle = `Souvenirs de ${contextMoment.displayTitle}`;
    } else if (source.content) {
      const firstLine = source.content.split('\n')[0].substring(0, 40);
      defaultTitle = `Souvenirs de l'article : ${firstLine}...`;
    } else {
      defaultTitle = `Souvenirs du moment : ${source.displayTitle}`;
    }
    
    setTitle(defaultTitle);
  }, [source, contextMoment]);

  // Focus sur textarea au montage
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Charger la préférence utilisateur
  useEffect(() => {
    const savedPref = localStorage.getItem(`mekong_v2_user_${currentUser}_autoOpenSession`);
    if (savedPref !== null) {
      setOpenAfterCreate(savedPref === 'true');
    }
  }, [currentUser]);

  const handleToggleOpen = (checked) => {
    setOpenAfterCreate(checked);
    localStorage.setItem(`mekong_v2_user_${currentUser}_autoOpenSession`, checked);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onConfirm({
        title: title.trim(),
        initialText: textContent.trim() || null,
        shouldOpen: openAfterCreate
      });
      onClose();
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Impossible de créer la session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getSourcePreview = () => {
    if (source.filename) {
      return {
        icon: <Image className="w-5 h-5 text-blue-600" />,
        label: source.filename,
        subtitle: `Moment : ${contextMoment.displayTitle}`,
        type: 'photo'
      };
    } else if (source.content) {
      const title = source.content.split('\n')[0].substring(0, 50);
      return {
        icon: <FileText className="w-5 h-5 text-green-600" />,
        label: title + (title.length === 50 ? '...' : ''),
        subtitle: `Article J${source.dayNumber}`,
        type: 'post'
      };
    } else {
      return {
        icon: <MessageCircle className="w-5 h-5 text-amber-600" />,
        label: source.displayTitle,
        subtitle: source.displaySubtitle,
        type: 'moment'
      };
    }
  };

  const preview = getSourcePreview();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Nouvelle session à partir de </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Fermer (Echap)"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-1 space-y-1">
          {/* Source preview */}
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {preview.icon}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{preview.label}</p>
              <p className="text-sm text-gray-500">{preview.subtitle}</p>
            </div>
         </div>

          {/* Titre éditable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la session
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="Titre de la session..."
            />
          </div>

          {/* Textarea message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ton message (optionnel)
            </label>
            <textarea
              ref={textareaRef}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={
                preview.type === 'photo' 
                  ? "Regarde cette photo, à quoi te fait-elle penser ?"
                  : preview.type === 'post'
                  ? "Tu te souviens pourquoi..."
                  : "Décris-moi comment on est arrivé à..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              rows="4"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laisse vide pour créer une session sans message initial
            </p>
          </div>

          {/* Checkbox "Ouvrir maintenant" */}
          <label className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors">
            <input
              type="checkbox"
              checked={openAfterCreate}
              onChange={(e) => handleToggleOpen(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Ouvrir maintenant</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !title.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>{isCreating ? 'Création...' : 'Créer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}