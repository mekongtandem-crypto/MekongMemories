/**
 * PhotoToMemoryModal.jsx v2.22b - Workflow 3 étapes (accordéon progressif)
 * 🎯 3 volets visibles simultanément qui s'ouvrent progressivement
 * ✅ Étape 1 : Associer à un moment (liste + créer nouveau)
 * ✅ Étape 2 : Associer à un post/note (liste du moment + créer note)
 * ✅ Étape 3 : Cadre note (titre + descriptif) - UNIQUEMENT si création nouvelle note
 * ⭐ v2.22b : Hauteur listes adaptée + double-clic validation + pas d'étape 3 si post existant
 */
import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, FileText, Image as ImageIcon, ChevronDown, Check } from 'lucide-react';

export default function PhotoToMemoryModal({
  isOpen,
  photoData,
  file,  // Fichier brut avant traitement
  processedData,  // Données image traitées localement
  onClose,
  moments = [],
  onConvert
}) {
  // État de validation des étapes (détermine quels volets sont accessibles)
  const [step1Validated, setStep1Validated] = useState(false);
  const [step2Validated, setStep2Validated] = useState(false);

  // Étape 1 : Moment
  const [selectedMomentId, setSelectedMomentId] = useState('');
  const [isCreatingNewMoment, setIsCreatingNewMoment] = useState(false);
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentDate, setNewMomentDate] = useState('');
  const [newMomentJnnn, setNewMomentJnnn] = useState('IMP');

  // Étape 2 : Post/Note
  const [selectedPostId, setSelectedPostId] = useState('');
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(false);

  // Étape 3 : Texte note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Volets ouverts/fermés
  const [step1Open, setStep1Open] = useState(true);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);

  // Réinitialiser l'état à l'ouverture
  useEffect(() => {
    if (isOpen) {
      // Date par défaut
      let defaultDate = '';
      if (photoData?.uploadedAt) {
        const uploadDate = new Date(photoData.uploadedAt);
        defaultDate = uploadDate.toISOString().split('T')[0];
      } else if (file) {
        const fileDate = file.lastModified ? new Date(file.lastModified) : new Date();
        defaultDate = fileDate.toISOString().split('T')[0];
      }

      // Mémoriser dernier moment sélectionné
      const lastMomentId = localStorage.getItem('mekong_lastSelectedMomentId') || '';
      const momentExists = lastMomentId && moments.some(m => m.id === lastMomentId);

      // Reset all
      setStep1Validated(false);
      setStep2Validated(false);
      setSelectedMomentId(momentExists ? lastMomentId : '');
      setIsCreatingNewMoment(false);
      setNewMomentTitle('');
      setNewMomentDate(defaultDate);
      setNewMomentJnnn('IMP');
      setSelectedPostId('');
      setIsCreatingNewPost(false);
      setNoteTitle('');
      setNoteContent('');
      setStep1Open(true);
      setStep2Open(false);
      setStep3Open(false);
    }
  }, [isOpen, photoData, file, moments]);

  if (!isOpen) return null;

  // Récupérer le moment sélectionné (pour étape 2)
  const selectedMoment = selectedMomentId ? moments.find(m => m.id === selectedMomentId) : null;

  // Handler annuler
  const handleCancel = () => {
    onClose();
  };

  // Handler confirmation finale (étape 3 ou direct si post existant)
  const handleConfirm = () => {
    // Retourner les données au parent
    onConvert({
      // Étape 1 : Moment
      momentId: isCreatingNewMoment ? null : selectedMomentId,
      newMoment: isCreatingNewMoment ? {
        title: newMomentTitle.trim(),
        date: newMomentDate,
        jnnn: newMomentJnnn.trim() || 'IMP'
      } : null,

      // Étape 2 : Post (null si création nouvelle note)
      postId: isCreatingNewPost ? null : selectedPostId,

      // Étape 3 : Texte note
      noteTitle: noteTitle.trim() || null,
      noteContent: noteContent.trim() || null
    });

    onClose();
  };

  // Handler validation étape 1
  const handleValidateStep1 = () => {
    // Validation
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

    // Sauvegarder dernier moment sélectionné
    if (!isCreatingNewMoment && selectedMomentId) {
      localStorage.setItem('mekong_lastSelectedMomentId', selectedMomentId);
    }

    setStep1Validated(true);
    setStep1Open(false);
    setStep2Open(true);
  };

  // Handler validation étape 2
  const handleValidateStep2 = () => {
    // Validation
    if (!isCreatingNewPost && !selectedPostId) {
      alert('Veuillez sélectionner un post/note ou créer une nouvelle note');
      return;
    }

    setStep2Validated(true);
    setStep2Open(false);

    // ⭐ v2.22b : Si post existant sélectionné, confirmer directement (pas d'étape 3)
    if (!isCreatingNewPost && selectedPostId) {
      // Confirmer immédiatement
      handleConfirm();
    } else {
      // Sinon, ouvrir étape 3 (création nouvelle note)
      setStep3Open(true);
    }
  };

  // Toggle création nouveau moment (étape 1)
  const toggleCreateMoment = () => {
    setIsCreatingNewMoment(prev => !prev);
    setSelectedMomentId('');

    // Réinitialiser avec valeurs par défaut
    setNewMomentTitle('');
    let defaultDate = '';
    if (photoData?.uploadedAt) {
      const uploadDate = new Date(photoData.uploadedAt);
      defaultDate = uploadDate.toISOString().split('T')[0];
    } else if (file) {
      const fileDate = file.lastModified ? new Date(file.lastModified) : new Date();
      defaultDate = fileDate.toISOString().split('T')[0];
    }
    setNewMomentDate(defaultDate);
    setNewMomentJnnn('IMP');
  };

  // Toggle création nouvelle note (étape 2)
  const toggleCreatePost = () => {
    setIsCreatingNewPost(prev => !prev);
    setSelectedPostId('');
  };

  // Récupérer posts du moment sélectionné (pour étape 2)
  const momentPosts = selectedMoment?.posts || [];

  // Récupérer résumé moment pour étape 2 et 3
  const momentSummary = isCreatingNewMoment
    ? `Nouveau moment : ${newMomentTitle || '(sans titre)'}`
    : selectedMoment
      ? `${selectedMoment.displayTitle || selectedMoment.title}`
      : '';

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
        <div className="p-6 space-y-4">

          {/* Info fichier */}
          {file && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                </p>
              </div>
            </div>
          )}

          {/* ========== ÉTAPE 1 : ASSOCIER À UN MOMENT ========== */}
          <div className={`border rounded-lg transition-all ${
            step1Validated
              ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
              : 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10'
          }`}>
            {/* Header volet */}
            <button
              onClick={() => setStep1Open(!step1Open)}
              className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
            >
              <div className="flex items-center space-x-2">
                {step1Validated ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">
                    1
                  </span>
                )}
                <h4 className={`font-medium ${
                  step1Validated
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-purple-900 dark:text-purple-100'
                }`}>
                  Associer à un moment
                </h4>
                {step1Validated && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • {momentSummary}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                step1Open ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Contenu volet */}
            {step1Open && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {/* Toggle Create/Select */}
                <button
                  onClick={toggleCreateMoment}
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
                  // Liste moments existants
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moments existants ({moments.length})
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                      {moments.map(moment => (
                        <button
                          key={moment.id}
                          onClick={() => setSelectedMomentId(moment.id)}
                          onDoubleClick={handleValidateStep1}
                          className={`w-full text-left px-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0
                            hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors
                            ${selectedMomentId === moment.id ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-white dark:bg-gray-700'}`}
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {moment.displayTitle || moment.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {moment.date}
                            {(moment.displaySubtitle || moment.jnnn) && (
                              <> • {moment.displaySubtitle || moment.jnnn}</>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bouton validation */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleValidateStep1}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-md"
                  >
                    Valider et continuer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========== ÉTAPE 2 : ASSOCIER À UN POST/NOTE ========== */}
          {step1Validated && (
            <div className={`border rounded-lg transition-all ${
              step2Validated
                ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
                : 'border-blue-200 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10'
            }`}>
              {/* Header volet */}
              <button
                onClick={() => setStep2Open(!step2Open)}
                className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
              >
                <div className="flex items-center space-x-2">
                  {step2Validated ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                      2
                    </span>
                  )}
                  <h4 className={`font-medium ${
                    step2Validated
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-blue-900 dark:text-blue-100'
                  }`}>
                    Associer à un post/note
                  </h4>
                  {step2Validated && selectedPostId && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      • {momentPosts.find(p => p.id === selectedPostId)?.title || 'Note sélectionnée'}
                    </span>
                  )}
                  {step2Validated && isCreatingNewPost && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      • Nouvelle note
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                  step2Open ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Contenu volet */}
              {step2Open && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Info moment sélectionné */}
                  <div className="mb-3 p-2 bg-white dark:bg-gray-700 rounded text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Moment : </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {momentSummary}
                    </span>
                  </div>

                  {/* Toggle Create/Select */}
                  <button
                    onClick={toggleCreatePost}
                    className="mb-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isCreatingNewPost ? 'Sélectionner un post/note existant' : 'Créer une nouvelle note'}
                    </span>
                  </button>

                  {isCreatingNewPost ? (
                    // Mode création note
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        ✍️ Une <strong>nouvelle note de photo</strong> sera créée à l'étape suivante.
                      </p>
                    </div>
                  ) : (
                    // Liste posts/notes du moment
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Posts/Notes du moment ({momentPosts.length})
                      </label>
                      {momentPosts.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                          {momentPosts.map(post => (
                            <button
                              key={post.id}
                              onClick={() => setSelectedPostId(post.id)}
                              onDoubleClick={handleValidateStep2}
                              className={`w-full text-left px-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0
                                hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                                ${selectedPostId === post.id ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-white dark:bg-gray-700'}`}
                            >
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {post.title || 'Post sans titre'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {post.category === 'user_added' ? '📝 Note' : '🗒️ Post Mastodon'}
                                {post.photos?.length > 0 && (
                                  <> • {post.photos.length} photo(s)</>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          Ce moment ne contient aucun post ou note. Créez une nouvelle note ci-dessus.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bouton validation */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleValidateStep2}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-md"
                    >
                      Valider et continuer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== ÉTAPE 3 : CADRE NOTE (uniquement si création nouvelle note) ========== */}
          {step2Validated && isCreatingNewPost && (
            <div className="border border-amber-200 dark:border-amber-700 rounded-lg bg-amber-50/30 dark:bg-amber-900/10">
              {/* Header volet */}
              <button
                onClick={() => setStep3Open(!step3Open)}
                className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-sm font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Ajouter du texte à la note
                  </h4>
                  {(noteTitle || noteContent) && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      • {noteTitle || 'Texte ajouté'}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                  step3Open ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Contenu volet */}
              {step3Open && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>

          {/* Bouton Confirmer uniquement si création nouvelle note (étape 3 visible) */}
          {step2Validated && isCreatingNewPost && (
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              Confirmer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
