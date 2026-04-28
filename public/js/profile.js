const API = "https://mini-social-u0yc.onrender.com/api";
let currentUser = null;
let profileUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return (window.location.href = 'login.html');
  currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id') || currentUser.id;
  await loadProfile(userId);
});

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` };
}
function goToMyProfile() { window.location.href = `profile.html?id=${currentUser.id}`; }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = 'index.html'; }
function escapeHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatDate(d) {
  const date = new Date(d);
  const diff = (Date.now() - date) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  return date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
}

async function loadProfile(userId) {
  const res = await fetch(`${API}/users/${userId}`, { headers: authHeaders() });
  const data = await res.json();
  profileUser = data;
  const isMe = parseInt(userId) === currentUser.id;

  document.getElementById('profile-header').innerHTML = `
    <div class="profile-header">
      <div class="avatar-lg">${data.username?.[0]?.toUpperCase()}</div>
      <div class="profile-info">
        <div class="profile-name">${data.username}</div>
        <div class="profile-bio">${data.bio || 'Aucune bio.'}</div>
        <div class="profile-stats">
          <div class="profile-stat"><div class="stat-value">${data.posts?.length || 0}</div><div class="stat-label">Posts</div></div>
          <div class="profile-stat"><div class="stat-value">${data.followers || 0}</div><div class="stat-label">Abonnés</div></div>
          <div class="profile-stat"><div class="stat-value">${data.following || 0}</div><div class="stat-label">Abonnements</div></div>
        </div>
        <div class="profile-actions">
          ${isMe
            ? `<button class="btn btn-outline btn-sm" onclick="toggleEditForm()">✏️ Modifier le profil</button>`
            : `<button class="btn ${data.is_following ? 'btn-outline' : 'btn-primary'} btn-sm" id="follow-btn" onclick="toggleFollow(${userId})">
                ${data.is_following ? 'Se désabonner' : '+ Suivre'}
               </button>
               <a href="messages.html?contact=${userId}" class="btn btn-outline btn-sm">💬 Message</a>`
          }
        </div>
        ${isMe ? `
        <div class="profile-edit-form hidden" id="edit-form">
          <input type="text" id="edit-username" value="${data.username}" placeholder="Pseudo"/>
          <textarea id="edit-bio" placeholder="Votre bio...">${data.bio || ''}</textarea>
          <button class="btn btn-primary btn-sm" onclick="saveProfile()">Enregistrer</button>
        </div>` : ''}
      </div>
    </div>`;

  const postsContainer = document.getElementById('profile-posts');
  postsContainer.innerHTML = '';
  if (!data.posts || !data.posts.length) {
    postsContainer.innerHTML = '<div class="card" style="text-align:center;color:var(--text-muted);padding:40px">Aucun post.</div>';
    return;
  }
  data.posts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.innerHTML = `
      <div class="post-header">
        <div class="avatar">${data.username?.[0]?.toUpperCase()}</div>
        <div class="post-meta">
          <div class="post-username">${data.username}</div>
          <div class="post-time">${formatDate(p.created_at)}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      <div class="post-actions">
        <span class="action-btn">${parseInt(p.liked) > 0 ? '❤️' : '🤍'} ${p.likes_count || 0}</span>
        <span class="action-btn">💬 ${p.comments_count || 0}</span>
      </div>`;
    postsContainer.appendChild(div);
  });
}

function toggleEditForm() {
  document.getElementById('edit-form').classList.toggle('hidden');
}

async function saveProfile() {
  const username = document.getElementById('edit-username').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const res = await fetch(`${API}/users/me`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ username, bio })
  });
  if (res.ok) {
    const user = JSON.parse(localStorage.getItem('user'));
    user.username = username;
    localStorage.setItem('user', JSON.stringify(user));
    await loadProfile(currentUser.id);
  }
}

async function toggleFollow(userId) {
  const res = await fetch(`${API}/users/${userId}/follow`, { method: 'POST', headers: authHeaders() });
  const data = await res.json();
  const btn = document.getElementById('follow-btn');
  if (data.following) {
    btn.textContent = 'Se désabonner'; btn.className = 'btn btn-outline btn-sm';
  } else {
    btn.textContent = '+ Suivre'; btn.className = 'btn btn-primary btn-sm';
  }
}
