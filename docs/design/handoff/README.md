# Handoff : CasaHub — app de gestion de foyer (V1)

## Vue d'ensemble

CasaHub est une **app web responsive** de gestion de foyer, pensée comme un hub partagé
entre les membres d'un même logement (couples, colocs, familles). Elle centralise
l'organisation du quotidien : **courses, tâches, notes, calendrier, rappels et liens utiles**.
Objectif produit : partager la charge mentale du foyer, mobile-first, utilisable à deux
en quelques secondes, sans usine à gaz.

## À propos des fichiers de design

Les fichiers `.dc.html` de ce bundle sont des **références de design réalisées en HTML** —
des prototypes qui montrent l'apparence et le comportement visés. **Ce ne sont pas du code
de production à copier tel quel.** La tâche consiste à **recréer ces écrans dans
l'environnement cible** (idéalement **React** + une lib de styles, voir plus bas), en
respectant ses conventions. Si aucun environnement n'existe encore, créez un nouveau projet
avec la stack recommandée et implémentez-y les designs.

Stack recommandée (suggestion, à adapter) :

- **Front** : React (Next.js ou Vite) + TypeScript.
- **Styles** : Tailwind CSS ou CSS Modules — les tokens sont listés plus bas.
- **Backend / temps réel** : Supabase ou Firebase (auth, foyer partagé, synchro multi-membres).
- **State** : état local React pour la V1 ; brancher la persistance/synchro ensuite.

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographie, espacements, rayons et interactions sont
définitifs. Recréez l'UI au pixel près à partir des valeurs de ce document, en utilisant les
composants/patterns de votre codebase. Les visuels d'images réelles (aucun dans la V1) et le
backend restent à brancher.

---

## Système visuel (design tokens)

### Couleurs

| Rôle                               | Hex                            |
| ---------------------------------- | ------------------------------ |
| Fond app (crème)                   | `#F7F0E6`                      |
| Surface carte (blanc chaud)        | `#FFFDFA`                      |
| Surface "secondaire" (déjà fait)   | `#FBF6EE`                      |
| Texte principal (brun)             | `#2C2622`                      |
| Texte secondaire                   | `#5A524A`                      |
| Texte atténué / labels             | `#9A9088` / `#8A8178`          |
| Texte très atténué (placeholder)   | `#B6ADA2` / `#C7BEB2`          |
| Bordure légère                     | `rgba(44,38,34,0.06)` à `0.10` |
| **Accent primaire — terracotta**   | `#C2603F`                      |
| Terracotta foncé (texte sur tuile) | `#7A3A23` / `#A8623F`          |

**Teintes par univers** (fond clair + texte foncé) :
| Univers | Fond tuile | Texte | Avatar/point |
|---|---|---|---|
| 🛒 Courses (terracotta) | `#F6E2D8` | `#7A3A23` | `#C2603F` |
| ✅ Tâches (sauge) | `#E7EDDF` | `#465938` | `#7E9B6E` |
| 📅 Agenda (bleu doux) | `#E2E8EE` | `#3D5266` | `#6E8BA6` |
| 📝 Notes (ocre) | `#F2E7CC` | `#6B5320` | `#C99A3F` |
| 🔗 Liens (prune) | `#EADDE6` | `#6E4D63` | `#9B6E8B` |

**Avatars membres** : Léa = `#C2603F` (terracotta), Tom = `#6E8BA6` (bleu). Initiale blanche, cercle.

### Typographie

- **Titres / display** : `Bricolage Grotesque` (Google Fonts), poids 700–800, `letter-spacing: -0.02em`.
- **UI / corps** : `Hanken Grotesk` (Google Fonts), poids 400–700.
- Échelle observée : titres écran 23px (mobile) / 28px (desktop) ; titres de carte 16–22px ;
  corps 14–15px ; labels/meta 11–13px (souvent uppercase, `letter-spacing: .04–.05em`, 700).

### Rayons, ombres, espacements

- **Rayons** : tuiles bento 24px · cartes 16–20px · champs/boutons 13–14px · pills 11–20px · avatars 50%.
- **Ombre carte** : `0 4px 16px -12px rgba(60,40,20,.35)`.
- **Ombre bouton accent** : `0 8px 18px -8px rgba(194,96,63,.7)`.
- **Espacements** : grille bento `gap:16px` ; listes `gap:10–13px` ; padding cartes 14–22px ;
  padding contenu 16px (mobile) / 26–32px (desktop).
- **Emojis** comme iconographie (assumé par la marque : chaleureux/vivant). Pas de SVG custom.

### Breakpoint responsive

- Seuil **880px** sur la largeur du conteneur racine.
  - `≥ 880px` → **desktop** : menu latéral (sidebar) persistant, grille bento 4 colonnes, contenu centré (max-width ~1060px ; listes/détails ~720px).
  - `< 880px` → **mobile** : **barre de navigation en bas**, grille bento 2 colonnes, contenu pleine largeur (max-width ~640px), écrans de détail avec bouton retour.
