
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const PORT = 3000;

// Multer für Datei-Uploads konfigurieren (im Speicher halten)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Proxy-Endpunkt für Nextcloud WebDAV
app.post("/api/nextcloud/upload", upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'images' }
]), async (req, res) => {
  try {
    const { projectLink, projectToken, folderName, pdfFilename } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const pdfFile = files['pdf']?.[0];
    const imageFiles = files['images'] || [];

    if (!projectLink || !projectToken || !folderName) {
      return res.status(400).json({ error: "Fehlende Parameter" });
    }

    const baseUrl = new URL(projectLink).origin;
    const webDavUrl = `${baseUrl}/public.php/webdav`;
    const targetFolderUrl = `${webDavUrl}/${folderName}`;
    
    const authHeader = `Basic ${Buffer.from(`${projectToken}:`).toString('base64')}`;
    const axiosConfig = {
      headers: { 'Authorization': authHeader }
    };

    console.log(`Starte Upload nach Nextcloud: ${targetFolderUrl}`);

    // 1. Ordner erstellen (MKCOL)
    try {
      await axios({
        method: 'MKCOL',
        url: targetFolderUrl,
        ...axiosConfig
      });
    } catch (e: any) {
      // 405 bedeutet oft, dass der Ordner bereits existiert - das ist okay
      if (e.response?.status !== 405) {
        console.warn("Ordner-Erstellung Warnung:", e.message);
      }
    }

    // 2. PDF hochladen
    if (pdfFile) {
      await axios({
        method: 'PUT',
        url: `${targetFolderUrl}/${pdfFilename}`,
        data: pdfFile.buffer,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'application/pdf'
        }
      });
    }

    // 3. Bilder hochladen
    for (const img of imageFiles) {
      await axios({
        method: 'PUT',
        url: `${targetFolderUrl}/${img.originalname}`,
        data: img.buffer,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': img.mimetype
        }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Nextcloud Proxy Fehler:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Upload fehlgeschlagen", 
      details: error.response?.statusText || error.message 
    });
  }
});

// Vite Middleware für die Frontend-Dateien
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Server läuft auf http://localhost:${PORT}`);
  });
}

startServer();
