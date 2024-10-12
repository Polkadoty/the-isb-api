import https from 'https';
import fetch from 'node-fetch';

const MAIN_API = 'https://api.swarmada.wiki';
const BACKUP_API = 'https://api-backup.swarmada.wiki';

let useMainApi = true;
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 5;
const RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes

const mainApiAgent = new https.Agent({
  ca: process.env.CLOUDFLARE_CA_CERT,
  rejectUnauthorized: true
});

const loadBalancer = async (req, res, next) => {
  const apiUrl = useMainApi ? MAIN_API : BACKUP_API;
  
  try {
    const apiResponse = await fetch(`${apiUrl}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      agent: apiUrl === MAIN_API ? mainApiAgent : undefined
    });

    if (apiResponse.ok) {
      consecutiveFailures = 0;
      const data = await apiResponse.json();
      return res.json(data);
    } else {
      throw new Error(`API responded with status ${apiResponse.status}`);
    }
  } catch (error) {
    console.error(`Error with ${apiUrl}:`, error);
    consecutiveFailures++;

    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      useMainApi = !useMainApi;
      console.log(`Switching to ${useMainApi ? 'Main' : 'Backup'} API due to consecutive failures`);
      consecutiveFailures = 0;
    }

    // Try the other API immediately
    const fallbackUrl = useMainApi ? BACKUP_API : MAIN_API;
    try {
      const fallbackResponse = await fetch(`${fallbackUrl}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        agent: fallbackUrl === MAIN_API ? mainApiAgent : undefined
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        return res.json(data);
      }
    } catch (fallbackError) {
      console.error(`Error with fallback ${fallbackUrl}:`, fallbackError);
    }

    // If both APIs fail, pass to the next middleware
    next(error);
  }
};

// Periodically reset to try the main API
setInterval(() => {
  if (!useMainApi) {
    useMainApi = true;
    console.log('Resetting to use Main API');
  }
}, RESET_INTERVAL);

export default loadBalancer;