- La bascule est pilotée par un observateur de largeur (`ResizeObserver`) sur le conteneur racine.

---

## Écrans / vues

### 1. Connexion (auth)

- **But** : se connecter ou accéder à la création de compte.
- **Layout** : carte centrée, max-width 380px, fond crème en léger radial-gradient.
- **Composants** : logo 78px (carré arrondi 23px, terracotta, 🏠) ; titre "CasaHub" ;
  sous-titre "Le hub partagé de votre foyer." ; champ e-mail ; champ mot de passe ;
  bouton plein terracotta "Se connecter" ; séparateur "ou" ; bouton outline "Continuer avec Google" ;
  lien "Pas encore de foyer ? **Créer un compte**".
- **Actions** : "Se connecter" et "Google" → entrent dans l'app (tab Foyer). "Créer un compte" → Onboarding.

### 2. Onboarding — Créer un foyer

- **But** : nommer le foyer, choisir le type, inviter des membres.
- **Layout** : carte centrée max-width 440px ; barre de progression (étape 2/3) + retour.
- **Composants** : titre "Créez votre foyer 🏡" ; champ "Nom du foyer" avec sélecteur d'emoji (🏡) ;
  segmenté "💑 Couple / 🧑‍🤝‍🧑 Coloc / 👨‍👩‍👧 Famille" ; liste de membres (Léa = vous ; invitations) ;
  ligne pointillée "＋ Inviter par e-mail ou lien" ; bouton plein "Créer le foyer".
- **Actions** : retour → Connexion ; "Créer le foyer" → entre dans l'app.

### 3. Foyer (accueil — bento)

- **But** : vue d'ensemble du quotidien, point d'entrée vers chaque univers.
- **Layout** : en-tête (titre "Le Foyer 🏡" + sous-titre date/compteur, avatars à droite,
  bouton "+ Ajouter" sur desktop) ; grille **bento**.
  - Desktop : 4 colonnes. Courses span 2, Tâches span 2 (rangée 1) ; Agenda 1, Notes 1, Liens span 2 (rangée 2). Tuiles min-height 150px.
  - Mobile : 2 colonnes. Courses span 2 (pleine largeur) ; Tâches+Agenda ; Notes+Liens.
- **Composants (tuiles)** : chacune = emoji 30–32px, badge compteur, titre (Bricolage 800),
  ligne d'aperçu. Couleurs par univers (voir tokens). **Compteurs dynamiques** (courses à prendre, tâches à faire).
- **Actions** : tap tuile Courses/Tâches/Notes/Liens → écran de détail ; tuile Agenda → onglet Agenda.

### 4. La journée (timeline)

- **But** : tout ce qui concerne "aujourd'hui", mêlant événements, courses et tâches.
- **Layout** : pills de période (Aujourd'hui / Demain / Semaine) ; **timeline verticale**
  (ligne + points colorés par type) avec cartes.
- **Items (exemple)** : 14:00 Événement "Médecin — Léa" (point bleu) ; "Avant de sortir · Courses"
  (terracotta, 3 chips) ; "Ce soir · Tâche" Sortir les poubelles (sauge, checkbox + avatar) ;
  "Cette semaine · Rappel" Loyer à payer (prune).

### 5. Agenda (calendrier liste)

- **But** : événements à venir, mobile-friendly, groupés par période.
- **Layout** : sections "Cette semaine" / "La semaine prochaine" ; lignes = pastille date
  (jour abrégé + numéro, Bricolage 800) + barre colorée + titre + heure/lieu.
- **Exemples** : MAR 24 Médecin 14:00 ; VEN 27 Apéro chez Sarah 19:00 ; DIM 29 Brunch famille 11:00 ;
  LUN 30 Loyer (rappel) ; MER 02 Contrôle technique 09:30.

### 6. Courses

- **But** : liste partagée — ajouter, cocher, voir qui a ajouté quoi.
- **Layout** : champ d'ajout (input + bouton ＋ terracotta) ; carte "à prendre" (lignes :
  checkbox carrée, nom + quantité, avatar de l'ajouteur) ; section "Déjà pris · N" (lignes
  barrées, checkbox sauge ✓).
- **Interaction** : cocher une ligne la déplace entre "à prendre" et "déjà pris" ; ajout par
  bouton ＋ ou touche Entrée.

### 7. Tâches (todo)

- **But** : tâches du foyer, assignables, avec deadline optionnelle.
- **Layout** : champ d'ajout (＋ sauge) ; liste "à faire" (carte : checkbox ronde, titre,
  meta = deadline/récurrence, avatar assigné) ; section "Terminé · N" (barré, ✓ sauge).
- **Interaction** : cocher bascule fait/à faire ; ajout par ＋ ou Entrée. Meta exemples :
  "📅 Ce soir", "📅 Demain", "Sans date", "🔁 Tous les 3 jours".

