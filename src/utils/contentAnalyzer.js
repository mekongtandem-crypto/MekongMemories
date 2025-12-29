/**
 * contentAnalyzer.js v3.0 - Analyse de contenu sans API externe
 * 🧠 Analyse textuelle basique pour détecter thèmes, personnes, émotions
 *
 * Fonctionnalités :
 * - Détection thèmes par mots-clés (nourriture, transport, culture...)
 * - Extraction noms propres (personnes mentionnées)
 * - Détection tons émotionnels (patterns linguistiques)
 * - Statistiques photos (comptage, orphelines, users)
 *
 * Note : Version basique sans IA. Peut être étendue avec Claude API plus tard.
 */

/**
 * Dictionnaires de mots-clés par thème
 */
const THEME_KEYWORDS = {
  nourriture: {
    label: '🍜 Nourriture',
    keywords: [
      'restaurant', 'manger', 'mangé', 'plat', 'cuisine', 'repas', 'marché',
      'food', 'street food', 'buffet', 'petit déjeuner', 'déjeuner', 'dîner',
      'riz', 'nouilles', 'soupe', 'poisson', 'viande', 'légumes', 'fruits',
      'délicieux', 'savoureux', 'goûter', 'spécialité', 'culinaire'
    ]
  },

  transport: {
    label: '🚣 Transport',
    keywords: [
      'bus', 'bateau', 'moto', 'tuk-tuk', 'tuk tuk', 'train', 'avion',
      'vélo', 'marche', 'taxi', 'transport', 'trajet', 'route', 'chemin',
      'voyage', 'déplacement', 'conduire', 'rouler', 'naviguer'
    ]
  },

  culture: {
    label: '⛩️ Culture',
    keywords: [
      'temple', 'wat', 'musée', 'cérémonie', 'tradition', 'festival',
      'bouddha', 'moine', 'prière', 'offrande', 'rituel', 'spirituel',
      'patrimoine', 'histoire', 'culture', 'local', 'authentique',
      'architecture', 'sculpture', 'art'
    ]
  },

  nature: {
    label: '🏞️ Nature',
    keywords: [
      'montagne', 'rivière', 'mékong', 'forêt', 'cascade', 'paysage',
      'vue', 'panorama', 'jungle', 'parc', 'nature', 'verdure', 'arbre',
      'coucher de soleil', 'lever de soleil', 'ciel', 'nuage', 'eau',
      'plage', 'lac', 'île', 'colline'
    ]
  },

  rencontres: {
    label: '👥 Rencontres',
    keywords: [
      'rencontre', 'rencontrer', 'rencontré', 'guide', 'famille', 'ami',
      'gens', 'personnes', 'local', 'habitants', 'discuter', 'parler',
      'conversation', 'échanger', 'sympathique', 'accueil', 'hospitalité',
      'sourire', 'gentil', 'chaleureux'
    ]
  },

  activites: {
    label: '🎯 Activités',
    keywords: [
      'visite', 'visiter', 'visité', 'explorer', 'découvrir', 'balade',
      'randonnée', 'trek', 'promenade', 'excursion', 'activité',
      'nager', 'plonger', 'kayak', 'marcher', 'grimper', 'observer'
    ]
  },

  hebergement: {
    label: '🏠 Hébergement',
    keywords: [
      'hôtel', 'guest house', 'auberge', 'chambre', 'dormir', 'nuit',
      'lit', 'repos', 'hébergement', 'accueil', 'logement', 'maison'
    ]
  }
};

/**
 * Patterns pour détection émotions
 */
const EMOTION_PATTERNS = {
  joyeux: {
    label: '😄 Joyeux',
    patterns: [
      'super', 'génial', 'magnifique', 'incroyable', 'top', 'excellent',
      'merveilleux', 'fantastique', 'content', 'heureux', 'joie', 'ravi',
      '😄', '😊', '😃', '😁', '🤩', '❤️', '💕'
    ]
  },

  surpris: {
    label: '😮 Surpris',
    patterns: [
      'surprise', 'surprenant', 'inattendu', 'wow', 'incroyable',
      'étonnant', 'impressionnant', 'jamais vu', 'découverte',
      '😮', '😲', '🤯'
    ]
  },

  paisible: {
    label: '😌 Paisible',
    patterns: [
      'calme', 'paisible', 'tranquille', 'serein', 'zen', 'relaxant',
      'reposant', 'apaisant', 'doux', 'silence', 'quiétude',
      '😌', '🧘', '☮️'
    ]
  },

  drole: {
    label: '😅 Drôle',
    patterns: [
      'drôle', 'rigolo', 'marrant', 'amusant', 'rire', 'lol', 'mdr',
      'hilarant', 'comique', 'fou rire', 'délire',
      '😂', '🤣', '😅', '😆'
    ]
  },

  fatigue: {
    label: '😴 Fatigant',
    patterns: [
      'fatigué', 'épuisé', 'crevé', 'dur', 'difficile', 'chaud',
      'long', 'épuisant', 'intense', 'éprouvant',
      '😴', '😓', '🥵'
    ]
  }
};

/**
 * Analyser tous les contenus (posts, messages, notes)
 * @param {object} masterIndex - Master index des moments
 * @param {array} sessions - Sessions de chat
 * @returns {object} - Résultats d'analyse
 */
