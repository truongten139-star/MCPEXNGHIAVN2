const fs = require('fs');
const path = require('path');
const LOG = path.join(process.cwd(), 'public', 'stats.log');

module.exports = (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const line = JSON.stringify({ ts: new Date().toISOString(), ...data }) + '\n';
        try { fs.appendFileSync(LOG, line); } catch(e){}
        return res.status(200).json({ ok: true });
      } catch(e){
        return res.status(400).json({ message: 'Bad request' });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    try {
      const txt = fs.existsSync(LOG) ? fs.readFileSync(LOG,'utf8') : '';
      return res.status(200).send(txt);
    } catch(e){ return res.status(500).json({ message: 'Error' }); }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};