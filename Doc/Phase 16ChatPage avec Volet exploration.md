Discussion et idées autour de la page CHat comme espace de travail avec des interactions discussion<-> souvenirs

Un bouton permettrait d'ouvrir un volet d'exploration des souvenirs



## 🎨 Architecture de Navigation : Les 2 niveaux clarifiés

Tu as raison, reformulons pour que ce soit cristallin :

### Niveau 1 : QUOI ? (Type de contenu)

```
┌─────────────────────────────────────┐
│ 🗂️ Explorer les souvenirs           │
├─────────────────────────────────────┤
│ [📸 Photos] [📄 Articles] [🗺️ Moments] │ ← ONGLETS PRIMAIRES
└─────────────────────────────────────┘
```

**3 types de contenus**, pas 4. Pourquoi ?  
Les **thèmes** ne sont pas un type de contenu, c'est une **façon d'organiser** les contenus.

---

### Niveau 2 : OÙ/COMMENT ? (Organisation)

**Pour chaque onglet du niveau 1, deux modes d'accès :**

```
Mode Organisation actif :
┌─────────────────────────────────────┐
│ 📸 Photos                           │
│ [📍 Par moment] [🏷️ Par thème]       │ ← TOGGLE
└─────────────────────────────────────┘
```

**Comportement du toggle :**

#### Si 📍 Par moment actif :

```
┌─────────────────────────────────────┐
│ 📸 Photos > Par moment              │
├─────────────────────────────────────┤
│ 📍 Bangkok Temple (moment actuel)   │
│ [12 photos en grille]               │
│                                     │
│ Autres moments :                    │
│ • Ayutthaya (18 photos)             │
│ • Sukhothaï (8 photos)              │
│ • Chiang Mai (25 photos)            │
│ [Voir tous les moments ▼]           │
└─────────────────────────────────────┘
```

#### Si 🏷️ Par thème actif :

```
┌─────────────────────────────────────┐
│ 📸 Photos > Par thème               │
├─────────────────────────────────────┤
│ 🏛️ Temples (45 photos)              │
│ 🍜 Gastronomie (67 photos)          │
│ 🚂 Transport (23 photos)            │
│ 🌾 Nature (89 photos)               │
│ [Voir toutes les photos ▼]         │
│                                     │
│ Clic sur thème → Liste transversale │
└─────────────────────────────────────┘
```

---

### Le "chemin rapide" transversal

Quand tu es dans **un moment spécifique**, tu vois ses **thèmes associés** :

```
┌─────────────────────────────────────┐
│ 📸 Photos > Par moment              │
├─────────────────────────────────────┤
│ 📍 Bangkok Temple                   │
│ [12 photos]                         │
│                                     │
│ 🏷️ Thèmes de ce moment :            │
│ • 🏛️ Temples → 45 photos (tous)     │ ← LIEN RAPIDE
│ • 🌆 Ville → 78 photos (tous)       │
└─────────────────────────────────────┘
```

Et inversement, dans **un thème**, tu vois les **moments concernés** :

```
┌─────────────────────────────────────┐
│ 📸 Photos > Par thème               │
├─────────────────────────────────────┤
│ 🏛️ Temples (45 photos)              │
│ [Vue transversale toutes photos]    │
│                                     │
│ 📍 Moments de ce thème :            │
│ • Bangkok Temple (J1) - 12 photos   │ ← LIEN RAPIDE
│ • Ayutthaya (J5) - 18 photos        │
│ • Sukhothaï (J12) - 15 photos       │
└─────────────────────────────────────┘
```

**C'est ça que tu voulais dire par "chemin rapide" ?**  
Navigation **bidirectionnelle** moment ↔ thème ?

---

## 📱 Wireframes complets : Les 3 tailles

### Taille 1 : Coup d'œil (30%)

**Usage :** Vérification rapide, aperçu contexte actuel

```
┌─────────────────────────────────────┐
│                                     │
│ Chat messages...                    │
│                                     │
│                                     │ 70% écran
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 🗂️ Souvenirs [⊕ agrandir]           │
├─────────────────────────────────────┤
│ [📸][📄][🗺️]  [📍][🏷️]              │ 30% écran
│                                     │
│ Bangkok Temple (12 photos)          │
│ [▫️][▫️][▫️][▫️] + 8 autres          │
└─────────────────────────────────────┘
    ↑ Swipe up pour agrandir
```

**Affordances :**

- Tap photo → Preview OU attacher directement ?
- Swipe up → Passe en mode Navigation (50%)
- Tap "⊕" → Passe en mode Immersion (90%)

---

### Taille 2 : Navigation (50%)

