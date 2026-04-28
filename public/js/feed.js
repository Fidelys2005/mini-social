const API = "https://mini-social-u0yc.onrender.com/api";
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return (window.location.href = 'login.html');
  currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  renderSidebar();
  await loadPosts();

  const textarea = document.getElementById('post-content');
  textarea.addEventListener('input', () => {
    document.getElementById('char-count').textContent = `${textarea.value.length} / 280`;
  });
});

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` };
}

function goToMyProfile() {
  window.location.href = `profile.html?id=${currentUser.id}`;
}

function renderSidebar() {
  const el = document.getElementById('user-info-sidebar');
  el.innerHTML = `
    <div class="sidebar-user" onclick="goToMyProfile()">
      <div class="avatar">${currentUser.username?.[0]?.toUpperCase() || '?'}</div>
      <div>
        <div class="sidebar-username">${currentUser.username}</div>
        <div class="sidebar-email">${currentUser.email || ''}</div>
      </div>
    </div>
    <div class="sidebar-stats">
      <div class="stat-item"><div class="stat-value" id="stat-posts">–</div><div class="stat-label">Posts</div></div>
      <div class="stat-item"><div class="stat-value" id="stat-followers">–</div><div class="stat-label">Abonnés</div></div>
      <div class="stat-item"><div class="stat-value" id="stat-following">–</div><div class="stat-label">Abonnements</div></div>
    </div>`;
  fetchSidebarStats();
}

async function fetchSidebarStats() {
  const res = await fetch(`${API}/users/${currentUser.id}`, { headers: authHeaders() });
  const data = await res.json();
  document.getElementById('stat-posts').textContent = data.posts?.length || 0;
  document.getElementById('stat-followers').textContent = data.followers || 0;
  document.getElementById('stat-following').textContent = data.following || 0;
}

async function loadPosts() {
  const container = document.getElementById('posts-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const res = await fetch(`${API}/posts`, { headers: authHeaders() });
  const posts = await res.json();
  container.innerHTML = '';
  if (!posts.length) {
    container.innerHTML = '<div class="card" style="text-align:center;color:var(--text-muted);padding:40px">Aucun post pour l\'instant. Soyez le premier !</div>';
    return;
  }
  posts.forEach(p => container.appendChild(renderPost(p)));
}

function renderPost(p) {
  const div = document.createElement('div');
  div.className = 'post-card';
  div.id = `post-${p.id}`;
  const isOwner = p.user_id === currentUser.id;
  const liked = parseInt(p.liked) > 0;
  div.innerHTML = `
    <div class="post-header">
      <div class="avatar">${p.username?.[0]?.toUpperCase() || '?'}</div>
      <div class="post-meta">
        <div class="post-username" onclick="window.location.href='profile.html?id=${p.user_id}'">${p.username}</div>
        <div class="post-time">${formatDate(p.created_at)}</div>
      </div>
    </div>
    <div class="post-content">${escapeHtml(p.content)}</div>
    <div class="post-actions">
      <button class="action-btn ${liked ? 'liked' : ''}" id="like-btn-${p.id}" onclick="toggleLike(${p.id})">
        ${liked ? '❤️' : '🤍'} <span id="like-count-${p.id}">${p.likes_count || 0}</span>
      </button>
      <button class="action-btn" onclick="toggleComments(${p.id})">
        💬 <span>${p.comments_count || 0}</span>
      </button>
      ${isOwner ? `<button class="action-btn delete-btn" onclick="deletePost(${p.id})">🗑️</button>` : ''}
    </div>
    <div class="comments-section hidden" id="comments-${p.id}">
      <div id="comments-list-${p.id}"></div>
      <div class="comment-form">
        <div class="avatar-sm">${currentUser.username?.[0]?.toUpperCase() || '?'}</div>
        <input type="text" placeholder="Ajouter un commentaire..." id="comment-input-${p.id}"
          onkeydown="if(event.key==='Enter') addComment(${p.id})"/>
        <button class="btn btn-primary btn-sm" onclick="addComment(${p.id})">Envoyer</button>
      </div>
    </div>`;
  return div;
}

async function toggleLike(postId) {
  const res = await fetch(`${API}/posts/${postId}/like`, { method: 'POST', headers: authHeaders() });
  const data = await res.json();
  const btn = document.getElementById(`like-btn-${postId}`);
  const count = document.getElementById(`like-count-${postId}`);
  const current = parseInt(count.textContent);
  if (data.liked) {
    btn.classList.add('liked'); btn.innerHTML = `❤️ <span id="like-count-${postId}">${current + 1}</span>`;
  } else {
    btn.classList.remove('liked'); btn.innerHTML = `🤍 <span id="like-count-${postId}">${Math.max(0, current - 1)}</span>`;
  }
}

async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    await loadComments(postId);
  } else {
    section.classList.add('hidden');
  }
}

async function loadComments(postId) {
  const res = await fetch(`${API}/posts/${postId}/comments`, { headers: authHeaders() });
  const comments = await res.json();
  const container = document.getElementById(`comments-list-${postId}`);
  container.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="avatar-sm">${c.username?.[0]?.toUpperCase() || '?'}</div>
      <div class="comment-body">
        <div class="comment-author">${c.username}</div>
        <div class="comment-text">${escapeHtml(c.content)}</div>
      </div>
    </div>`).join('');
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  const res = await fetch(`${API}/posts/${postId}/comments`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ content })
  });
  if (res.ok) { input.value = ''; await loadComments(postId); }
}

async function createPost() {
  const content = document.getElementById('post-content').value.trim();
  if (!content) return;
  if (content.length > 280) return alert('Maximum 280 caractères.');
  const res = await fetch(`${API}/posts`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ content })
  });
  if (res.ok) {
    const post = await res.json();
    const container = document.getElementById('posts-container');
    const noPost = container.querySelector('.card');
    if (noPost) noPost.remove();
    container.prepend(renderPost(post));
    document.getElementById('post-content').value = '';
    document.getElementById('char-count').textContent = '0 / 280';
    fetchSidebarStats();
  }
}

async function deletePost(postId) {
  if (!confirm('Supprimer ce post ?')) return;
  const res = await fetch(`${API}/posts/${postId}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { document.getElementById(`post-${postId}`)?.remove(); fetchSidebarStats(); }
}

async function searchUsers() {
  const q = document.getElementById('search-input').value.trim();
  const dropdown = document.getElementById('search-results');
  if (!q) { dropdown.classList.add('hidden'); return; }
  const res = await fetch(`${API}/users?q=${encodeURIComponent(q)}`, { headers: authHeaders() });
  const users = await res.json();
  dropdown.innerHTML = users.length
    ? users.map(u => `
      <div class="search-item" onclick="window.location.href='profile.html?id=${u.id}'">
        <div class="avatar-sm">${u.username?.[0]?.toUpperCase()}</div>
        <div><div style="font-weight:600;font-size:.9rem">${u.username}</div><div style="font-size:.78rem;color:var(--text-muted)">${u.bio || ''}</div></div>
      </div>`).join('')
    : '<div style="padding:16px;text-align:center;color:var(--text-muted)">Aucun résultat</div>';
  dropdown.classList.remove('hidden');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.nav-search')) {
    document.getElementById('search-results')?.classList.add('hidden');
  }
});

function logout() {
  localStorage.removeItem('token'); localStorage.removeItem('user');
  window.location.href = 'index.html';
}
function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(d) {
  const date = new Date(d);
  const diff = (Date.now() - date) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  return date.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
}
