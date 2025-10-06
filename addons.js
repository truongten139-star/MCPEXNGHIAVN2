const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(process.cwd(), 'public', 'addons.json');

function readData(){ try { return JSON.parse(fs.readFileSync(DATA_PATH,'utf8')); } catch(e){ return []; } }
function writeData(d){ fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2)); }

function authenticate(req){
  const auth = req.headers.authorization || '';
  if (!auth) return false;
  const token = auth.replace('Bearer ','').trim();
  return !!token;
}

module.exports = (req, res) => {
  if (req.method === 'GET') {
    const data = readData();
    if (req.query && req.query.export === '1') {
      res.setHeader('Content-Disposition', 'attachment; filename="addons-export.json"');
      return res.status(200).send(JSON.stringify(data, null, 2));
    }
    return res.status(200).json(data);
  }

  if (!authenticate(req)) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'POST') {
    let body = '';
    req.on('data', c=> body += c);
    req.on('end', () => {
      const payload = JSON.parse(body || '{}');
      const data = readData();
      const id = payload.id || (payload.title||'item').toLowerCase().replace(/\s+/g,'-') + '-' + Date.now();
      const item = Object.assign({ id, createdAt: new Date().toISOString() }, payload);
      data.unshift(item);
      writeData(data);
      return res.status(201).json(item);
    });
    return;
  }

  if (req.method === 'PUT') {
    let body = '';
    req.on('data', c=> body += c);
    req.on('end', () => {
      const payload = JSON.parse(body || '{}');
      const data = readData();
      const idx = data.findIndex(x=>x.id === payload.id);
      if (idx === -1) return res.status(404).json({ message: 'Not found' });
      data[idx] = Object.assign(data[idx], payload, { updatedAt: new Date().toISOString() });
      writeData(data);
      return res.status(200).json(data[idx]);
    });
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ message: 'Missing id' });
    let data = readData();
    data = data.filter(x=>x.id !== id);
    writeData(data);
    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
