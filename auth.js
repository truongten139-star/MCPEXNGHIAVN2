module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({message:'Method not allowed'});
  const { key } = req.body;
  // Replace this check with env var in production: process.env.ADMIN_KEY
  const ADMIN_KEY = process.env.ADMIN_KEY || 'mcpex-secret-2025';
  if (key === ADMIN_KEY) {
    // simple token (in prod use JWT)
    const token = Buffer.from(`${key}:${Date.now()}`).toString('base64');
    return res.status(200).json({ token, expiresIn: 3600 });
  } else {
    return res.status(401).json({ message: 'Key invalid' });
  }
};