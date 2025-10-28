# Guide de développement - Mémoire du Mékong v2.6

**Dernière mise à jour : Phase 18 - Navigation & Système de liens**  
**Date : 20 octobre 2025**

---

## 📋 Table des matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture générale](#architecture-générale)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Composants principaux](#composants-principaux)
5. [Système visuel unifié](#système-visuel-unifié)
6. [Gestion des photos](#gestion-des-photos)
7. [Messages et sessions](#messages-et-sessions)
8. [Système de notifications](#système-de-notifications)
9. [Système de thèmes](#système-de-thèmes)
10. [**Navigation et liens internes** ⭐](#navigation-et-liens-internes)
11. [Interface utilisateur](#interface-utilisateur)
12. [Bonnes pratiques](#bonnes-pratiques)
13. [Méthodologie de travail](#méthodologie-de-travail)
14. [Phases complétées](#phases-complétées)
15. [Roadmap : Phase 18](#roadmap-phase-18)

---

## 🎯 Vue d'ensemble du Projet

### **Intention**

"Mémoire du Mékong" est une application web progressive (PWA) conçue comme un **carnet d'expériences de voyage interactif**. L'objectif est de transformer une simple chronologie de voyage en une exploration thématique et immersive des souvenirs avec un **système conversationnel** permettant de relier et d'enrichir les contenus.

### **Fonctionnalités Clés**

- **🗂️ Données Centralisées :** Stockage sur Google Drive
- **✨ Navigation par Moments :** Unités thématiques (1+ jours)
- **⏱️ Timeline Interactive :** Frise chronologique visuelle
- **📰 Contenu Riche :** Articles Mastodon + galeries photos
- **💬 Sessions conversationnelles :** Dialogues autour des souvenirs
- **🔗 Liens internes :** Références entre chats et souvenirs
- **🔔 Notifications push :** Communication asynchrone entre utilisateurs
- **🏷️ Thèmes personnalisés :** Organisation thématique des contenus
- **⚙️ Synchronisation Automatique :** Connexion Drive au démarrage

---

## 🏗 Architecture générale

### Stack technique

- **React 18** (hooks, refs, forwardRef, useMemo)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Lucide React** (icônes)
- **Google Drive API** (stockage + notifications)

### Pattern architectural

- **MVVM-like** : DataManager ↔ useAppState ↔ Components
- **Pub/Sub** : Listeners pour synchronisation
- **Repository** : DriveSync pour abstraction stockage
- **Window Callbacks** : Communication TopBar ↔ Pages (⚠️ À refactorer Phase 18e)
- **Notification System** : NotificationManager + polling Drive
- **Theme System** : ThemeAssignments (Map-based) + theme-assignments.json
- **Link System** : ContentLinks (Map bidirectionnelle) + content-links.json ⭐ NEW

---

## 📁 Structure des fichiers

```
src/
├── components/
│   ├── App.jsx                    # ✅ v2.5 (Phase 18a - Bottom contextuelle)
│   ├── Navigation.jsx             # ✅ v5.0 (Phase 18a - Bouton dynamique)
│   ├── UnifiedTopBar.jsx          # ✅ v2.8 (Phase 18a - Settings dropdown)
│   ├── PhotoViewer.jsx            # v2.7
│   ├── ThemeModal.jsx             # v1.0
│   ├── SessionCreationModal.jsx   # v1.1
│   ├── LinkedContent.jsx          # ⭐ NEW Phase 18b
│   ├── SessionListModal.jsx       # ⭐ NEW Phase 18c
│   └── pages/
│       ├── MemoriesPage.jsx       # ✅ v7.1 (Phase 18b - Mode sélection)
│       ├── SessionsPage.jsx       # ✅ v6.3 (Phase 18d - Nouveaux messages)
│       ├── ChatPage.jsx           # ✅ v2.5 (Phase 18b - Liens + input)
│       └── SettingsPage.jsx       # v4.2
├── core/
│   ├── dataManager.js             # ✅ v3.7 (Phase 18b - Support liens)
│   ├── ContentLinks.js            # ⭐ NEW Phase 18b/c
│   ├── ConnectionManager.js       # v0.9.0
│   ├── DriveSync.js               # Pagination (pageSize: 1000)
│   ├── NotificationManager.js     # v1.0
│   └── ThemeAssignments.js        # v1.0
├── hooks/
│   └── useAppState.js             # ✅ v2.1 (Phase 18b - addLink, getLinkedSessions)
└── utils/
    ├── sessionUtils.js            # v2.0
    ├── themeUtils.js              # v1.0
    └── linkUtils.js               # ⭐ NEW Phase 18b
```

---

## 

---

## 🔧 Méthodologie de travail

### Ce qui fonctionne

1. **Étapes incrémentales** : Petites modifications testables
2. **Tests immédiats** : Vérifier après chaque changement
3. **Documentation synchrone** : Mettre à jour le guide en même temps
4. **Git commits fréquents** : Historique clair
5. **Analyse méthodique** : Logs → hypothèses → tests
6. **Fichiers complets** : Éviter copier/coller fragmenté
7. **Console.log debugging** : Tracer exécution pas à pas
8. **Prendre du recul** : Si bug >3 tentatives, revoir approche globale

### Checklist debug

- [ ] Console logs (erreurs rouges)
- [ ] État app (`app.masterIndex`, `app.sessions`)
- [ ] Fichiers Drive (vérifier JSON)
- [ ] localStorage.clear() si structure changée
- [ ] Hard refresh après déploiement
- [ ] Vérifier `currentUser.id` vs `currentUser`
- [ ] Inspecter DOM (éléments cachés ?)
- [ ] Tests console rapides avant modification code

---

## ✨ Phases complétées depuis phase 13

### Phase 13B : Messages riches + TopBar unifiée + Photos Mastodon

**Date :** Décembre 2024

**Réalisations :**

- Messages avec photos dans bulles utilisateur
- TopBar contextuelle unifiée
- Photos Mastodon avec mapping plat
- Stats corrigées dans SettingsPage

### Phase 14.1 : Dashboard sessions (Option A+)

**Date :** Janvier 2025

**Réalisations :**

- Dashboard avec volets Activité/Suggestions/Stats
- Filtres par statut (onglets)
- Toggle vue cards/compact
- **Note :** Dashboard supprimé en Phase 14.2 (redondant)

### Phase 14.2 : Niveau 1 Minimalisme

**Date :** Janvier 2025

**Réalisations :**

- **SUPPRESSION Dashboard** (maximum espace pour sessions)
- TopBar enrichie avec badges cliquables (🔴🟡🔵✨)
- Liste groupée automatique par statut
- Sections repliables avec mémorisation
- Filtrage 1 clic via badges TopBar
- **70% moins de code** vs v5.1

### Phase 14.3 : Système visuel unifié

**Date :** 5 janvier 2025

**Réalisations :**

- **Philosophie design clarifiée** : Couleurs discrètes + Icônes explicites
- TopBar MemoriesPage v2.0 :
  - Dropdown filtre (Tous/Non explorés/Avec articles/Avec photos)
  - Options affichage inline [📄] [🖼️] [📸]
  - Suppression menu "..." (options désormais visibles)
- Filtrage intelligent moments avec callbacks exposés
- Icônes unifiées : 💬 Sessions, ✨ Moments non explorés
- Badge ✨ redirige vers Memories

### Phase 15 : Système de notifications push 🔔

**Date :** 6 janvier 2025

**Réalisations :**

- NotificationManager.js v1.0
- Stockage notifications.json sur Drive
- Système de statuts avec 4 priorités
- TopBar Sessions avec badges cliquables
- Bouton 🔔 dans ChatPage
- Auto markAsRead à l'ouverture/réponse
- sessionUtils v2.0 avec SESSION_STATUS.NOTIFIED

---

### Phase 16 : Système de thèmes 🏷️ ⭐

**Date :** 18 octobre 2025

**Objectif :** Permettre l'organisation thématique des contenus (temples, gastronomie, transport, etc.)

**Réalisations :**

**Architecture séparée (décision clé) :**

- ✅ `ThemeAssignments.js` v1.0 : Manager Map-based
- ✅ `theme-assignments.json` : Fichier Drive séparé
- ✅ `themeUtils.js` v1.0 : Utilitaires (THEME_COLORS, generateThemeId, countThemeContents)
- ✅ Clés standardisées : `moment:X`, `post:X`, `photo:X`

**Composants modifiés :**

- ✅ `SettingsPage.jsx` v4.2 :
  - Section "Mes thèmes" avec CRUD
  - Formulaire création (nom + emoji + couleur)
  - Liste avec compteurs dynamiques
  - Modal React pour suppression (pas confirm navigateur)
- ✅ `ThemeModal.jsx` v1.0 : Composant réutilisable
  - Props flexibles (moment/post/photo)
  - Options propagation intelligentes
  - Indication "(actuel)" sur thèmes assignés
  - Message unifié : "Gérer les thèmes"
- ✅ `MemoriesPage.jsx` v7.0 :
  - Barre filtres thèmes (toggle TopBar 🏷️)
  - Calcul `themeStats` avec `useMemo`
  - Bouton 🏷️ sur MomentHeader
  - Badge thèmes au niveau sous-titre (pastille numérotée)
- ✅ `UnifiedTopBar.jsx` v2.5 :
  - Bouton toggle thèmes avec compteur
  - Intégration contextuelle Memories
- ✅ `PhotoViewer.jsx` v2.7 :
  - Bouton thèmes avec pastille si >0
  - Icône uniformisée (light si 0, pleine si >0)
- ✅ `App.jsx` v2.3 :
  - State `isThemeBarVisible`
  - Props passées à composants

**Propagation intelligente :**

- Moment → Articles + Photos articles + Photos moment (options)
- Post → Photos de l'article (option)
- Photo → Direct (pas d'options)

**Différences avec plan original :**

| Aspect           | Prévu                   | Réalisé                       | Impact                                    |
| ---------------- | ----------------------- | ----------------------------- | ----------------------------------------- |
| Architecture     | Thèmes dans masterIndex | ThemeAssignments séparé       | ✅ Meilleur (performance + maintenabilité) |
| Propagation      | Héritage auto simple    | Options dans modal            | ✅ Meilleur (contrôle granulaire)          |
| Sélection photos | Longpress bulk          | Pas implémenté                | ⚠️ À ajouter Phase 16b si besoin          |
| Badge placement  | Partout                 | Stratégique (header + viewer) | ✅ Meilleur (interface épurée)             |

**Décisions architecturales clés :**

1. **ThemeAssignments séparé** (vs intégré masterIndex)
   - Raison : Pas de régénération masterIndex à chaque tag
   - Avantage : Performance Map-based vs array search
2. **Modal React suppression** (vs confirm navigateur)
   - Raison : confirm() peut être bloqué par paramètres navigateur
   - Avantage : UX cohérente garantie
3. **Pas de sélection multiple photos** (report Phase 16b)
   - Raison : Complexité vs usage réel
   - Workaround : Tag par moment avec propagation

**Impact utilisateur :**

- ✅ Création thème : 30 secondes

- ✅ Tag moment : 10 secondes (avec propagation)

- ✅ Filtrage : 1 clic

- ⚠️ Tag 100 photos individuellement : Pénible (→ Phase 16b)
  
  ---
  
  ## Phase 18 :  Navigation Chat ↔ Memories avec attachements photos et liens internes
  
  ---

##### ✅ PHASE 18b COMPLÉTÉE - Système de liens souvenirs

###**

#### **Étape 2 : Mode sélection (100%)**

- ✅ Navigation Chat → [🔗+] → Memories (mode sélection) → Sélection → Retour Chat
- ✅ État `selectionMode` + `navigationContext.pendingLink`
- ✅ TopBar : Badge "🔗 Sélectionner" + bouton ❌
- ✅ Conservation filtres essentiels (📄 📷 🏷️) en mode sélection

#### **Étape 3a-b : LinkedContent & UX (100%)**

- ✅ **LinkedContent.jsx v1.0** créé
  - Photo : 200px avec hover "📷 Voir galerie"
  - Post : Card bleue (titre + preview + compteur photos)
  - Moment : Card violette (titre + stats + liste posts)
- ✅ **Interface unifiée** : Boutons [🔗] discrets gris/violet
- ✅ **Pastilles [🔗]** sur thumbnails photos
- ✅ **Bouton [🔗]** dans PhotoViewer

- [ ] 
  
  #### Étape 3c : LinkedContent & UX (100%)**Navigation retour (1h)** -
  
  [ ] Clic sur lien dans message → Navigation Memories - [ ] Auto-open + scroll vers contenu cible -
  
  Support 3 types : moment (ouvrir), post (trouver parent + scroll), photo (visionneuse)
  
  #### ---
  
  ---
  
  ## Phase 19 : Structure session enrichie
  
  ---

### Phase 19 - Structure Session enrichie

**Objectif :** Clarifier les relations Session ↔ Contenu avec structure explicite### 

#### **19 A : Fondations données** (prioritaire)

- **Migrer gameId → momentId** dans sessions existantes
- ✅ **Ajouter originContent** dans `createSession()`

#### **19 B : Thèmes sessions**

✅ Étendre `ThemeAssignments` pour supporter `session:X` 

 ✅ Bouton 🏷️ dans ChatPage header (comme MemoriesPage) 

 ✅ Affichage badges thèmes dans SessionsPage

✅ Affichage badges Session dans MemoriesPage : indique si leséléments de mémoires (Moment, post, photoduMoment ) sont liés à des Chat avec 💬et un nombre



### **19 C : Affichage origine enrichi**

7. ✅ Améliorer en-tête ChatPage : ``` J012-Hoi An 📍 Créé depuis : Photo "Dragon doré" 🏷️ Temples · Architecture



### **19 D : Compteurs 💬 dans Memories**

8. ✅ Fonction `getAllSessionsForContent()` (union origine + liens)
9. ✅ Pastilles 💬 sur moments/posts/photos
10. ✅ Modal liste sessions au clic
11. ✅ Navigation vers session depuis modal

---

**Version du guide :** 2.6.2  
**Dernière révision :** Phase 19 spécifiée - Navigation & Liens  
**Prochaine implémentation :** Phase 19b 3 (Affichage badges thèmes dans SessionsPage)
