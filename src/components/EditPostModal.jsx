/**
 * EditPostModal.jsx v2.9 - Modal d'édition de post (Note de photo)
 * ✅ Édition titre et contenu
 * ✅ Seulement pour posts user_added (Note de photos)
 * ✅ Dark mode support
 * ✅ Validation formulaire
 * ✅ Compteur de caractères (max 500)
 */
import React, { useState, useEffect } from 'react';
import { X, Edit, FileText } from 'lucide-react';

const MAX_CONTENT_LENGTH = 500;

export default function EditPostModal({
  isOpen,
  onClose,
  post,
  onSave
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  // Initialiser les valeurs du formulaire
  useEffect(() => {
    if (isOpen && post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setError(null);
    }
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`Le contenu ne peut pas dépasser ${MAX_CONTENT_LENGTH} caractères`);
      return;
    }

    // Préparer les données
    const updatedPost = {
      ...post,
      title: title.trim(),
      content: content.trim()
    };

    onSave(updatedPost);
    onClose();
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Modifier la Note de photo
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              <span>Titre</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Vue sur le Mékong"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Description</span>
              </div>
              <span className={`text-xs ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {remainingChars} / {MAX_CONTENT_LENGTH}
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              placeholder="Ajoutez une description (optionnel)..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="5"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isOverLimit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
