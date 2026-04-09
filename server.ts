
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

// AIS Nextcloud Bridge Server v8
// Extreme logging and top-level route definition.

const app = express();
const PORT = 3000;

console.log('[BOOT] Starting AIS Server v8...');

// 1. Basic Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 2. API Routes - DEFINED AT THE VERY TOP
app.all('/ais-v8-ping', (req, res) => {
  console.log('[AIS] Ping V8 Received');
  res.setHeader('X-AIS-Server', 'Express-v8-Final');
  res.setHeader('X-AIS-Timestamp', new Date().toISOString());
  res.json({ status: 'ok', version: '8.0.0', env: process.env.NODE_ENV });
});

app.post('/ais-v8-bridge', async (req, res) => {
  const { url, method, username, password, data, headers: customHeaders } = req.body;
  console.log(`[AIS] Bridge V8 Request: ${method} -> ${url}`);
  res.setHeader('X-AIS-Server', 'Express-v8-Final');
  res.setHeader('X-AIS-Timestamp', new Date().toISOString());

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

    const response = await axios(axiosConfig);
    console.log(`[AIS] Target Response: ${response.status}`);

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
    console.error('[AIS] Bridge Error:', error.message);
    res.status(500).send(error.message);
  }
});

// 3. Frontend / Static Files - DEFINED AFTER API
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
    console.log(`[READY] AIS Server v7 on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('[FATAL] Server failed:', err);
});
