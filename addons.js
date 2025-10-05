const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'public', 'addons.json');

function readData(){
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch(e){ return []; }
}
function writeData(d){
  fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));
}

function authenticate(req){
  const auth = req.headers.authorization || '';
  if (!auth) return false;
  const token = auth.replace('Bearer ','');
  // In real prod, validate JWT or lookup token store. Here accept base64 from auth route.
  return !!token;
}

module.exports = (req, res) => {
  if (req.method === 'GET') {
    if (req.query.export === '1') {
      const data = readData();
      res.setHeader('Content-Disposition', 'attachment; filename="addons-export.json"');
      return res.status(200).send(JSON.stringify(data, null, 2));
    }
    const data = readData();
    return res.status(200).json(data);
  }

  if (!authenticate(req)) return res.status(401).json({message:'Unauthorized'});

  if (req.method === 'POST') {
    const body = req.body;
    const data = readData();
    const id = body.id || (body.title||'item').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Date.now();
    const item = Object.assign({ id, createdAt: new Date().toISOString() }, body);
    data.unshift(item);
    writeData(data);
    return res.status(201).json(item);
  }

  if (req.method === 'PUT') {
    const body = req.body;
    const data = readData();
    const idx = data.findIndex(x=>x.id===body.id);
    if (idx===-1) return res.status(404).json({message:'Not found'});
    data[idx] = Object.assign(data[idx], body, { updatedAt: new Date().toISOString() });
    writeData(data);
    return res.status(200).json(data[idx]);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({message:'Missing id'});
    let data = readData();
    data = data.filter(x=>x.id!==id);
    writeData(data);
    return res.status(200).json({deleted:id});
  }

  return res.status(405).json({message:'Method not allowed'});
};
