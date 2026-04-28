const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
// Recherche
router.get('/', auth, async (req, res) => {
  const q = req.query.q || '';
  try {
    const [users] = await db.query(
      'SELECT id, username, avatar, bio FROM users WHERE username LIKE ? AND id != ? LIMIT 20',
      [`%${q}%`, req.user.id]
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/me', auth, async (req, res) => {
  const { bio, username } = req.body;
  try {
    await db.query(
      'UPDATE users SET bio = ?, username = ? WHERE id = ?',
      [bio || '', username || req.user.username, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Profil utilisateur
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const [posts] = await db.query(`
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id, req.params.id]);

    const [[{ followers }]] = await db.query(
      'SELECT COUNT(*) AS followers FROM follows WHERE following_id = ?', [req.params.id]
    );
    const [[{ following }]] = await db.query(
      'SELECT COUNT(*) AS following FROM follows WHERE follower_id = ?', [req.params.id]
    );
    const [[{ is_following }]] = await db.query(
      'SELECT COUNT(*) AS is_following FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, req.params.id]
    );

    res.json({ ...rows[0], posts, followers, following, is_following: is_following > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});





// Follow / Unfollow
router.post('/:id/follow', auth, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });
  try {
    const [existing] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, req.params.id]
    );
    if (existing.length > 0) {
      await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, req.params.id]);
      res.json({ following: false });
    } else {
      await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, req.params.id]);
      res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
