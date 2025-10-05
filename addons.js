const express = require('express');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'addons.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(list) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

router.get('/', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  let list = readData();
  if (q) {
    list = list.filter(a => (a.title + ' ' + (a.description || '')).toLowerCase().includes(q));
  }
  res.json(list);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  const title = sanitizeHtml(String(body.title || '').trim(), { allowedTags: [], allowedAttributes: {} });
  const url = sanitizeHtml(String(body.url || '').trim(), { allowedTags: [], allowedAttributes: {} });
  const img = sanitizeHtml(String(body.img || '').trim(), { allowedTags: [], allowedAttributes: {} });
  const description = sanitizeHtml(String(body.description || '').trim(), { allowedTags: [], allowedAttributes: {} });

  if (!title || !url) return res.status(400).json({ error: 'title and url required' });

  const list = readData();
  const entry = {
    id: Date.now(),
    title,
    url,
    img: img || '/assets/fallback.png',
    description
  };
  list.unshift(entry);
  const ok = writeData(list);
  if (!ok) return res.status(500).json({ error: 'failed to write data' });
  res.status(201).json(entry);
});

module.exports = router;