/**
 * StatsModal.jsx - Modal overlay pour statistiques
 */
import React from 'react';
import { X, Target, CheckCircle, MessageCircle, Camera, FileText } from 'lucide-react';
import { calculateSessionStats } from '../utils/sessionUtils.js';

export default function StatsModal({ isOpen, onClose, sessions, masterIndex, currentUser }) {
  if (!isOpen) return null;
  
  const stats = calculateSessionStats(sessions, currentUser, masterIndex);
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Statistiques globales</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Contenu */}
        <div className="p-6 space-y-6">
          
          {/* Progression moments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression du voyage</h3>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-blue-600">
                  {stats.exploredMoments}/{stats.totalMoments}
                </span>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800 mb-3">
                Moments explorés
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.exploredMoments / stats.totalMoments * 100)}%` }}
                />
              </div>
              <div className="text-xs text-blue-600 mt-2">
                {Math.round(stats.exploredMoments / stats.totalMoments * 100)}% complété
              </div>
            </div>
          </div>
          
          {/* Grid stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails</h3>
            <div className="grid grid-cols-2 gap-4">
              
              <StatCard
                icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
                value={stats.totalMessages}
                label="Messages total"
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
              
              <StatCard
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                value={stats.totalSessions}
                label="Sessions créées"
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              
              <StatCard
                icon={<Camera className="w-5 h-5 text-blue-600" />}
                value={masterIndex?.metadata?.total_photos || 0}
                label="Photos du voyage"
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              
              <StatCard
                icon={<FileText className="w-5 h-5 text-amber-600" />}
                value={masterIndex?.metadata?.total_posts || 0}
                label="Articles Mastodon"
                bgColor="bg-amber-50"
                textColor="text-amber-600"
              />
              
            </div>
          </div>
          
          {/* Répartition sessions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">État des sessions</h3>
            <div className="space-y-3">
              
              <StatusRow
                emoji="🟡"
                label="En attente de vous"
                count={stats.pendingYou}
                color="amber"
              />
              
              <StatusRow
                emoji="🔵"
                label="En attente autre utilisateur"
                count={stats.pendingOther}
                color="blue"
              />
              
              <StatusRow
                emoji="🟠"
                label="Urgent (>7 jours)"
                count={stats.stale}
                color="orange"
              />
              
              <StatusRow
                emoji="📦"
                label="Archivées"
                count={stats.archived}
                color="gray"
              />
              
            </div>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Mémoire du Mékong v2.1 • Phase 14
          </p>
        </div>
        
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className={`text-2xl font-bold ${textColor}`}>
          {value}
        </span>
      </div>
      <div className="text-xs text-gray-600 font-medium">
        {label}
      </div>
    </div>
  );
}

function StatusRow({ emoji, label, count, color }) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700'
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`text-sm font-bold px-3 py-1 rounded-full ${colorClasses[color]}`}>
        {count}
      </span>
    </div>
  );
}