# CasaHub — Design handoff

Ce dossier sert de référence pour l’implémentation UI de CasaHub.

## Références principales

- `CasaHub Web.dc.html` : référence principale de l’app responsive complète.
- `CasaHub Prototype.dc.html` : prototype mobile interactif.
- `CasaHub Écrans.dc.html` : planche des écrans mobiles.
- `CasaHub Dashboard v2.dc.html` : direction retenue : accueil Bento + onglet La journée.
- `CasaHub Dashboard.dc.html` : exploration initiale des directions.

## Screenshots attendus

À ajouter dans le repo :

```txt
public/screenshots/desktop/
  01-connexion.png
  02-foyer-bento.png
  03-courses.png
  04-taches.png
  05-la-journee.png
  06-agenda.png
  07-notes.png
  08-liens.png
  09-profil.png
  10-ajouter-modale.png

public/screenshots/mobile/
  01-connexion.png
  02-foyer-bento.png
  03-courses.png
  04-taches.png
  05-la-journee.png
  06-agenda.png
  07-notes.png
  08-liens.png
  09-profil.png
  10-ajouter-sheet.png
```

## Design tokens principaux

```txt
background: #F7F0E6
surface: #FFFDFA
surface-muted: #FBF6EE
text-primary: #2C2622
text-secondary: #5A524A
text-muted: #9A9088 / #8A8178
primary: #C2603F
```

Univers :

```txt
Courses: #F6E2D8 / #7A3A23 / #C2603F
Tâches: #E7EDDF / #465938 / #7E9B6E
Agenda: #E2E8EE / #3D5266 / #6E8BA6
Notes: #F2E7CC / #6B5320 / #C99A3F
Liens: #EADDE6 / #6E4D63 / #9B6E8B
```

## Typographie

- Titres : Bricolage Grotesque, 700–800, letter-spacing -0.02em.
- Texte UI : Hanken Grotesk, 400–700.

## Responsive

Breakpoint cible : `880px`.

- Desktop : sidebar persistante, grille bento 4 colonnes.
- Mobile : bottom nav, grille bento 2 colonnes, bouton central `+`.
