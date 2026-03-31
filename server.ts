
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
  const { url, method, username, password, data, headers } = req.body;

  try {
    const response = await axios({
      url,
      method,
      auth: {
        username,
        password
      },
      data: data ? (typeof data === 'string' && data.startsWith('data:') ? Buffer.from(data.split(',')[1], 'base64') : data) : undefined,
      headers: {
        ...headers,
        'User-Agent': 'Bautagebuch-App/1.0'
      },
      responseType: 'arraybuffer'
    });

    res.status(response.status).send(response.data);
  } catch (error: any) {
    console.error('Nextcloud Proxy Error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).send(error.response?.data || error.message);
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
