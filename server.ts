
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

const app = express();
const PORT = 3000;

// 1. Identification & Logging (Absolute First)
app.use((req, res, next) => {
  console.log(`[AIS-LOG] ${req.method} ${req.url}`);
  res.setHeader('X-AIS-Server', 'Express-v4-Final');
  res.setHeader('X-AIS-Time', new Date().toISOString());
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 2. API Routes
app.get('/ping-v4', (req, res) => {
  res.json({ 
    status: 'ok', 
    msg: 'Express v4 is alive',
    node: process.version
  });
});

app.post('/bridge-v4', async (req, res) => {
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
      timeout: 25000
    };

    if (data) {
      axiosConfig.data = typeof data === 'string' && data.startsWith('data:') 
        ? Buffer.from(data.split(',')[1], 'base64') 
        : data;
    }

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
    res.status(500).send(error.message);
  }
});

// 3. Static / Vite
async function init() {
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
    console.log(`[READY] AIS Server v4 on port ${PORT}`);
  });
}

init();
