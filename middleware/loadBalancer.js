import fetch from 'node-fetch';

const MAIN_API = 'https://api.swarmada.wiki';
const BACKUP_API = 'https://api-backup.swarmada.wiki';

const loadBalancer = async (req, res, next) => {
  try {
    const mainApiResponse = await fetch(`${MAIN_API}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (mainApiResponse.ok) {
      const data = await mainApiResponse.json();
      return res.json(data);
    }

    // If main API fails, try backup
    const backupApiResponse = await fetch(`${BACKUP_API}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (backupApiResponse.ok) {
      const data = await backupApiResponse.json();
      return res.json(data);
    }

    // If both fail, pass to the next middleware (which will be your routes)
    next();
  } catch (error) {
    console.error('Load balancer error:', error);
    next();
  }
};

export default loadBalancer;