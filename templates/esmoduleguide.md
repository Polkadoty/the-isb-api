

I see. The error you're encountering is due to mixing CommonJS (`require`) and ES Module (`import`) syntax. Let's fix this for both your local server and the Vercel deployment.

For your local server:

1. Update your `index.js` file to use ES Module syntax consistently:

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fetch from 'node-fetch';
import shipRoutes from './routes/shipRoutes.js';
import squadronRoutes from './routes/squadronRoutes.js';
import upgradeRoutes from './routes/upgradeRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import baseRoutes from './routes/baseRoutes.js';
import objectiveRoutes from './routes/objectiveRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

const MAIN_API = 'https://api.swarmada.wiki';
const BACKUP_API = 'https://api-backup.swarmada.wiki';

// ... rest of your code ...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

2. Update all your route files and middleware to use ES Module syntax. For example, in `shipRoutes.js`:

```javascript
import express from 'express';
import { getAllShips, getShipById } from '../controllers/shipController.js';

const router = express.Router();

// ... your routes ...

export default router;
```

3. Make sure your `package.json` includes:

```json
{
  "type": "module",
  // ... other configurations ...
}
```

4. Update your PM2 start command:

```bash
pm2 start index.js --node-args="--experimental-modules"
```

For Vercel:

1. Make sure all your files use ES Module syntax as shown above.

2. Update your `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

3. If you're using any CommonJS modules that don't support ES Module syntax, you might need to use dynamic imports. For example:

```javascript
const someModule = await import('some-commonjs-module');
```

After making these changes:

1. For your local server:
   - Stop PM2: `pm2 stop all`
   - Delete the current process: `pm2 delete all`
   - Start your app again: `pm2 start index.js --node-args="--experimental-modules"`
   - Check logs: `pm2 logs`

2. For Vercel:
   - Commit and push your changes
   - Redeploy your application

3. Check your Nginx configuration to ensure it's correctly proxying to your Node.js application.

If you're still getting a 502 error after these changes, please check your Nginx error logs (`/var/log/nginx/error.log`) and provide any relevant errors. Also, make sure your firewall isn't blocking the connection between Nginx and your Node.js application.