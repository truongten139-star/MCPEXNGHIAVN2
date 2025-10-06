const express = require('express');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');

const app = express();
const PUBLIC = path.join(__dirname, 'public');
const DATA_PATH = path.join(PUBLIC, 'addons.json');
const STATS_LOG = path.join(PUBLIC, 'stats.log');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC));

function readData(){ try { return JSON.parse(fs.readFileSync(DATA_PATH,'utf8')); } catch(e){ return []; } }
function writeData(d){ fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2)); }
function authenticateHeader(req){
  const auth = req.headers.authorization || '';
  if (!auth) return false;
  const token = auth.replace('Bearer ','').trim();
  return token === 'admin' || token === (process.env.ADMIN_KEY || 'mcpex-secret-2025');
}

app.post('/api/auth', (req, res) => {
  const key = (req.body && req.body.key) || '';
  const ADMIN_KEY = process.env.ADMIN_KEY || 'mcpex-secret-2025';
  if (key === ADMIN_KEY) {
    const token = Buffer.from(`${key}:${Date.now()}`).toString('base64');
    return res.json({ token, expiresIn: 3600 });
  }
  return res.status(401).json({ message: 'Key invalid' });
});

app.get('/api/addons', (req, res) => {
  const data = readData();
  if (req.query.export === '1') {
    res.setHeader('Content-Disposition', 'attachment; filename="addons-export.json"');
    return res.send(JSON.stringify(data, null, 2));
  }
  res.json(data);
});

app.post('/api/addons', (req, res) => {
  if (!authenticateHeader(req)) return res.status(401).json({ message: 'Unauthorized' });
  const payload = req.body || {};
  const data = readData();
  const id = payload.id || (payload.title||'item').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Date.now();
  const item = Object.assign({ id, createdAt: new Date().toISOString() }, payload);
  data.unshift(item);
  writeData(data);
  res.status(201).json(item);
});

app.put('/api/addons', (req, res) => {
  if (!authenticateHeader(req)) return res.status(401).json({ message: 'Unauthorized' });
  const payload = req.body || {};
  const data = readData();
  const idx = data.findIndex(x=>x.id === payload.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  data[idx] = Object.assign(data[idx], payload, { updatedAt: new Date().toISOString() });
  writeData(data);
  res.json(data[idx]);
});

app.delete('/api/addons', (req, res) => {
  if (!authenticateHeader(req)) return res.status(401).json({ message: 'Unauthorized' });
  const id = req.query.id;
  if (!id) return res.status(400).json({ message: 'Missing id' });
  let data = readData();
  data = data.filter(x=>x.id !== id);
  writeData(data);
  res.json({ deleted: id });
});

app.post('/api/upload', (req, res) => {
  if (!authenticateHeader(req)) return res.status(401).json({ message: 'Unauthorized' });
  const form = formidable({ multiples: false, uploadDir: '/tmp', keepExtensions: true });
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Upload error' });
    const file = files.file;
    if (!file) return res.status(400).json({ message: 'No file' });
    const name = Date.now() + '-' + path.basename(file.originalFilename || file.newFilename || file.filepath);
    const destDir = path.join(PUBLIC, 'addons');
    try {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, name);
      fs.renameSync(file.filepath, dest);
      return res.json({ url: '/addons/' + name });
    } catch(e){
      const tmpPath = file.filepath || file.path || file.file;
      return res.status(200).json({ url: '/tmp/' + path.basename(tmpPath), note: 'Saved to /tmp, move manually to public/addons for permanent access' });
    }
  });
});

app.post('/api/stats', (req, res) => {
  try {
    const data = req.body || {};
    const line = JSON.stringify({ ts: new Date().toISOString(), ...data }) + '\n';
    try { fs.appendFileSync(STATS_LOG, line); } catch(e){}
    return res.json({ ok: true });
  } catch(e){
    return res.status(400).json({ message: 'Bad request' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const txt = fs.existsSync(STATS_LOG) ? fs.readFileSync(STATS_LOG,'utf8') : '';
    res.type('text/plain').send(txt);
  } catch(e){ res.status(500).json({ message: 'Error' }); }
});

app.get('*', (req, res) => {
  const file = path.join(PUBLIC, req.path === '/' ? 'index.html' : req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return res.sendFile(file);
  return res.sendFile(path.join(PUBLIC, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server running on', PORT));
