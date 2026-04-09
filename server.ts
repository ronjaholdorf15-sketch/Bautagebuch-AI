
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

const app = express();
const PORT = 3000;

// Global identification header
app.use((req, res, next) => {
  res.setHeader('X-AIS-Server', 'Express-v1');
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Nextcloud Proxy Routes to bypass CORS
app.post('/nc-bridge-v1', async (req, res) => {
  const { url, method, username, password, data, headers: customHeaders } = req.body;

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

    console.log(`Proxy Request: ${axiosConfig.method} ${url} (User: ${username})`);
    const response = await axios(axiosConfig);
    console.log(`Proxy Response: ${response.status} for ${url}`);

    // Forward relevant headers
    const headersToForward = ['content-type', 'allow', 'webdav', 'dav', 'x-nextcloud-version', 'server'];
    headersToForward.forEach(h => {
      if (response.headers[h]) {
        res.setHeader(h, response.headers[h]);
      }
    });
    
    // Forward relevant headers to client for debugging
    res.setHeader('X-Proxy-Status', response.status);
    if (response.headers['server']) res.setHeader('X-Nextcloud-Server', response.headers['server']);
    
    res.status(response.status).send(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data ? Buffer.from(error.response.data).toString('utf8') : error.message;
    console.error('Nextcloud Proxy Fatal Error:', status, errorData);
    res.setHeader('X-Proxy-Error', 'true');
    res.status(status).send(errorData);
  }
});

app.get('/nc-ping-v1', (req, res) => {
  res.json({ status: 'ok', server: 'AIS-Express-v1' });
});

// Vite Middleware für die Frontend-Dateien
async function startServer() {
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
    console.log(`[SERVER START] AIS Nextcloud Bridge running on http://localhost:${PORT}`);
    console.log(`[SERVER START] Routes: /nc-bridge-v1 (POST), /nc-ping-v1 (GET)`);
  });
}

startServer();
