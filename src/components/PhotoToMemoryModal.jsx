/**
 * PhotoToMemoryModal.jsx v3.0e - Conversion photo → souvenir (2 sections)
 * ✅ Section 1 : Association moment (titre, date, jnnn)
 * ✅ Section 2 : Texte optionnel (titre + descriptif) → Photo Note
 * ✅ Support création nouveau moment
 * ✅ Support dark mode
 */
import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, FileText } from 'lucide-react';

export default function PhotoToMemoryModal({
  isOpen,
  photoData,
  onClose,
  moments = [],
  onConvert
}) {
  // Section 1 : Moment
  const [selectedMomentId, setSelectedMomentId] = useState('');
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentDate, setNewMomentDate] = useState('');
  const [newMomentJnnn, setNewMomentJnnn] = useState('IMP');
  const [isCreatingNewMoment, setIsCreatingNewMoment] = useState(false);

  // Section 2 : Texte (optionnel pour Photo Note)
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Réinitialiser l'état à l'ouverture
  useEffect(() => {
    if (isOpen) {
      // ⭐ v2.8e : Utiliser la date de création de la photo si disponible
      let defaultDate = '';
      if (photoData?.uploadedAt) {
        // Convertir ISO timestamp en format YYYY-MM-DD
        const uploadDate = new Date(photoData.uploadedAt);
        defaultDate = uploadDate.toISOString().split('T')[0];
      }

      setSelectedMomentId('');
      setNewMomentTitle('');
      setNewMomentDate(defaultDate);
      setNewMomentJnnn('IMP');  // ⭐ v2.8e : "IMP" au lieu de "undefined" (plus court)
      setIsCreatingNewMoment(false);
      setNoteTitle('');
      setNoteContent('');
    }
  }, [isOpen, photoData]);

  if (!isOpen) return null;

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    // Validation Section 1
    if (!isCreatingNewMoment && !selectedMomentId) {
      alert('Veuillez sélectionner un moment ou créer un nouveau moment');
      return;
    }

    if (isCreatingNewMoment) {
      if (!newMomentTitle.trim()) {
        alert('Veuillez saisir un titre pour le nouveau moment');
        return;
      }
      if (!newMomentDate) {
        alert('Veuillez saisir une date pour le nouveau moment');
        return;
      }
    }

    // Retourner les données au parent
    onConvert({
      // Section 1 : Moment
      momentId: isCreatingNewMoment ? null : selectedMomentId,
      newMoment: isCreatingNewMoment ? {
        title: newMomentTitle.trim(),
        date: newMomentDate,
        jnnn: newMomentJnnn.trim() || 'IMP'  // ⭐ v2.8e : "IMP" au lieu de "undefined"
      } : null,

      // Section 2 : Texte (Photo Note)
      noteTitle: noteTitle.trim() || null,
      noteContent: noteContent.trim() || null
    });

    onClose();
  };

  const toggleCreateMode = () => {
    setIsCreatingNewMoment(prev => !prev);
    setSelectedMomentId('');

    // ⭐ v2.8e : Réinitialiser avec valeurs par défaut intelligentes
    setNewMomentTitle('');

    // Date par défaut = date photo si disponible
    let defaultDate = '';
    if (photoData?.uploadedAt) {
      const uploadDate = new Date(photoData.uploadedAt);
      defaultDate = uploadDate.toISOString().split('T')[0];
    }
    setNewMomentDate(defaultDate);

    // Jnnn par défaut = "IMP"
    setNewMomentJnnn('IMP');
  };

  // Déterminer si c'est une Photo Note (texte présent)
  const isPhotoNote = noteTitle.trim() || noteContent.trim();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              📷 Créer un souvenir photo
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* ========== SECTION 1 : ASSOCIER UN MOMENT ========== */}
          <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50/30 dark:bg-purple-900/10">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-purple-900 dark:text-purple-100">
                1. Associer à un moment *
              </h4>
            </div>

            {/* Toggle Create/Select */}
            <button
              onClick={toggleCreateMode}
              className="mb-3 text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isCreatingNewMoment ? 'Sélectionner un moment existant' : 'Créer un nouveau moment'}
              </span>
            </button>

            {isCreatingNewMoment ? (
              // Création nouveau moment
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre du moment *
                  </label>
                  <input
                    type="text"
                    value={newMomentTitle}
                    onChange={(e) => setNewMomentTitle(e.target.value)}
                    placeholder="Ex: Temple Wat Xieng Thong"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newMomentDate}
                      onChange={(e) => setNewMomentDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jour (Jnnn)
                    </label>
                    <input
                      type="text"
                      value={newMomentJnnn}
                      onChange={(e) => setNewMomentJnnn(e.target.value.toUpperCase())}
                      placeholder="J7, IMP..."
                      maxLength={5}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Sélection moment existant
              <select
                value={selectedMomentId}
                onChange={(e) => setSelectedMomentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">-- Sélectionnez un moment --</option>
                {moments.map(moment => (
                  <option key={moment.id} value={moment.id}>
                    {moment.date} - {moment.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ========== SECTION 2 : AJOUTER DU TEXTE (OPTIONNEL) ========== */}
          <div className="border border-amber-200 dark:border-amber-700 rounded-lg p-4 bg-amber-50/30 dark:bg-amber-900/10">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                2. Ajouter du texte (optionnel)
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ex: Magnifique architecture"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descriptif (max 500 caractères)
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ajoutez une description détaillée de cette photo..."
                  rows="4"
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                    focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {noteContent.length}/500 caractères
                </p>
              </div>
            </div>

            {/* Indicateur type de souvenir */}
            <div className="mt-3 p-2 bg-white dark:bg-gray-700 rounded text-xs">
              {isPhotoNote ? (
                <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                  <span className="text-base">📷✍️</span>
                  <span className="font-medium">
                    Ce sera une <strong>Photo Note</strong> (photo avec texte)
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
                  <span className="text-base">📷</span>
                  <span className="font-medium">
                    Ce sera une <strong>Photo simple</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-md"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