**Usage :** Parcourir plusieurs items, comparer, sélectionner

```
┌─────────────────────────────────────┐
│ Chat (derniers messages visibles)   │
│                                     │ 50% écran
│ [Input zone visible en bas]         │
├─────────────────────────────────────┤
│ 🗂️ Souvenirs [⊕][⊖]                 │
├─────────────────────────────────────┤
│ [📸 Photos] [📄 Articles] [🗺️]      │
│ [📍 Moment] [🏷️ Thème]               │ 50% écran
│                                     │
│ Bangkok Temple (12)                 │
│ [▫️][▫️][▫️][▫️][▫️][▫️]              │
│ [▫️][▫️][▫️][▫️][▫️][▫️]              │
│                                     │
│ [Scroll pour voir plus...]          │
└─────────────────────────────────────┘
```

**Affordances :**

- Longpress photo → Mode sélection multiple (checkboxes)
- Tap photo seule → Preview plein écran
- Double-tap → Attacher directement
- Swipe up → Passe en Immersion (90%)
- Tap "⊖" → Retour Coup d'œil (30%)

---

### Taille 3 : Immersion (90%)

**Usage :** Exploration profonde, navigation thématique étendue

```
┌─────────────────────────────────────┐
│ [↓ Retour au chat] 🗂️ Souvenirs     │
├─────────────────────────────────────┤
│ [📸 Photos] [📄 Articles] [🗺️ Moments]│
│ [📍 Par moment] [🏷️ Par thème]       │
│                                     │
│ 🏛️ Temples (45 photos)              │
│ [▫️][▫️][▫️][▫️][▫️][▫️]              │ 90% écran
│ [▫️][▫️][▫️][▫️][▫️][▫️]              │
│ [▫️][▫️][▫️][▫️][▫️][▫️]              │
│                                     │
│ Moments de ce thème :               │
│ • Bangkok Temple (J1)               │
│ • Ayutthaya (J5)                    │
│                                     │
│ [Scroll infini...]                  │
│                                     │
│ [Sélection : 3 photos] [Attacher ✓] │
└─────────────────────────────────────┘
```

**Affordances :**

- Tap "↓ Retour" → Ferme le panneau, retour chat complet
- Swipe down → Repasse en mode Navigation (50%)
- Sélection active → Barre flottante en bas avec compteur + bouton Attacher

---

## 🎯 Flow complet d'utilisation

### Scénario A : Consultation simple

```
1. Tom dans chat : "Tu te souviens du nom du temple ?"
2. Lambert tap 🗂️ → Panneau 30% s'ouvre
3. Voit "Bangkok Temple (12 photos)"
4. Tap une photo → Preview plein écran
5. "Ah oui, c'était le Wat Pho !"
6. Swipe down → Ferme preview
7. Tape sa réponse dans le chat
8. Panneau reste ouvert en 30% ou se ferme auto ?
```

**Question pour toi :**  
👉 **Si tu consultes juste une photo sans l'attacher, le panneau doit-il rester ouvert ou se fermer auto ?**

---

### Scénario B : Partage simple (1 photo)

```
1. Tom : "Montre-moi le temple"
2. Lambert tap 🗂️ → 30%
3. Tap photo → Preview
4. Tap bouton [Attacher] dans preview
5. Preview se ferme
6. Photo apparaît en "draft" dans input zone
7. Lambert ajoute texte : "Voilà le Wat Pho"
8. Tap Send → Message envoyé avec photo
```

---

### Scénario C : Exploration thématique + partage multiple

```
1. Tom : "Tu as des photos de tous les temples ?"
2. Lambert tap 🗂️ → 30%
3. Swipe up → 90% (immersion)
4. Tap [🏷️ Par thème]
5. Tap "🏛️ Temples (45 photos)"
6. Longpress première photo → Mode sélection activé
7. Tap 3 autres photos (checkboxes cochées)
8. Tap [Attacher 4 photos ✓]
9. Panneau se réduit 30% ou se ferme
10. 4 photos en preview dans input
11. Lambert : "Regarde ces 4 temples différents"
12. Send
```

---

### Scénario D : Navigation moment → thème

```
1. Discussion sur Bangkok Temple
2. Lambert tap 🗂️ → 50%
3. Voit section "🏷️ Thèmes de ce moment : Temples"
4. Tap "Temples → 45 photos"
5. Vue transversale TOUS les temples du voyage
6. Sélectionne 2 photos d'Ayutthaya
7. Attache + envoie
8. "Tiens, ceux d'Ayutthaya étaient encore plus beaux"
```

---

## 🏷️