### 8. Notes partagées

- **But** : infos pratiques du foyer.
- **Layout** : grille de cartes (2 colonnes desktop, 1 mobile). Cartes : Wi-Fi (sur fond ocre),
  Codes, Numéros utiles, Idées (chips). Titre Bricolage + contenu en clair.

### 9. Liens utiles

- **But** : accès rapide aux ressources externes, rangées par catégorie.
- **Layout** : sections (🏠 Logement, ❤️ Santé, 🗂 Documents…) ; cartes-listes ; lignes =
  emoji + libellé + flèche externe ↗.

---

## Interactions & comportement

- **Navigation** :
  - Desktop → sidebar (Foyer, La journée, Courses, Tâches, Calendrier, Notes, Liens) avec item actif surligné (`bg #F6E2D8`, `color #C2603F`) ; "+ Ajouter" ; pied de page profil cliquable.
  - Mobile → barre du bas : Foyer · Journée · **＋ (central)** · Agenda · Profil ; item actif en terracotta. Les écrans de détail s'ouvrent depuis les tuiles et affichent un **bouton retour**.
- **Bouton ＋ / "Ajouter"** : ouvre une feuille de choix "Ajouter au foyer" (Article / Tâche /
  Événement / Note). Desktop = **modale centrée** (anim `pop` 250ms) ; mobile = **bottom sheet**
  (anim `slideUp` 300ms `cubic-bezier(.2,.8,.2,1)`) avec scrim `rgba(33,29,26,.4)` ; clic hors carte = fermer.
- **Transitions d'écran** : `fade` + léger `translateY(6px)` ~250ms à l'apparition de chaque vue.
- **Cocher** : met à jour l'élément et **recalcule les compteurs** des tuiles du Foyer en direct.
- **États** : item de nav actif ; champ focus (outline retirée, fond `#FFFDFA`) ; lignes cliquables `cursor:pointer`.
- **Responsive** : voir breakpoint 880px ci-dessus.

## Gestion de l'état (V1, local)

Variables d'état :

- `screen` : `'login' | 'onboarding' | 'app'`
- `tab` : `'foyer' | 'journee' | 'agenda' | 'profil'`
- `detail` : `null | 'courses' | 'taches' | 'notes' | 'liens'` (superpose/remplace le contenu)
- `addOpen` : booléen (feuille d'ajout)
- `draftCourse`, `draftTask` : valeurs des champs d'ajout
- `courses[]` : `{ id, name, qty, who:'L'|'T', done }`
- `tasks[]` : `{ id, title, meta, who:'L'|'T', done }`
- `w` : largeur du conteneur (pour le breakpoint)

Transitions : login/google → `app`+`foyer` ; "créer un compte" → `onboarding` ; tuile/sidebar →
`tab`/`detail` ; cocher → toggle `done` ; ajout → unshift dans la liste + reset draft ; logout → `login`.

**À brancher pour la prod** : auth réelle, modèle "Foyer" + membres, persistance et **synchro
temps réel** des listes/tâches/notes/événements entre membres (Supabase/Firebase). Les données
actuelles sont des exemples codés en dur.

## Captures de référence

Le dossier `screenshots/` contient des captures visuelles de chaque écran :

- `screenshots/desktop/` — version web large (sidebar) : connexion, foyer (bento), courses, tâches, la journée, agenda, notes, liens, profil, modale d'ajout.
- `screenshots/mobile/` — version mobile (barre du bas) : mêmes écrans + bottom sheet d'ajout.
  Numérotées par parcours (01 connexion → 10 ajout). À utiliser comme référence pixel.

## Assets

Aucune image bitmap ni SVG custom. Iconographie = **emojis** (système). Polices = Google Fonts
(`Bricolage Grotesque`, `Hanken Grotesk`).

## Fichiers de ce bundle

- `CasaHub Web.dc.html` — **référence principale** : l'app web responsive complète (desktop + mobile), avec toute la logique d'état. **C'est le fichier à recréer en priorité.**
- `CasaHub Prototype.dc.html` — prototype mobile (cadre téléphone) du même parcours, utile pour le détail des écrans mobiles.
- `CasaHub Écrans.dc.html` — planche de tous les écrans mobiles statiques (auth, onboarding, courses, tâches, notes, calendrier, liens).
- `CasaHub Dashboard v2.dc.html` — direction de navigation retenue (bento + "La journée"), mobile & desktop.
- `CasaHub Dashboard.dc.html` — exploration initiale des 3 directions de navigation (contexte/historique).

> Note technique : ces fichiers utilisent un format de composant "streamé" (`.dc.html`). Pour les
> lire, ouvrez-les dans un navigateur ou inspectez le `<template>` et la classe `Component`
> (logique d'état en JS classique). Toute la logique pertinente est dans `CasaHub Web.dc.html`.
