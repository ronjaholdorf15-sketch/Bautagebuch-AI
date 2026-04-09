
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

// This is the main entry point for the AIS Express server.
// It handles both the API proxy and serving the Vite frontend.

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Global Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // 2. API Router - Mounted BEFORE anything else
  const api = express.Router();

  api.use((req, res, next) => {
    console.log(`[API-LOG] ${req.method} ${req.url}`);
    res.setHeader('X-AIS-Server', 'Express-v5-Final');
    res.setHeader('X-AIS-Time', new Date().toISOString());
    next();
  });

  api.get('/ping', (req, res) => {
    res.json({ 
      status: 'ok', 
      msg: 'AIS Express v5 is active',
      node: process.version,
      timestamp: Date.now()
    });
  });

  api.post('/bridge', async (req, res) => {
    const { url, method, username, password, data, headers: customHeaders } = req.body;
    
    if (!url) return res.status(400).send('Missing URL');

    try {
      const authHeader = (username && password) 
        ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
        : undefined;

      const axiosConfig: any = {
        url,
        method: method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': '*/*',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          ...customHeaders
        },
        responseType: 'arraybuffer',
        maxRedirects: 5,
        validateStatus: () => true,
        timeout: 30000
      };

      if (data) {
        axiosConfig.data = typeof data === 'string' && data.startsWith('data:') 
          ? Buffer.from(data.split(',')[1], 'base64') 
          : data;
      }

      console.log(`[PROXY] ${axiosConfig.method} -> ${url}`);
      const response = await axios(axiosConfig);
      
      // Forward headers
      const headersToForward = ['content-type', 'allow', 'webdav', 'dav', 'x-nextcloud-version', 'server'];
      headersToForward.forEach(h => {
        if (response.headers[h]) {
          res.setHeader(h, response.headers[h]);
        }
      });
      
      res.setHeader('X-Proxy-Status', response.status);
      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error('[PROXY] Error:', error.message);
      res.status(500).send(error.message);
    }
  });

  // Mount the API router at a very specific path
  app.use('/ais-api-v5', api);

  // 3. Frontend / Static Files
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use vite as a middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] AIS Server v5 listening on port ${PORT}`);
    console.log(`[READY] API endpoint: /ais-api-v5/ping`);
  });
}

startServer().catch(err => {
  console.error('[FATAL] Failed to start server:', err);
});
