# 📋 TODO - Mémoire du Mékong

_Dernière mise à jour : 03/10/2025_

---

## ✅ TERMINÉ (Phase 12)

- [x] OAuth : Token persistant 1h (évite popup refresh)
- [x] Spinner global création session
- [x] PhotoViewer : Boutons cliquables + swipe mobile
- [x] MemoriesPage : Timeline cachée par défaut
- [x] Bug critique résolu : Permissions Drive complètes

---

## 🔴 Priorité 1 - En cours (Phase 13)

### Messages riches - 1er message contextuel
- [ ] Refonte schéma message (type: text/photo/post/moment)
- [ ] Création session depuis photo → affiche photo en 1er message
- [ ] Création session depuis post → affiche texte post en 1er message
- [ ] Création session depuis moment → message actuel OK

### ChatPage améliorations
- [ ] Header auto-hide (comme MemoriesPage)
- [ ] Minimisation titre (focus sur conversation)
- [ ] Bouton "Fusionner messages" (UX à définir)

---

## 🟡 Priorité 2 - UX & Navigation

- [ ] SessionsPage : Liste améliorée (tri, filtres, recherche)
- [ ] Timeline : Refonte complète navigation précise
- [ ] MemoriesPage : Indicateurs sessions actives sur moments

---

## 🟢 Priorité 3 - Features avancées

### Page État Mémoriel
- [ ] Conception dashboard (statuts : ouvert/en cours/attente/clos)
- [ ] Visualisation moments traités/non traités
- [ ] Système nudge interne (inviter à répondre)
- [ ] Stats globales (sections Settings)

### Page Jeux
- [ ] Conception mini-jeux de mémoire
- [ ] Quiz sur les moments
- [ ] Défis photo/reconnaissance

---

## 🔵 Nice-to-have - Non urgent

- [ ] PhotoViewer : Zoom pinch natif (lib externe)
- [ ] Settings : Menu raccourcis clavier complet
- [ ] Export sessions (JSON/PDF)
- [ ] PWA : Mode hors ligne robuste
- [ ] Notifications push/SMS (après nudge interne)

---

## 🐛 Bugs mineurs

- [ ] Léger délai spinner → ChatPage (optimisation React)
- [ ] Process connexion visible au refresh (rendre invisible ?)

---

## 📝 Notes techniques

- **OAuth** : Token 1h, renouvellement automatique
- **Refresh token** : À implémenter pour persistance >24h
- **Architecture** : Cloud-first (Drive source de vérité)
- **Déploiement** : Cloudflare Pages (auto-build)

---

## 🎯 Prochaine session

**Focus Phase 13** : Messages riches + ChatPage
1. Refonte schéma message
2. Implémentation affichage contextuel
3. Header auto-hide ChatPage
4. Tests multi-devices