/**
 * ThemeModal.jsx v1.4 - Message uniforme + compact
 */
import React, { useState, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { THEME_COLORS } from '../utils/themeUtils.js';

export default function ThemeModal({ 
  isOpen, 
  onClose, 
  availableThemes,
  currentThemes,
  onSave,
  title = "Assigner des thèmes",
  description = null,
  contentType = null,
  momentData = null,
  postData = null
}) {
  const [selectedThemes, setSelectedThemes] = useState([]);
  
  const [propagationOptions, setPropagationOptions] = useState({
    applyToPosts: false,
    applyToPostPhotos: false,
    applyToMomentPhotos: false,
    applyToPhotos: false
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedThemes(currentThemes || []);
      setPropagationOptions({
        applyToPosts: false,
        applyToPostPhotos: false,
        applyToMomentPhotos: false,
        applyToPhotos: false
      });
    }
  }, [isOpen, currentThemes]);

  if (!isOpen) return null;

  const toggleTheme = (themeId) => {
    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(prev => prev.filter(t => t !== themeId));
    } else {
      setSelectedThemes(prev => [...prev, themeId]);
    }
  };

  const handleSave = () => {
    onSave(selectedThemes, propagationOptions);
    onClose();
  };

  const handleCancel = () => {
    setSelectedThemes(currentThemes || []);
    onClose();
  };

  const handleCreateTheme = () => {
    onClose();
    
    if (window.dataManager) {
      window.dataManager.updateCurrentPage('settings');
      
      setTimeout(() => {
        const themesSection = document.querySelector('[data-section="themes"]');
        if (themesSection && !themesSection.getAttribute('data-open')) {
          themesSection.click();
        }
        
        setTimeout(() => {
          themesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 200);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-1 border-b border-gray-200 sticky top-0 bg-white z-10">
  <div>
    <div className="flex items-center space-x-2">
      <Tag className="w-5 h-5 text-amber-600" />
      <h3 className="font-semibold text-gray-900">Assignez les thèmes suivants à :</h3>
    </div>
  </div>
  <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
    <X className="w-5 h-5 text-gray-500" />
  </button>
</div>

        {/* ✅ PREVIEW POST */}
        {contentType === 'post' && postData && (
          <div className="px-4 py-2.5 border-b border-gray-200 bg-amber-100">
            <p className="text-sm text-blue-900 mb-0">
            <span className="font-semibold">📄 "{postData.postTitle}"</span>  
             et à ses :</p>
            {postData.photoCount > 0 && (
              <label className="flex items-center text-sm text-blue-800 cursor-pointer hover:text-blue-900 ml-6">
                <input
                  type="checkbox"
                  checked={propagationOptions.applyToPhotos}
                  onChange={(e) => setPropagationOptions(prev => ({
                    ...prev,
                    applyToPhotos: e.target.checked
                  }))}
                  className="w-3.5 h-3.5 text-blue-600 rounded mr-2"
                />
                <span>📸 {postData.photoCount} photo{postData.photoCount > 1 ? 's' : ''}</span>
              </label>
            )}
          </div>
        )}

        {/* ✅ PREVIEW MOMENT */}
        {contentType === 'moment' && momentData && (
          <div className="px-4 py-2.5 border-b border-gray-200 bg-amber-100">
            <p className="text-sm text-blue-900 mb-0">
              <span className="font-semibold">🗺️ "{momentData.momentTitle}"</span> 
             et à ses:</p>
            <div className="space-y-1 text-sm text-purple-800 ml-6">
              {momentData.stats.postCount > 0 && (
                <label className="flex items-center cursor-pointer hover:text-purple-900">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToPosts}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToPosts: e.target.checked
                    }))}
                    className="w-3.5 h-3.5 text-purple-600 rounded mr-2"
                  />
                  <span>📄 {momentData.stats.postCount} article{momentData.stats.postCount > 1 ? 's' : ''}</span>
                </label>
              )}
              
              {momentData.stats.photoMastodonCount > 0 && (
                <label className="flex items-center cursor-pointer hover:text-purple-900 ml-5">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToPostPhotos}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToPostPhotos: e.target.checked
                    }))}
                    className="w-3.5 h-3.5 text-purple-600 rounded mr-2"
                  />
                  <span>📸 {momentData.stats.photoMastodonCount} photo{momentData.stats.photoMastodonCount > 1 ? 's' : ''} (articles)</span>
                </label>
              )}
              
              {momentData.stats.photoMomentCount > 0 && (
                <label className="flex items-center cursor-pointer hover:text-purple-900">
                  <input
                    type="checkbox"
                    checked={propagationOptions.applyToMomentPhotos}
                    onChange={(e) => setPropagationOptions(prev => ({
                      ...prev,
                      applyToMomentPhotos: e.target.checked
                    }))}
                    className="w-3.5 h-3.5 text-purple-600 rounded mr-2"
                  />
                  <span>📸 {momentData.stats.photoMomentCount} photo{momentData.stats.photoMomentCount > 1 ? 's' : ''} (moment)</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Liste thèmes */}
        <div className="p-4">
          {availableThemes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun thème créé pour l'instant</p>
              <p className="text-sm mt-2">Créez vos thèmes dans Réglages</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableThemes.map(theme => {
  const isSelected = selectedThemes.includes(theme.id);
  const wasInitiallySelected = currentThemes.includes(theme.id); // ✅ NOUVEAU
  const colorClasses = THEME_COLORS[theme.color] || THEME_COLORS.purple;
  
  return (
    <button
      key={theme.id}
      onClick={() => toggleTheme(theme.id)}
      className={`flex items-center space-x-1 p-0 rounded-lg border-2 transition-all ${
        isSelected 
          ? `${colorClasses.bg} ${colorClasses.border}` 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected ? colorClasses.border : 'border-gray-300'
      }`}>
        {isSelected && <div className={`w-2.5 h-2.5 rounded ${colorClasses.badge}`} />}
      </div>
      
      <span className="text-lg flex-shrink-0">{theme.icon}</span>
      <span className={`flex-1 text-left font-medium text-sm truncate ${
        isSelected ? colorClasses.text : 'text-gray-700'
      }`}>
        {theme.name}
        {wasInitiallySelected && ( // ✅ NOUVEAU
          <span className="text-xs opacity-60 ml-1">(actuel)</span>
        )}
      </span>
    </button>
  );
})}
              
              <button
                onClick={handleCreateTheme}
                className="flex items-center justify-center space-x-2 p-1 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all"
                title="Ouvrir Réglages → Thèmes"
              >
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Créer un thème</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-2 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={availableThemes.length === 0}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Valider {selectedThemes.length > 0 && `(${selectedThemes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}