export function analyzeAllContent(masterIndex, sessions = []) {
  console.log('🧠 Analyse de contenu démarrée...');

  const results = {
    themes: {},
    emotions: {},
    people: new Set(),
    photos: {
      total: 0,
      byDay: 0,
      byUser: {},
      orphans: 0,
      withMultipleUsers: 0
    },
    stats: {
      totalMoments: 0,
      totalPosts: 0,
      totalMessages: 0,
      totalWords: 0
    }
  };

  // Initialiser compteurs thèmes
  Object.keys(THEME_KEYWORDS).forEach(key => {
    results.themes[key] = {
      label: THEME_KEYWORDS[key].label,
      count: 0,
      moments: new Set()
    };
  });

  // Initialiser compteurs émotions
  Object.keys(EMOTION_PATTERNS).forEach(key => {
    results.emotions[key] = {
      label: EMOTION_PATTERNS[key].label,
      count: 0,
      moments: new Set()
    };
  });

  // Analyser moments et posts
  if (masterIndex?.moments) {
    results.stats.totalMoments = masterIndex.moments.length;

    masterIndex.moments.forEach(moment => {
      // Analyser titre + description
      const momentText = [
        moment.title || '',
        moment.description || '',
        moment.location || ''
      ].join(' ').toLowerCase();

      _analyzeTextForThemes(momentText, moment.id, results.themes);
      _analyzeTextForEmotions(momentText, moment.id, results.emotions);
      _extractPeople(momentText, results.people);

      results.stats.totalWords += _countWords(momentText);

      // Analyser posts
      if (moment.posts) {
        results.stats.totalPosts += moment.posts.length;

        moment.posts.forEach(post => {
          const postText = [
            post.title || '',
            post.content || ''
          ].join(' ').toLowerCase();

          _analyzeTextForThemes(postText, moment.id, results.themes);
          _analyzeTextForEmotions(postText, moment.id, results.emotions);
          _extractPeople(postText, results.people);

          results.stats.totalWords += _countWords(postText);
        });
      }

      // Analyser photos
      if (moment.dayPhotos) {
        results.photos.total += moment.dayPhotos.length;

        moment.dayPhotos.forEach(photo => {
          // Compter par user
          const uploader = photo.uploadedBy || photo.user || 'unknown';
          results.photos.byUser[uploader] = (results.photos.byUser[uploader] || 0) + 1;
        });
      }
    });
  }

  // Analyser sessions/messages
  if (sessions) {
    sessions.forEach(session => {
      if (session.notes) {
        results.stats.totalMessages += session.notes.length;

        session.notes.forEach(message => {
          const messageText = (message.content || '').toLowerCase();

          _analyzeTextForThemes(messageText, `session_${session.id}`, results.themes);
          _analyzeTextForEmotions(messageText, `session_${session.id}`, results.emotions);
          _extractPeople(messageText, results.people);

          results.stats.totalWords += _countWords(messageText);
        });
      }
    });
  }

  // Calculer moyenne photos par jour
  if (results.stats.totalMoments > 0) {
    results.photos.byDay = Math.round(results.photos.total / results.stats.totalMoments);
  }

  // Convertir Sets en arrays
  results.people = Array.from(results.people);

  Object.keys(results.themes).forEach(key => {
    results.themes[key].moments = Array.from(results.themes[key].moments);
  });

  Object.keys(results.emotions).forEach(key => {
    results.emotions[key].moments = Array.from(results.emotions[key].moments);
  });

  console.log('✅ Analyse terminée:', results);
  return results;
}

/**
 * Analyser texte pour thèmes
 */
function _analyzeTextForThemes(text, momentId, themesResults) {
  Object.keys(THEME_KEYWORDS).forEach(themeKey => {
    const keywords = THEME_KEYWORDS[themeKey].keywords;

    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        themesResults[themeKey].count++;
        themesResults[themeKey].moments.add(momentId);
      }
    });
  });
}

/**
 * Analyser texte pour émotions
 */
function _analyzeTextForEmotions(text, momentId, emotionsResults) {
  Object.keys(EMOTION_PATTERNS).forEach(emotionKey => {
    const patterns = EMOTION_PATTERNS[emotionKey].patterns;

    patterns.forEach(pattern => {
      if (text.includes(pattern.toLowerCase())) {
        emotionsResults[emotionKey].count++;
        emotionsResults[emotionKey].moments.add(momentId);
      }
    });
  });
}

/**
 * Extraire noms de personnes (patterns simples)
 * Détecte : "Guide X", "avec X", "X et Y", noms capitalisés
 */
function _extractPeople(text, peopleSet) {
  // Pattern : "guide XXXX"
  const guideMatches = text.matchAll(/guide\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi);
  for (const match of guideMatches) {
    peopleSet.add(match[1]);
  }

  // Pattern : Noms capitalisés isolés (heuristique simple)
  // Note : Peut générer faux positifs (début de phrase, lieux...)
  // Pour MVP, on limite aux noms après certains mots-clés
  const nameContexts = ['avec', 'rencontré', 'famille', 'ami', 'guide'];
  nameContexts.forEach(context => {
    const regex = new RegExp(`${context}\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)`, 'gi');
    const matches = text.matchAll(regex);
    for (const match of matches) {
      peopleSet.add(match[1]);
    }
  });
}

/**
 * Compter mots dans un texte
 */
function _countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Générer défis/missions hebdomadaires basés sur analyse
 * @param {object} analysisResults - Résultats d'analyse
 * @returns {array} - Liste de missions suggérées
 */
export function generateMissions(analysisResults) {
  const missions = [];

  // Missions basées sur thèmes détectés
  const topThemes = Object.entries(analysisResults.themes)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  topThemes.forEach(([themeKey, themeData]) => {
    missions.push({
      type: 'theme_hunt',
      theme: themeKey,
      label: themeData.label,
      description: `Retrouvez 5 moments avec le thème ${themeData.label}`,
      difficulty: themeData.moments.length > 10 ? 'facile' : 'moyen'
    });
  });

  // Mission émotions
  missions.push({
    type: 'emotion_map',
    description: 'Créez la courbe émotionnelle de votre voyage',
    difficulty: 'moyen'
  });

  return missions;
}
