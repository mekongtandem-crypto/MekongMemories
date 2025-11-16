/**
 * EditMomentModal.jsx v2.9 - Modal d'édition de moment
 * ✅ Édition titre, date, jnnn
 * ✅ Seulement pour moments importés (source='imported')
 * ✅ Dark mode support
 * ✅ Validation formulaire
 */
import React, { useState, useEffect } from 'react';
import { X, Edit, Calendar, Hash } from 'lucide-react';

export default function EditMomentModal({
  isOpen,
  onClose,
  moment,
  onSave
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [jnnn, setJnnn] = useState('');
  const [error, setError] = useState(null);

  // Initialiser les valeurs du formulaire
  useEffect(() => {
    if (isOpen && moment) {
      setTitle(moment.title || '');
      setDate(moment.date || '');
      setJnnn(moment.jnnn || 'undefined');
      setError(null);
    }
  }, [isOpen, moment]);

  if (!isOpen || !moment) return null;

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (!date.trim()) {
      setError('La date est requise');
      return;
    }

    // Préparer les données
    const updatedMoment = {
      ...moment,
      title: title.trim(),
      date: date.trim(),
      jnnn: jnnn.trim() || 'undefined'
    };

    onSave(updatedMoment);
    onClose();
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

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
            <Edit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Modifier le moment
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
              <Edit className="w-4 h-4" />
              <span>Titre</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Jour 1 : Arrivée à Luang Prabang"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Jnnn (optionnel) */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="w-4 h-4" />
              <span>Numéro de jour (optionnel)</span>
            </label>
            <input
              type="text"
              value={jnnn}
              onChange={(e) => setJnnn(e.target.value)}
              placeholder="Ex: J1, J2, J3... (ou laisser vide)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Laissez vide ou entrez "undefined" si non applicable
            </p>
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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-150"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
