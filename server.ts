
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

// AIS Nextcloud Bridge Server v6
// This server handles API requests and proxies them to Nextcloud.

const app = express();
const PORT = 3000;

// 1. Identification Middleware
app.use((req, res, next) => {
  console.log(`[AIS-SERVER] ${req.method} ${req.url}`);
  res.setHeader('X-AIS-Server', 'Express-v6-Final');
  res.setHeader('X-AIS-Timestamp', new Date().toISOString());
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 2. API Routes (Explicitly under /api)
const api = express.Router();

api.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '6.0.0',
    node: process.version,
    time: new Date().toISOString()
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
    console.error('[PROXY] Error:', error.message);
    res.status(500).send(error.message);
  }
});

app.use('/api', api);

// 3. Frontend / Static Files
async function start() {
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
    console.log(`[READY] AIS Server v6 listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('[FATAL] Server failed to start:', err);
});
