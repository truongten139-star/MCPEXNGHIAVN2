module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const json = JSON.parse(body || '{}');
      const key = json.key;
      const ADMIN_KEY = process.env.ADMIN_KEY || 'mcpex-secret-2025';
      if (key === ADMIN_KEY) {
        const token = Buffer.from(`${key}:${Date.now()}`).toString('base64');
        return res.status(200).json({ token, expiresIn: 3600 });
      } else {
        return res.status(401).json({ message: 'Key invalid' });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Bad request' });
    }
  });
};
