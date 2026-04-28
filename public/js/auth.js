const API = window.location.origin + '/api';

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('error-msg');
  err.classList.add('hidden');

  if (!email || !password) {
    err.textContent = 'Veuillez remplir tous les champs.';
    return err.classList.remove('hidden');
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error; return err.classList.remove('hidden'); }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'feed.html';
  } catch {
    err.textContent = 'Erreur de connexion au serveur.';
    err.classList.remove('hidden');
  }
}

async function register() {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('error-msg');
  err.classList.add('hidden');

  if (!username || !email || !password) {
    err.textContent = 'Veuillez remplir tous les champs.';
    return err.classList.remove('hidden');
  }
  if (password.length < 6) {
    err.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
    return err.classList.remove('hidden');
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error; return err.classList.remove('hidden'); }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'feed.html';
  } catch {
    err.textContent = 'Erreur de connexion au serveur.';
    err.classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = 'login.html';
  return token;
}

function goToMyProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) window.location.href = `profile.html?id=${user.id}`;
}
