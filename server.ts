
import express from "express";
import cors from "cors";
import path from "path";
import axios from "axios";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Nextcloud Proxy Routes to bypass CORS
app.post('/api/nextcloud/proxy', async (req, res) => {
  const { url, method, username, password, data, headers: customHeaders } = req.body;

  try {
    const axiosConfig: any = {
      url,
      method: method || 'GET',
      auth: {
        username,
        password
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        ...customHeaders
      },
      responseType: 'arraybuffer',
      maxRedirects: 5,
      validateStatus: () => true // Handle all status codes manually
    };

    if (data) {
      axiosConfig.data = typeof data === 'string' && data.startsWith('data:') 
        ? Buffer.from(data.split(',')[1], 'base64') 
        : data;
    }

    const response = await axios(axiosConfig);

    // Forward relevant headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    res.status(response.status).send(response.data);
  } catch (error: any) {
    console.error('Nextcloud Proxy Error:', error.response?.status, error.message);
    const status = error.response?.status || 500;
    const errorData = error.response?.data || error.message;
    res.status(status).send(errorData);
  }
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
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

startServer();
