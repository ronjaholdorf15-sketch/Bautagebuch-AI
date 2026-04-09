
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Basic Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // 2. Logging & Identification
  app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.url}`);
    res.setHeader('X-AIS-Server', 'Express-v3');
    res.setHeader('X-AIS-Timestamp', new Date().toISOString());
    next();
  });

  // 3. API Routes (Explicitly before static/vite)
  app.get('/nc-ping-v3', (req, res) => {
    console.log('Ping V3 received');
    res.json({ 
      status: 'ok', 
      version: '3.0.0',
      node: process.version,
      env: process.env.NODE_ENV 
    });
  });

  app.all('/nc-bridge-v3', async (req, res) => {
    const { url, method, username, password, data, headers: customHeaders } = req.body;
    
    if (!url && req.method === 'POST') {
      return res.status(400).send('Missing URL');
    }

    // For GET requests to the bridge (testing)
    if (req.method === 'GET') {
      return res.json({ message: 'Bridge is active. Use POST to proxy requests.' });
    }

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
        timeout: 20000
      };

      if (data) {
        axiosConfig.data = typeof data === 'string' && data.startsWith('data:') 
          ? Buffer.from(data.split(',')[1], 'base64') 
          : data;
      }

      console.log(`[PROXY] ${axiosConfig.method} -> ${url}`);
      const response = await axios(axiosConfig);
      console.log(`[PROXY] Response: ${response.status}`);

      // Forward headers
      const headersToForward = ['content-type', 'allow', 'webdav', 'dav', 'x-nextcloud-version', 'server'];
      headersToForward.forEach(h => {
        if (response.headers[h]) {
          res.setHeader(h, response.headers[h]);
        }
      });
      
      res.setHeader('X-Proxy-Status', response.status);
      if (response.headers['server']) res.setHeader('X-Nextcloud-Server', response.headers['server']);
      
      res.status(response.status).send(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      console.error('[PROXY] Fatal Error:', status, error.message);
      res.setHeader('X-Proxy-Error', 'true');
      res.status(status).send(error.message);
    }
  });

  // 4. Frontend / Static Files
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] AIS Nextcloud Bridge v3 on port ${PORT}`);
  });
}

startServer();
