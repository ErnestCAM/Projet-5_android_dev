require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  host: 'dpg-d1qna30dl3ps738a4cn0-a.oregon-postgres.render.com',
  user: 'projet_5_android_user',
  password: '46Nyfx0LkZBIcsrCBcc87CIqcBYNwlwE',
  database: 'projet_5_android',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Gmail Transporter - Use App Password!
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  jwt.verify(token, 'secret_key', (err, payload) => {
    if (err) return res.status(403).json({ message: 'Token expiré ou corrompu' });
    const userId = payload.id;
    pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (result.rows.length === 0) return res.status(403).json({ message: 'Utilisateur non trouvé' });
      req.user = result.rows[0];
      next();
    });
  });
}

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Champs requis' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, date_inscription) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'Inscription réussie', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Email incorrect' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '30d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Logout
app.post('/api/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Déconnexion réussie (token supprimé côté client)' });
});

// Films
app.get('/api/films', authenticateToken, async (req, res) => {
  const { search = '', page = 1, limit = 0 } = req.query;
  const searchQuery = `%${search}%`;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM films 
       WHERE title ILIKE $1 OR genre ILIKE $2 OR realisateurs ILIKE $3`,
      [searchQuery, searchQuery, searchQuery]
    );
    const totalResults = parseInt(countResult.rows[0].total);

    let dataQuery = `
      SELECT * FROM films 
      WHERE title ILIKE $1 OR genre ILIKE $2 OR realisateurs ILIKE $3
    `;
    const params = [searchQuery, searchQuery, searchQuery];

    if (limit && parseInt(limit) > 0) {
      const limitNumber = parseInt(limit);
      const offset = (parseInt(page) - 1) * limitNumber;
      dataQuery += ` LIMIT $4 OFFSET $5`;
      params.push(limitNumber, offset);
    }

    const dataResult = await pool.query(dataQuery, params);
    res.json({ totalResults, films: dataResult.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, date_inscription FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Update Profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email)
    return res.status(400).json({ message: 'Aucun champ à mettre à jour' });

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (name) {
      fields.push(`name = $${i++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${i++}`);
      values.push(email);
    }

    values.push(req.user.id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`;
    await pool.query(query, values);

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(200).json({ message: 'If your email exists, you will get a reset link.' });

    const userId = result.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, hash, expiresAt]
    );

    const resetUrl = `https://yourclient.com/reset-password?token=${resetToken}&id=${userId}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `To reset your password, click this link: ${resetUrl}`,
      html: `<a href="${resetUrl}">Reset your password</a>`
    });

    res.json({ message: 'If your email exists, you will get a reset link.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  const { userId, token, password } = req.body;
  if (!userId || !token || !password)
    return res.status(400).json({ message: 'Champs requis' });

  try {
    const result = await pool.query(
      'SELECT * FROM password_resets WHERE user_id = $1 ORDER BY expires_at DESC LIMIT 1',
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });

    const resetTokenRow = result.rows[0];
    if (resetTokenRow.expires_at < new Date())
      return res.status(400).json({ message: 'Lien expiré.' });

    const isValid = await bcrypt.compare(token, resetTokenRow.token);
    if (!isValid)
      return res.status(400).json({ message: 'Lien ou jeton invalide.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    await pool.query('DELETE FROM password_resets WHERE id = $1', [resetTokenRow.id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// --- RENTAL routes matching your `rentals` table ---

// 1) Louer un film
app.post('/api/rentals', authenticateToken, async (req, res) => {
  const { film_id } = req.body;
  if (!film_id) return res.status(400).json({ message: 'film_id requis' });
  try {
    const now = new Date();
    const result = await pool.query(`
      INSERT INTO rentals (user_id, film_id, rental_date, retour_quantite)
      VALUES ($1, $2, $3, 0)
      RETURNING *
    `, [req.user.id, film_id, now]);
    res.status(201).json({ message: 'Film loué avec succès', rental: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 2) Voir ses locations en cours (non retournées)
app.get('/api/rentals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM rentals
      WHERE user_id = $1 AND (retour_quantite = 0 OR retour_quantite IS NULL)
      ORDER BY rental_date DESC
    `, [req.user.id]);
    res.json({ rentals: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 3) Retourner un film (mise à jour du return_date et retour_quantite)
app.put('/api/rentals/:rentalId/return', authenticateToken, async (req, res) => {
  const { rentalId } = req.params;
  try {
    // Vérifier que la location appartient à l'utilisateur
    const check = await pool.query('SELECT * FROM rentals WHERE id = $1 AND user_id = $2', [rentalId, req.user.id]);
    if (check.rows.length === 0)
      return res.status(404).json({ message: 'Location non trouvée' });

    const now = new Date();
    await pool.query(`
      UPDATE rentals 
      SET return_date = $1, retour_quantite = 1
      WHERE id = $2
    `, [now, rentalId]);
    res.json({ message: 'Film retourné avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// 4) Historique complet des locations (retournées ou non)
app.get('/api/rentals/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM rentals
      WHERE user_id = $1
      ORDER BY rental_date DESC
    `, [req.user.id]);
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Server start
app.listen(3000, () => {
  console.log('✅ Serveur lancé sur http://localhost:3000');
});
