const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Tous les posts (feed)
router.get('/', auth, async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) AS liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un post
router.post('/', auth, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '')
    return res.status(400).json({ error: 'Contenu requis' });

  try {
    const [result] = await db.query(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [req.user.id, content.trim()]
    );
    const [post] = await db.query(`
      SELECT p.*, u.username, u.avatar,
        0 AS likes_count, 0 AS comments_count, 0 AS liked
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);
    res.status(201).json(post[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liker / unliker
router.post('/:id/like', auth, async (req, res) => {
  const postId = req.params.id;
  try {
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [req.user.id, postId]
    );
    if (existing.length > 0) {
      await db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Commentaires d'un post
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.username, u.avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un commentaire
router.post('/:id/comments', auth, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '')
    return res.status(400).json({ error: 'Commentaire requis' });

  try {
    const [result] = await db.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, content.trim()]
    );
    const [comment] = await db.query(`
      SELECT c.*, u.username, u.avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    res.status(201).json(comment[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un post
router.delete('/:id', auth, async (req, res) => {
  try {
    const [post] = await db.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
    if (post.length === 0) return res.status(404).json({ error: 'Post introuvable' });
    if (post[0].user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;