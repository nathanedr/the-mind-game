# 🧠 MindLink - Web Edition

Une adaptation web du célèbre jeu de société coopératif **MindLink**.  
Ce projet permet de jouer de **2 à 7 joueurs** en temps réel, directement depuis un navigateur.

## 📖 Règles du Jeu

Le but du jeu est simple : l'équipe doit poser toutes ses cartes au centre de la table, **dans l'ordre croissant** (de 1 à 100).

### 🤫 La Règle d'Or
Il est **strictement interdit de communiquer**.  
Pas de paroles, pas de signes, pas de clins d'œil. Les joueurs doivent se synchroniser mentalement pour savoir quand jouer leur carte.

### 🔄 Déroulement d'une partie (Niveaux)
Le jeu se déroule en plusieurs niveaux (1 à 12).
*   **Niveau 1** : Chaque joueur reçoit **1 carte**.
*   **Niveau 2** : Chaque joueur reçoit **2 cartes**.
*   ...
*   **Niveau N** : Chaque joueur reçoit **N cartes**.

Il n'y a **pas de tour de jeu**. N'importe qui peut jouer une carte quand il le sent.

#### Exemple de jeu :
1.  **Joueur A** a les cartes : `15`, `48`.
2.  **Joueur B** a les cartes : `12`, `33`.
3.  Le jeu commence. Personne ne parle.
4.  **Joueur B** sent que son `12` est très bas. Il décide de le jouer.
5.  La carte `12` est posée sur la pile. C'est valide (car 12 < 15).
6.  Maintenant, **Joueur A** sait qu'il doit jouer son `15` avant que Joueur B ne joue son `33`.

### ⚠️ Les Erreurs
Si un joueur pose une carte alors qu'un autre joueur possédait une carte plus petite, le jeu est interrompu immédiatement.

**Exemple d'erreur :**
1.  **Joueur A** a `15`. **Joueur B** a `12`.
2.  **Joueur A** s'impatiente et joue son `15`.
3.  🛑 **STOP !** Le jeu détecte une erreur.
4.  **Conséquence** : L'équipe perd **1 Vie**.
5.  **Correction** : Le Joueur B doit défausser son `12` (car il est inférieur à 15). Le jeu reprend ensuite normalement.

### ❤️ Les Vies
L'équipe partage un compteur de vies commun.
*   Chaque erreur coûte **1 Vie**.
*   Si le compteur tombe à 0, la partie est **PERDUE**.
*   **Bonus** : L'équipe gagne des vies supplémentaires en complétant certains niveaux (ex: niveau 3, 6, 9...).

### 🌟 Les Shurikens
Les joueurs peuvent décider d'utiliser un **Shuriken** s'ils sont bloqués.

1.  Un joueur propose d'utiliser un Shuriken.
2.  **Vote** : Tous les joueurs doivent voter "OUI". Si un seul joueur refuse, le Shuriken est annulé.
3.  **Effet** : Si le vote passe, chaque joueur défausse sa carte la plus faible face visible.
4.  **Révélation** : Le jeu se met en pause pour montrer à tout le monde quelles cartes ont été éliminées.
5.  Une fois que tout le monde est prêt, la partie reprend.

---

## 🛠️ Installation et Lancement (Local)

Ce projet utilise une architecture **Client (React)** / **Serveur (Node.js)**.

### Prérequis
*   Node.js (v18+)
*   npm

### 1. Installation des dépendances
À la racine du projet, lancez la commande magique pour tout installer :
```bash
npm run install-all
```
*(Ou installez manuellement dans `client/` et `server/`)*

### 2. Lancer le projet
Vous aurez besoin de deux terminaux.

**Terminal 1 (Serveur) :**
```bash
cd server
npm run dev
```
Le serveur démarrera sur le port `3001`.

**Terminal 2 (Client) :**
```bash
cd client
npm run dev
```
Le site sera accessible sur `http://localhost:5173`.

---

## 🌍 Jouer avec des amis (via Ngrok)

Pour jouer avec des amis sans héberger le site sur un serveur distant, vous pouvez utiliser **ngrok** pour créer un tunnel sécurisé vers votre ordinateur.

1.  Installez [ngrok](https://ngrok.com/).
2.  Lancez votre serveur et votre client comme expliqué ci-dessus.
3.  Ouvrez un nouveau terminal et exposez le port du serveur :
    ```bash
    ngrok http 3001
    ```
4.  Copiez l'URL HTTPS fournie par ngrok (ex: `https://xxxx.ngrok-free.app`).
5.  **Configuration Client** :
    *   Créez un fichier `.env` dans le dossier `client/`.
    *   Ajoutez : `VITE_SERVER_URL=https://xxxx.ngrok-free.app` (votre URL ngrok).
    *   Relancez le client (`npm run dev`).
6.  Pour que vos amis accèdent au site, vous devez *aussi* exposer le client, ou plus simplement, **construire le client** pour que le serveur le distribue :

    **Méthode recommandée (Tout-en-un) :**
    1.  Dans `client/` : `npm run build`
    2.  Dans `server/` : `npm run dev`
    3.  Lancez ngrok sur le serveur : `ngrok http 3001`
    4.  Envoyez l'URL ngrok à vos amis. Le serveur Node.js servira le site React et gérera les connexions Socket.io sur la même adresse !

---

## 💻 Stack Technique

*   **Frontend** : React, TypeScript, Vite, TailwindCSS, Framer Motion (Animations).
*   **Backend** : Node.js, Express, Socket.io (Communication temps réel).
*   **State Management** : Zustand (Client), Variables en mémoire (Serveur).
