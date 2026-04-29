const API = '/api';
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
  if (contactId) await openChat(parseInt(contactId));
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
}

function goToMyProfile() {
  window.location.href = `profile.html?id=${currentUser.id}`;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function escapeHtml(t) {
  if (!t) return '';
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

async function loadConversations() {
  try {
    const res = await fetch(`${API}/messages/conversations`, { headers: authHeaders() });
    const convs = await res.json();
    const list = document.getElementById('conversations-list');

    if (!convs.length) {
      list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted)">Aucune conversation</div>';
      return;
    }

    list.innerHTML = convs.map(c => `
      <div class="conv-item ${parseInt(activeContact) === parseInt(c.contact_id) ? 'active' : ''}"
        onclick="openChat(${parseInt(c.contact_id)})">
        <div class="avatar-sm">${c.username?.[0]?.toUpperCase()}</div>
        <div class="conv-meta">
          <div class="conv-name">${escapeHtml(c.username)}</div>
          <div class="conv-preview">${c.last_message ? escapeHtml(c.last_message) : 'Démarrer la conversation'}</div>
        </div>
        ${c.unread > 0 ? `<span class="conv-badge">${c.unread}</span>` : ''}
      </div>`).join('');
  } catch (err) {
    console.error('Erreur conversations:', err);
  }
}

async function openChat(contactId) {
  // ✅ Arrêter proprement l'ancien polling
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  activeContact = parseInt(contactId);

  // Marquer conversation active
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));

  try {
    const res = await fetch(`${API}/users/${activeContact}`, { headers: authHeaders() });
    const user = await res.json();
    const name = escapeHtml(user.username || '...');

    const panel = document.getElementById('chat-panel');
    panel.innerHTML = `
      <div class="chat-header">
        <button class="back-btn btn btn-sm btn-outline" onclick="backToList()">← Retour</button>
        <div class="avatar-sm">${name?.[0]?.toUpperCase()}</div>
        <h4>${name}</h4>
        <a href="profile.html?id=${activeContact}" class="btn btn-sm btn-outline" style="margin-left:auto">
          Voir le profil
        </a>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-bar">
        <input type="text" id="msg-input" placeholder="Écrire un message..."
          onkeydown="if(event.key==='Enter') sendMessage()"/>
        <button class="btn btn-primary" onclick="sendMessage()">Envoyer</button>
      </div>`;

    // ✅ Afficher chat sur mobile
    panel.classList.add('open');
    document.querySelector('.conversations-panel').classList.add('hidden-mobile');

    await loadMessages(activeContact);

    // ✅ Polling fixé sur le bon contact
    const fixedContactId = activeContact;
    pollInterval = setInterval(async () => {
      if (activeContact === fixedContactId) {
        await loadMessages(fixedContactId);
      } else {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }, 3000);

    await loadConversations();
  } catch (err) {
    console.error('Erreur openChat:', err);
  }
}

async function loadMessages(contactId) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  // ✅ Vérifier qu'on charge la bonne conversation
  if (parseInt(contactId) !== parseInt(activeContact)) return;

  try {
    const res = await fetch(`${API}/messages/${parseInt(contactId)}`, {
      headers: authHeaders()
    });

    if (!res.ok) return console.error('Erreur chargement messages:', res.status);

    const msgs = await res.json();
    if (!Array.isArray(msgs)) return;

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
  } catch (err) {
    console.error('Erreur loadMessages:', err);
  }
}

async function sendMessage() {
  const input = document.getElementById('msg-input');
  if (!input) return;
  const content = input.value.trim();
  if (!content || !activeContact) return;

  const contactId = parseInt(activeContact);
  input.value = '';

  try {
    const res = await fetch(`${API}/messages/${contactId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      await loadMessages(contactId);
      await loadConversations();
    } else {
      const err = await res.json();
      console.error('Erreur envoi:', err);
    }
  } catch (err) {
    console.error('Erreur sendMessage:', err);
  }
}

function backToList() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  activeContact = null;

  // ✅ Retour liste sur mobile
  document.getElementById('chat-panel').classList.remove('open');
  document.querySelector('.conversations-panel').classList.remove('hidden-mobile');

  document.getElementById('chat-panel').innerHTML = `
    <div class="no-conv-selected">
      <span>💬</span>
      <p>Sélectionnez une conversation</p>
    </div>`;
}

function searchConv() {
  const q = document.getElementById('conv-search').value.toLowerCase();
  document.querySelectorAll('.conv-item').forEach(item => {
    const name = item.querySelector('.conv-name')?.textContent.toLowerCase();
    item.style.display = name?.includes(q) ? '' : 'none';
  });
}
