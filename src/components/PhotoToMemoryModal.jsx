/**
 * PhotoToMemoryModal.jsx v3.0c - Conversion photo importée → souvenir
 * ✅ Sélection moment existant OU création nouveau moment
 * ✅ Légende optionnelle
 * ✅ Support dark mode
 */
import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, FileText } from 'lucide-react';

export default function PhotoToMemoryModal({
  isOpen,
  onClose,
  moments = [],
  onConvert
}) {
  const [selectedMomentId, setSelectedMomentId] = useState('');
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentDate, setNewMomentDate] = useState('');
  const [caption, setCaption] = useState('');
  const [isCreatingNewMoment, setIsCreatingNewMoment] = useState(false);

  // Réinitialiser l'état à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedMomentId('');
      setNewMomentTitle('');
      setNewMomentDate('');
      setCaption('');
      setIsCreatingNewMoment(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    // Validation
    if (!isCreatingNewMoment && !selectedMomentId) {
      alert('Veuillez sélectionner un moment ou créer un nouveau moment');
      return;
    }

    if (isCreatingNewMoment && !newMomentTitle.trim()) {
      alert('Veuillez saisir un titre pour le nouveau moment');
      return;
    }

    if (isCreatingNewMoment && !newMomentDate) {
      alert('Veuillez saisir une date pour le nouveau moment');
      return;
    }

    // Retourner les données au parent
    onConvert({
      momentId: isCreatingNewMoment ? null : selectedMomentId,
      newMoment: isCreatingNewMoment ? {
        title: newMomentTitle.trim(),
        date: newMomentDate
      } : null,
      caption: caption.trim() || null
    });

    onClose();
  };

  const toggleCreateMode = () => {
    setIsCreatingNewMoment(prev => !prev);
    setSelectedMomentId('');
    setNewMomentTitle('');
    setNewMomentDate('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Convertir en souvenir
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
        <div className="p-4 space-y-4">
          {/* Sélection moment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Associer à un moment *
            </label>

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
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Titre du moment *
                  </label>
                  <input
                    type="text"
                    value={newMomentTitle}
                    onChange={(e) => setNewMomentTitle(e.target.value)}
                    placeholder="Ex: Jour 3 - Visite des temples"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newMomentDate}
                    onChange={(e) => setNewMomentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            ) : (
              // Sélection moment existant
              <select
                value={selectedMomentId}
                onChange={(e) => setSelectedMomentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

          {/* Légende optionnelle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Légende (optionnel)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajoutez une description ou un commentaire pour cette photo..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Si vous ajoutez une légende, cette photo deviendra un "post avec photo" (✍️) dans la timeline.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
