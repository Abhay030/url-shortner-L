require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const VERSION = process.env.APP_VERSION || '1.0';

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6 + Math.floor(Math.random() * 3); // 6-8
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateUniqueCode() {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();
    const existing = await pool.query('SELECT 1 FROM links WHERE code = $1', [code]);
    if (existing.rowCount === 0) {
      return code;
    }
    attempts += 1;
  }
  throw new Error('Could not generate unique code');
}

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, version: VERSION });
});

app.post('/api/links', async (req, res) => {
  const { url, code } = req.body || {};

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let finalCode = code;

  try {
    if (finalCode) {
      if (!isValidCode(finalCode)) {
        return res.status(400).json({ error: 'Invalid code format' });
      }

      const existing = await pool.query('SELECT 1 FROM links WHERE code = $1', [finalCode]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'Code already exists' });
      }
    } else {
      finalCode = await generateUniqueCode();
    }

    const insert = await pool.query(
      'INSERT INTO links (code, url) VALUES ($1, $2) RETURNING code, url, created_at, last_clicked_at, click_count',
      [finalCode, url],
    );

    const row = insert.rows[0];
    const baseUrl = process.env.BASE_URL || '';
    const shortUrl = baseUrl ? `${baseUrl}/${row.code}` : null;

    return res.status(201).json({
      code: row.code,
      url: row.url,
      createdAt: row.created_at,
      lastClickedAt: row.last_clicked_at,
      clickCount: row.click_count,
      shortUrl,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Code already exists' });
    }
    console.error('Error creating link', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code, url, created_at, last_clicked_at, click_count FROM links ORDER BY created_at DESC',
    );
    const baseUrl = process.env.BASE_URL || '';
    const links = result.rows.map((row) => ({
      code: row.code,
      url: row.url,
      createdAt: row.created_at,
      lastClickedAt: row.last_clicked_at,
      clickCount: row.click_count,
      shortUrl: baseUrl ? `${baseUrl}/${row.code}` : null,
    }));
    res.json(links);
  } catch (err) {
    console.error('Error listing links', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/links/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      'SELECT code, url, created_at, last_clicked_at, click_count FROM links WHERE code = $1',
      [code],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    const row = result.rows[0];
    const baseUrl = process.env.BASE_URL || '';
    const shortUrl = baseUrl ? `${baseUrl}/${row.code}` : null;
    return res.json({
      code: row.code,
      url: row.url,
      createdAt: row.created_at,
      lastClickedAt: row.last_clicked_at,
      clickCount: row.click_count,
      shortUrl,
    });
  } catch (err) {
    console.error('Error getting link', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/links/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query('DELETE FROM links WHERE code = $1 RETURNING id', [code]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting link', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/:code([A-Za-z0-9]{6,8})', async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, url, click_count FROM links WHERE code = $1',
      [code],
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Not found');
    }
    const link = result.rows[0];

    await pool.query(
      'UPDATE links SET click_count = $1, last_clicked_at = NOW() WHERE id = $2',
      [link.click_count + 1, link.id],
    );

    return res.redirect(302, link.url);
  } catch (err) {
    console.error('Error during redirect', err);
    return res.status(500).send('Internal server error');
  }
});

const buildDir = process.env.FRONTEND_BUILD_DIR;
if (buildDir) {
  const resolvedBuildDir = path.resolve(__dirname, '..', buildDir);
  app.use(express.static(resolvedBuildDir));
  app.get('/code/:code', (req, res) => {
    res.sendFile(path.join(resolvedBuildDir, 'index.html'));
  });
  app.get('/', (req, res) => {
    res.sendFile(path.join(resolvedBuildDir, 'index.html'));
  });
}

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
