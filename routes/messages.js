const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Liste des conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [convs] = await db.query(`
      SELECT 
        u.id AS contact_id,
        u.username,
        u.avatar,
        (
          SELECT content FROM messages 
          WHERE (sender_id = ? AND receiver_id = u.id)
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT created_at FROM messages 
          WHERE (sender_id = ? AND receiver_id = u.id)
             OR (sender_id = u.id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1
        ) AS last_time,
        (
          SELECT COUNT(*) FROM messages 
          WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0
        ) AS unread
      FROM users u
      WHERE u.id != ?
        AND (
          EXISTS (
            SELECT 1 FROM messages 
            WHERE (sender_id = ? AND receiver_id = u.id)
               OR (sender_id = u.id AND receiver_id = ?)
          )
        )
      ORDER BY last_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    res.json(convs);
  } catch (err) {
    console.error('Erreur conversations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Messages avec un contact
router.get('/:contactId', auth, async (req, res) => {
  try {
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?',
      [req.params.contactId, req.user.id]
    );
    const [msgs] = await db.query(`
      SELECT m.*, u.username, u.avatar
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [req.user.id, req.params.contactId, req.params.contactId, req.user.id]);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message
router.post('/:contactId', auth, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '')
    return res.status(400).json({ error: 'Message vide' });

  try {
    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, req.params.contactId, content.trim()]
    );
    const [msg] = await db.query(`
      SELECT m.*, u.username, u.avatar
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `, [result.insertId]);
    res.status(201).json(msg[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
module.exports = router;