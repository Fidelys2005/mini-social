const API = "https://mini-social-u0yc.onrender.com/api";
let currentUser = null;
let activeContact = null;
let pollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return (window.location.href = 'login.html');
  currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  await loadConversations();

  const params = new URLSearchParams(window.location.search);
  const contactId = params.get('contact');
  if (contactId) openChat(contactId, '...');
});

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` };
}
function goToMyProfile() { window.location.href = `profile.html?id=${currentUser.id}`; }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = 'index.html'; }
function escapeHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatTime(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

async function loadConversations() {
  const res = await fetch(`${API}/messages/conversations`, { headers: authHeaders() });
  const convs = await res.json();
  const list = document.getElementById('conversations-list');
  list.innerHTML = convs.length
    ? convs.map(c => `
      <div class="conv-item ${activeContact == c.contact_id ? 'active' : ''}" onclick="openChat(${c.contact_id}, '${escapeHtml(c.username)}')">
        <div class="avatar-sm">${c.username?.[0]?.toUpperCase()}</div>
        <div class="conv-meta">
          <div class="conv-name">${c.username}</div>
          <div class="conv-preview">${c.last_message ? escapeHtml(c.last_message) : 'Démarrer la conversation'}</div>
        </div>
        ${c.unread > 0 ? `<span class="conv-badge">${c.unread}</span>` : ''}
      </div>`).join('')
    : '<div style="padding:24px;text-align:center;color:var(--text-muted)">Aucune conversation</div>';
}

async function openChat(contactId, username) {
  if (pollInterval) clearInterval(pollInterval);
  activeContact = contactId;

  const res = await fetch(`${API}/users/${contactId}`, { headers: authHeaders() });
  const user = await res.json();
  const name = user.username || username;

  const panel = document.getElementById('chat-panel');
  panel.innerHTML = `
    <div class="chat-header">
      <div class="avatar-sm">${name?.[0]?.toUpperCase()}</div>
      <h4>${name}</h4>
      <a href="profile.html?id=${contactId}" class="btn btn-sm btn-outline" style="margin-left:auto">Voir le profil</a>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-bar">
      <input type="text" id="msg-input" placeholder="Écrire un message..."
        onkeydown="if(event.key==='Enter') sendMessage()"/>
      <button class="btn btn-primary" onclick="sendMessage()">Envoyer</button>
    </div>`;

  await loadMessages(contactId);
  pollInterval = setInterval(() => loadMessages(contactId), 3000);
  await loadConversations();
}

// ✅ CORRIGÉ : suppression doublon + accolades
async function loadMessages(contactId) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const res = await fetch(`${API}/messages/${parseInt(contactId)}`, {
    headers: authHeaders()
  });

  if (!res.ok) {
    console.error('Erreur chargement messages:', res.status);
    return;
  }

  const msgs = await res.json();

  if (!Array.isArray(msgs)) {
    console.error('Réponse inattendue:', msgs);
    return;
  }

  const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 80;

  if (msgs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;color:var(--text-muted);padding:40px;font-size:0.9rem">
        👋 Début de la conversation
      </div>`;
    return;
  }

  container.innerHTML = msgs.map(m => {
    const isMine = parseInt(m.sender_id) === parseInt(currentUser.id);
    return `
      <div class="msg-bubble ${isMine ? 'sent' : 'received'}">
        ${!isMine ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:3px">${escapeHtml(m.username)}</div>` : ''}
        <div class="msg-text">${escapeHtml(m.content)}</div>
        <div class="msg-time">${formatTime(m.created_at)}</div>
      </div>`;
  }).join('');

  if (wasAtBottom) container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content || !activeContact) return;
  input.value = '';
  const res = await fetch(`${API}/messages/${activeContact}`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ content })
  });
  if (res.ok) {
    await loadMessages(activeContact);
    await loadConversations();
  }
}

function searchConv() {
  const q = document.getElementById('conv-search').value.toLowerCase();
  document.querySelectorAll('.conv-item').forEach(item => {
    const name = item.querySelector('.conv-name')?.textContent.toLowerCase();
    item.style.display = name?.includes(q) ? '' : 'none';
  });
}