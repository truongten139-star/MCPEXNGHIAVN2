const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(process.cwd(), 'public', 'addons.json');
function read(){ try{return JSON.parse(fs.readFileSync(DATA_PATH,'utf8'))}catch(e){return[]} }
module.exports = (req,res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ message: 'Missing id' });
  const item = read().find(x=>x.id === id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  return res.status(200).json(item);
};
