
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

const app = express();
const PORT = 3000;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Logging Middleware (First!)
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    res.setHeader('X-AIS-Debug', 'Active');
    res.setHeader('X-AIS-Server', 'Express-v1');
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // 2. API Routes
  app.get('/healthz', (req, res) => res.send('ok'));
  
  app.get('/nc-ping-v2', (req, res) => {
    console.log('Ping received');
    res.json({ 
      status: 'ok', 
      server: 'AIS-Express-v2',
      env: process.env.NODE_ENV,
      time: new Date().toISOString()
    });
  });

  app.post('/nc-bridge-v2', async (req, res) => {
    const { url, method, username, password, data, headers: customHeaders } = req.body;
    console.log(`Bridge request to: ${url} [${method}]`);

    if (!url) {
      return res.status(400).send('Missing URL parameter');
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
        timeout: 15000
      };

      if (data) {
        axiosConfig.data = typeof data === 'string' && data.startsWith('data:') 
          ? Buffer.from(data.split(',')[1], 'base64') 
          : data;
      }

      const response = await axios(axiosConfig);
      console.log(`Target Response: ${response.status}`);

      // Forward relevant headers
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
      console.error('Bridge Error:', status, error.message);
      res.setHeader('X-Proxy-Error', 'true');
      res.status(status).send(error.message);
    }
  });

  // 3. Frontend / Static Files
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] Server on port ${PORT}`);
  });
}

startServer();
