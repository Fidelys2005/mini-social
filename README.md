# 🌐 Mini Réseau Social

Application web de réseau social complète avec messagerie, posts, profils et authentification JWT.

---

## 🚀 Stack Technique

* **Frontend** : HTML / CSS / JavaScript
* **Backend** : Node.js / Express
* **Base de données** : MySQL (Clever Cloud)
* **Authentification** : JWT (JSON Web Tokens)
* **Hébergement** : Render,Vercel

---

## 📁 Structure du projet

`
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

---

## ⚙️ Installation en local

### 1. Prérequis

* Node.js >= 18
* MySQL >= 8

---

### 2. Installer les dépendances

```bash
npm install
```

---

### 3. Configurer `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=mini_social
JWT_SECRET=votre_secret_jwt
PORT=3000
NODE_ENV=development
```

---

### 4. Lancer le serveur

```bash
npm start
```

👉 Ouvrir :

http://localhost:3000


## 🌍 Déploiement

### 🗄 Base de données (Clever Cloud)

* Créer un addon MySQL sur Clever Cloud
* Les tables se créent automatiquement au démarrage
* Récupérer les variables de connexion

---

### 🚀 Backend (Render)

1. Push GitHub
2. Créer Web Service sur Render
3. Configurer variables :

| Variable    | Valeur            |
| ----------- | ----------------- |
| DB_HOST     | host Clever Cloud |
| DB_PORT     | 3306              |
| DB_USER     | user              |
| DB_PASSWORD | password          |
| DB_NAME     | database          |
| JWT_SECRET  | secret            |
| NODE_ENV    | production        |

---

### ▶ Build & Start

```bash
npm install
node server.js
```

---

## 🎯 Fonctionnalités

* ✅ Inscription / Connexion JWT
* ✅ Feed de posts (CRUD)
* ✅ Likes & commentaires
* ✅ Messagerie privée
* ✅ Profil utilisateur
* ✅ Follow / unfollow
* ✅ Recherche utilisateurs
* ✅ Design responsive
* ✅ Création automatique des tables

---

## 🔒 Sécurité

* Mots de passe hashés avec bcrypt
* Authentification JWT (7 jours)
* Middleware de protection des routes
* Protection XSS (escape HTML)

---

## 👤 Auteur

Projet réalisé dans le cadre d’un apprentissage full-stack Node.js.

