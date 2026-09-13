[README.md](https://github.com/user-attachments/files/32160546/README.md)
# ZEN — PWA personnelle

Application personnelle avec 4 menus (Accueil, Notes, Projets, Motivation),
un mode ZEN plein écran, et de vraies montres analogiques animées. 100 %
HTML/CSS/JS natif, aucune dépendance, hébergeable gratuitement sur
**GitHub Pages**, exactement comme l'app scolaire.

## Structure du projet

```
index.html            → les 4 menus + le mode ZEN + les réglages + l'écran de lancement
css/style.css          → tous les styles (montres, dégradés, thèmes)
js/i18n.js             → dictionnaire de traduction FR/EN
js/app.js              → toute la logique (montres animées, navigation, données)
manifest.json          → configuration PWA (nom "ZEN", icône, couleurs)
sw.js                  → service worker (fonctionnement hors-ligne)
assets/wallpaper-default.jpg → ton fond d'écran Dubai, par défaut
assets/icons/           → icônes de l'app + icône de la barre de navigation
```

## Déploiement sur GitHub Pages

Identique à l'app scolaire — attention au piège du dossier aplati :

1. Crée un nouveau dépôt GitHub (public), par exemple `zen-app`.
2. Glisse les **dossiers entiers** `css`, `js` et `assets` (fermés, pas
   leur contenu) directement dans la zone d'upload GitHub, avec
   `index.html`, `manifest.json`, `sw.js` et `README.md` à la racine.
3. Vérifie dans l'aperçu GitHub que les chemins affichés commencent
   bien par `css/`, `js/` et `assets/` avant de valider.
4. Commit, puis **Settings → Pages** → Source `Deploy from a branch`,
   branche `main`, dossier `/ (root)`.
5. Ton app est en ligne à `https://<utilisateur>.github.io/<depot>/`.

## Comment fonctionnent les données

Tout (notes, projets, photos, citations, réglages) est stocké
**directement dans le navigateur** de ton téléphone (`localStorage`),
comme pour l'app scolaire : pas de compte, pas de synchronisation entre
appareils, fonctionne hors-ligne après le premier chargement.

## Ce qui a été simplifié ou interprété

Vu la complexité du projet, quelques choix ont été faits — dis-moi si
tu veux que j'ajuste l'un d'eux :

- **Les montres sont recréées en CSS**, pas des photos : c'était
  nécessaire pour que les aiguilles bougent réellement (voir
  l'explication donnée en cours de route). Elles reprennent les
  couleurs et le style de chaque photo (cadran bleu chronographe pour
  Accueil/Motivation, cadran squelette doré pour Projets, cadran noir
  et or pour Notes, cadran bleu nuit pour le mode ZEN) mais sans les
  compteurs internes qui, eux, restent décoratifs et fixes. Les
  aiguilles heures/minutes/secondes tournent en temps réel, et le
  guichet de date affiche le vrai jour du mois.
- **Le bouton clair/foncé sur chaque note** est un seul bouton à deux
  états (clair = normal, doré = idée importante), plutôt que deux
  boutons séparés — plus simple à l'usage pour le même résultat.
- **Dans un projet**, ajouter une note utilise le même principe que le
  menu Notes, directement dans la fiche du dossier.
- **Icônes des 3 ronds de l'accueil** (notes, dossier, étoile) et
  **icône réglages/pochette crayon** : dessinées par mes soins dans un
  style sobre assorti à ton icône "maison", faute d'images dédiées
  fournies pour celles-ci.
- **Icône de l'app** (celle affichée sur l'écran d'accueil du
  téléphone) : un "Z" doré sur fond sombre, dans l'esprit de ton écran
  de lancement, faute de logo carré dédié.

## Mettre à jour l'app après modification du code

Comme pour l'app scolaire : change le numéro de version en haut de
`sw.js` (`zen-cache-v1` → `zen-cache-v2`) à chaque nouvelle mise en
ligne, sinon les téléphones qui ont déjà installé l'app garderont
l'ancienne version en cache.
