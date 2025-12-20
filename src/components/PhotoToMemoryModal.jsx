/**
 * PhotoToMemoryModal.jsx v2.22c - Accordéon strict avec menus déroulants
 * 🎯 Design sobre : un volet ouvert à la fois
 * ✅ Volet 1 (purple) : ✨ Moment associé - menu déroulant + lien création
 * ✅ Volet 2 (bleu) : 📝 Post/note associé - menu déroulant + lien création
 * ✅ Volet 3 (amber) : 📄 Texte du post (uniquement si création nouvelle note)
 * ⭐ v2.22c : Accordéon strict + auto-ouverture volet suivant + checkmarks
 */
import React, { useState, useEffect } from 'react';
import { X, MapPin, ChevronRight, Check } from 'lucide-react';

export default function PhotoToMemoryModal({
  isOpen,
  photoData,
  file,
  processedData,
  onClose,
  moments = [],
  onConvert
}) {
  // Volets ouverts/fermés (accordéon strict)
  const [openPanel, setOpenPanel] = useState(1); // 1, 2, ou 3

  // Étape 1 : Moment
  const [selectedMomentId, setSelectedMomentId] = useState('');
  const [isCreatingNewMoment, setIsCreatingNewMoment] = useState(false);
  const [newMomentTitle, setNewMomentTitle] = useState('');
  const [newMomentDate, setNewMomentDate] = useState('');
  const [newMomentJnnn, setNewMomentJnnn] = useState('IMP');
  const [moment1Validated, setMoment1Validated] = useState(false);

  // Étape 2 : Post/Note
  const [selectedPostId, setSelectedPostId] = useState('');
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(false);
  const [post2Validated, setPost2Validated] = useState(false);

  // Étape 3 : Texte note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Réinitialiser à l'ouverture
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
      setOpenPanel(1);
      setSelectedMomentId(momentExists ? lastMomentId : '');
      setIsCreatingNewMoment(false);
      setNewMomentTitle('');
      setNewMomentDate(defaultDate);
      setNewMomentJnnn('IMP');
      setMoment1Validated(false);
      setSelectedPostId('');
      setIsCreatingNewPost(false);
      setPost2Validated(false);
      setNoteTitle('');
      setNoteContent('');
    }
  }, [isOpen, photoData, file, moments]);

  if (!isOpen) return null;

  // Récupérer moment sélectionné
  const selectedMoment = selectedMomentId ? moments.find(m => m.id === selectedMomentId) : null;
  const momentPosts = selectedMoment?.posts || [];

  // Résumés pour headers fermés
  const momentSummary = isCreatingNewMoment
    ? newMomentTitle || '(nouveau moment)'
    : selectedMoment
      ? selectedMoment.displayTitle || selectedMoment.title
      : '';

  const postSummary = isCreatingNewPost
    ? '(nouvelle note)'
    : selectedPostId
      ? momentPosts.find(p => p.id === selectedPostId)?.title || 'Post sélectionné'
      : '';

  // Handlers
  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConvert({
      momentId: isCreatingNewMoment ? null : selectedMomentId,
      newMoment: isCreatingNewMoment ? {
        title: newMomentTitle.trim(),
        date: newMomentDate,
        jnnn: newMomentJnnn.trim() || 'IMP'
      } : null,
      postId: isCreatingNewPost ? null : selectedPostId,
      noteTitle: noteTitle.trim() || null,
      noteContent: noteContent.trim() || null
    });
    onClose();
  };

  // Sélection moment dans menu déroulant
  const handleMomentSelect = (e) => {
    const momentId = e.target.value;
    setSelectedMomentId(momentId);

    if (momentId) {
      // Sauvegarder
      localStorage.setItem('mekong_lastSelectedMomentId', momentId);

      // Valider et ouvrir volet 2
      setMoment1Validated(true);
      setOpenPanel(2);
    }
  };

  // Toggle création moment
  const handleToggleCreateMoment = () => {
    setIsCreatingNewMoment(!isCreatingNewMoment);
    setSelectedMomentId('');
    setMoment1Validated(false);

    if (!isCreatingNewMoment) {
      // Réinitialiser formulaire
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
    }
  };

  // Valider création moment
  const handleValidateNewMoment = () => {
    if (!newMomentTitle.trim()) {
      alert('Veuillez saisir un titre pour le nouveau moment');
      return;
    }
    if (!newMomentDate) {
      alert('Veuillez saisir une date pour le nouveau moment');
      return;
    }

    setMoment1Validated(true);
    setOpenPanel(2);
  };

  // Sélection post dans menu déroulant
  const handlePostSelect = (e) => {
    const postId = e.target.value;
    setSelectedPostId(postId);

    if (postId) {
      setPost2Validated(true);
      // Si post existant → confirmer directement
      handleConfirm();
    }
  };

  // Toggle création post
  const handleToggleCreatePost = () => {
    setIsCreatingNewPost(!isCreatingNewPost);
    setSelectedPostId('');
    setPost2Validated(false);

    if (!isCreatingNewPost) {
      // Passer à création note → ouvrir volet 3
      setPost2Validated(true);
      setOpenPanel(3);
    }
  };

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
        <div className="p-6 space-y-3">

          {/* ========== VOLET 1 : MOMENT ASSOCIÉ ========== */}
          <div className={`border rounded-lg transition-all ${
            moment1Validated
              ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
              : 'border-purple-200 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10'
          }`}>
            {/* Header */}
            <button
              onClick={() => setOpenPanel(openPanel === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
            >
              <div className="flex items-center space-x-2">
                <span className={`text-lg ${moment1Validated ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  ✨
                </span>
                <h4 className={`font-medium ${
                  moment1Validated
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-purple-900 dark:text-purple-100'
                }`}>
                  Moment associé
                </h4>
                {moment1Validated && momentSummary && (
                  <>
                    <span className="text-gray-400">:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{momentSummary}</span>
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 ml-1" />
                  </>
                )}
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${
                openPanel === 1 ? 'rotate-90' : ''
              }`} />
            </button>

            {/* Contenu */}
            {openPanel === 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {isCreatingNewMoment ? (
                  // Mode création
                  <div className="space-y-3">
                    <button
                      onClick={handleToggleCreateMoment}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      ← Sélectionner un moment existant
                    </button>

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
                          En-tête (Jnnn)
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

                    <div className="flex justify-end">
                      <button
                        onClick={handleValidateNewMoment}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode sélection
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedMomentId}
                      onChange={handleMomentSelect}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Sélectionner un moment...</option>
                      {moments.map(moment => (
                        <option key={moment.id} value={moment.id}>
                          {moment.displayTitle || moment.title} - {moment.date}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleToggleCreateMoment}
                      className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap"
                    >
                      Créer un nouveau moment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========== VOLET 2 : POST/NOTE ASSOCIÉ ========== */}
          {moment1Validated && (
            <div className={`border rounded-lg transition-all ${
              post2Validated
                ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
                : 'border-blue-200 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10'
            }`}>
              {/* Header */}
              <button
                onClick={() => setOpenPanel(openPanel === 2 ? 0 : 2)}
                className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-lg ${post2Validated ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    📝
                  </span>
                  <h4 className={`font-medium ${
                    post2Validated
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-blue-900 dark:text-blue-100'
                  }`}>
                    Post/note associé
                  </h4>
                  {post2Validated && postSummary && (
                    <>
                      <span className="text-gray-400">:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{postSummary}</span>
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 ml-1" />
                    </>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${
                  openPanel === 2 ? 'rotate-90' : ''
                }`} />
              </button>

              {/* Contenu */}
              {openPanel === 2 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedPostId}
                      onChange={handlePostSelect}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={momentPosts.length === 0}
                    >
                      <option value="">
                        {momentPosts.length > 0 ? 'Sélectionner un post/note...' : 'Aucun post dans ce moment'}
                      </option>
                      {momentPosts.map(post => (
                        <option key={post.id} value={post.id}>
                          {post.title || 'Post sans titre'} ({post.category === 'user_added' ? 'Note' : 'Post Mastodon'})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleToggleCreatePost}
                      className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                    >
                      Créer une nouvelle note
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== VOLET 3 : TEXTE DU POST ========== */}
          {post2Validated && isCreatingNewPost && (
            <div className="border border-amber-200 dark:border-amber-700 rounded-lg bg-amber-50/30 dark:bg-amber-900/10">
              {/* Header */}
              <button
                onClick={() => setOpenPanel(openPanel === 3 ? 0 : 3)}
                className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg text-amber-600 dark:text-amber-400">📄</span>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Texte du post
                  </h4>
                  {(noteTitle || noteContent) && (
                    <>
                      <span className="text-gray-400">:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{noteTitle || 'Texte ajouté'}</span>
                    </>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${
                  openPanel === 3 ? 'rotate-90' : ''
                }`} />
              </button>

              {/* Contenu */}
              {openPanel === 3 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Titre du post
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
                        Contenu du post (max 500 caractères)
                      </label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Ajoutez une description détaillée..."
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

          {/* Confirmer uniquement si création nouvelle note */}
          {post2Validated && isCreatingNewPost && (
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
