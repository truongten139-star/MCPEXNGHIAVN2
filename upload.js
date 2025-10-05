const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({message:'Method not allowed'});
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({message:'Upload error'});
    const file = files.file;
    if (!file) return res.status(400).json({message:'No file'});
    // On Vercel, writing to /tmp is allowed; move file to /public/addons if filesystem writable (not guaranteed)
    const tmpPath = file.path;
    const name = Date.now() + '-' + file.name;
    const destDir = path.join(process.cwd(), 'public', 'addons