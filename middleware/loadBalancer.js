import https from 'https';
import fetch from 'node-fetch';

const MAIN_API = 'https://api.swarmada.wiki';
const BACKUP_API = 'https://api-backup.swarmada.wiki';

let useMainApi = true;
const HEALTH_CHECK_INTERVAL = 60000; // Check every 60 seconds

const checkApiHealth = async (apiUrl) => {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      timeout: 5000 // 5 seconds timeout
    });
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${apiUrl}:`, error);
    return false;
  }
};

// Periodic health check
setInterval(async () => {
  const mainApiHealthy = await checkApiHealth(MAIN_API);
  useMainApi = mainApiHealthy;
  console.log(`Main API is ${mainApiHealthy ? 'healthy' : 'unhealthy'}. Using ${useMainApi ? 'Main' : 'Backup'} API.`);
}, HEALTH_CHECK_INTERVAL);

const loadBalancer = async (req, res, next) => {
  const apiUrl = useMainApi ? MAIN_API : BACKUP_API;
  
  try {
    const apiResponse = await fetch(`${apiUrl}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return res.json(data);
    }

    // If the current API fails, try the other one
    const fallbackUrl = useMainApi ? BACKUP_API : MAIN_API;
    const fallbackResponse = await fetch(`${fallbackUrl}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return res.json(data);
    }

    // If both fail, pass to the next middleware
    next();
  } catch (error) {
    console.error('Load balancer error:', error);
    next(error);
  }
};

export default loadBalancer;
