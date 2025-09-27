/**
 * SettingsPage v2.8 - Syntax Fix
 * Corrects the React import syntax error.
 */
import React, { useState, useEffect, useCallback } from 'react'; // ✅ LIGNE CORRIGÉE
import { useAppState } from '../../hooks/useAppState.js';
import { masterIndexGenerator } from '../../core/MasterIndexGenerator.js';
import { mastodonData } from '../../core/MastodonData.js';
import { dataManager } from '../../core/dataManager.js';
import { RefreshCw, Wrench, Database, BookOpen, HardDrive } from 'lucide-react';

export default function SettingsPage() {
  const app = useAppState();
  const [operations, setOperations] = useState({ generating: false, currentStep: '' });
  const [dataStatus, setDataStatus] = useState({ mastodonCount: 0, momentCount: 0 });

  const loadDataStatus = useCallback(() => {
      const mastodonStats = mastodonData.getStats();
      const photoStats = app.masterIndex?.metadata || {};
      setDataStatus({
          mastodonCount: mastodonStats.totalPosts || 0,
          momentCount: photoStats.total_moments || 0,
      });
  }, [app.masterIndex]);

  useEffect(() => {
    loadDataStatus();
  }, [loadDataStatus]);

  const handleIndexRegeneration = async () => {
    setOperations({ generating: true, currentStep: 'Importing Mastodon posts...' });
    try {
      await mastodonData.importFromGoogleDrive();
      loadDataStatus();
      
      setOperations({ generating: true, currentStep: 'Generating new index...' });
      const generateResult = await masterIndexGenerator.generateMomentsStructure();
      if (!generateResult.success) throw new Error(generateResult.error);

      setOperations({ generating: true, currentStep: 'Updating application state...' });
      await dataManager.reloadMasterIndex();

      setOperations({ generating: false, currentStep: '✅ Regeneration complete!' });
      loadDataStatus();
    } catch (error) {
      console.error('❌ Regeneration error:', error);
      setOperations({ generating: false, currentStep: `❌ Error: ${error.message}` });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Settings and Synchronization</h1>
      </div>

       <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Database className="w-6 h-6 mr-3 text-purple-500" />Data Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center"><BookOpen className="w-5 h-5 mr-2 text-blue-500" />Mastodon Posts</h3>
                  <p className="text-2xl font-bold">{dataStatus.mastodonCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold flex items-center"><HardDrive className="w-5 h-5 mr-2 text-green-500" />Moments</h3>
                  <p className="text-2xl font-bold">{dataStatus.momentCount}</p>
              </div>
          </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Wrench className="w-6 h-6 mr-3 text-amber-500" />Actions</h2>
        <button
          onClick={handleIndexRegeneration}
          disabled={operations.generating || !app.connection.isOnline}
          className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center text-lg"
        >
          <RefreshCw className={`w-5 h-5 mr-3 ${operations.generating ? 'animate-spin' : ''}`} />
          {operations.generating ? 'Synchronization in progress...' : 'Start Full Synchronization'}
        </button>
        {operations.currentStep && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm font-medium">{operations.currentStep}</p>
            </div>
        )}
      </div>
    </div>
  );
}

