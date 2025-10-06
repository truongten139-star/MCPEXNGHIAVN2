const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ message: 'Upload error' });
    const file = files.file;
    if (!file) return res.status(400).json({ message: 'No file' });
    const name = Date.now() + '-' + file.name;
    const destDir = path.join(process.cwd(), 'public', 'addons');
    try {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const dest = path.join(destDir, name);
      fs.renameSync(file.path, dest);
      const url = '/addons/' + name;
      return res.status(200).json({ url });
    } catch(e){
      return res.status(200).json({ url: '/addons/' + name, note: 'If writing fails, upload manually to public/addons/' });
    }
  });
};
