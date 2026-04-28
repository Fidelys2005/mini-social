# 🌐 Mini Réseau Social

Application web de réseau social complète avec messagerie, posts, profils et authentification JWT.

## 🚀 Stack Technique

- **Frontend** : HTML / CSS / JavaScript
- **Backend** : Node.js / Express
- **Base de données** : MySQL (Clever Cloud)
- **Authentification** : JWT (JSON Web Tokens)
- **Hébergement** : Render

## 📁 Structure du projet

```
mini-social/
├── README.md
├── package.json
├── server.js
├── .env
├── config/
│   └── db.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── posts.js
│   ├── users.js
│   └── messages.js
└── public/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── feed.html
    ├── profile.html
    ├── messages.html
    ├── css/
    │   └── style.css
    └── js/
        ├── auth.js
        ├── feed.js
        ├── profile.js
        └── messages.js
```

## ⚙️ Installation en local

### 1. Prérequis
- Node.js >= 18
- MySQL >= 8

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer `.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=mini_social
JWT_SECRET=votre_secret_jwt
PORT=3000
NODE_ENV=development
```

### 4. Lancer le serveur
```bash
npm start
```

Ouvrir : http://localhost:3000

## 🌍 Déploiement

### Base de données — Clever Cloud
1. Créer un addon **MySQL DEV** sur clever-cloud.com
2. Les tables se créent **automatiquement** au démarrage du serveur
3. Récupérer les variables de connexion

### Backend + Frontend — Render
1. Pusher le code sur **GitHub**
2. Créer un **Web Service** sur render.com
3. Relier le repo GitHub
4. Configurer les variables d'environnement :

| Variable | Valeur |
|---|---|
| `DB_HOST` | Host Clever Cloud |
| `DB_PORT` | 3306 |
| `DB_USER` | User Clever Cloud |
| `DB_PASSWORD` | Password Clever Cloud |
| `DB_NAME` | Database Clever Cloud |
| `JWT_SECRET` | Votre secret JWT |
| `NODE_ENV` | production |

5. **Build Command** : `npm install`
6. **Start Command** : `node server.js`

## 🎯 Fonctionnalités

- ✅ Inscription / Connexion avec JWT
- ✅ Feed de posts (créer, liker, commenter, supprimer)
- ✅ Messagerie privée entre utilisateurs
- ✅ Profil utilisateur (bio, stats)
- ✅ Système de follow / unfollow
- ✅ Recherche d'utilisateurs
- ✅ Design responsive moderne
- ✅ Création automatique des tables MySQL

## 🔒 Sécurité

- Mots de passe hashés avec **bcryptjs**
- Authentification via **JWT** (expiration 7 jours)
- Protection des routes API avec middleware
- Échappement HTML contre les injections XSS

## 👤 Auteur

Projet réalisé dans le cadre de la **Phase 3** du développement web.
