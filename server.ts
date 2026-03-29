
import express from "express";
import cors from "cors";
import multer from "multer";
import axios from "axios";
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

    let baseUrl = projectLink.split('/s/')[0];
    // Falls der Link index.php enthält, entfernen wir es für den WebDAV-Pfad
    if (baseUrl.endsWith('/index.php')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 10);
    }
    const webDavUrl = `${baseUrl}/public.php/webdav`;
    const encodedFolderName = encodeURIComponent(folderName);
    const targetFolderUrl = `${webDavUrl}/${encodedFolderName}`;
    const targetFolderUrlWithSlash = `${targetFolderUrl}/`;
    
    const authHeader = `Basic ${Buffer.from(`${projectToken}:`).toString('base64')}`;
    const axiosConfig = {
      headers: { 
        'Authorization': authHeader,
        'User-Agent': 'Bautagebuch-App-Proxy',
        'Accept': '*/*'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    };

    console.log(`Starte Upload nach Nextcloud. Base: ${baseUrl}, Folder: ${folderName}`);

    // 1. Ordner erstellen (MKCOL)
    try {
      await axios({
        method: 'MKCOL',
        url: targetFolderUrlWithSlash,
        ...axiosConfig
      });
      console.log(`Ordner erstellt: ${folderName}`);
    } catch (e: any) {
      // 405 bedeutet oft, dass der Ordner bereits existiert - das ist okay
      if (e.response?.status === 405) {
        console.log(`Ordner existiert bereits: ${folderName}`);
      } else if (e.response?.status === 403) {
        console.error("Berechtigungsfehler (403): Prüfen Sie, ob 'Bearbeiten erlauben' in Nextcloud aktiviert ist.");
        throw new Error("Berechtigungsfehler (403): Bitte 'Bearbeiten erlauben' in der Nextcloud-Freigabe aktivieren.");
      } else {
        console.error("Ordner-Erstellung Fehler:", e.response?.status, e.response?.data || e.message);
        // Wir machen trotzdem weiter, vielleicht klappt der Upload ja
      }
    }

    // 2. PDF hochladen
    if (pdfFile) {
      const encodedPdfFilename = encodeURIComponent(pdfFilename);
      console.log(`Lade PDF hoch: ${pdfFilename}`);
      await axios({
        method: 'PUT',
        url: `${targetFolderUrl}/${encodedPdfFilename}`,
        data: pdfFile.buffer,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': 'application/pdf'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
    }

    // 3. Bilder hochladen
    for (const img of imageFiles) {
      const encodedImgName = encodeURIComponent(img.originalname);
      console.log(`Lade Bild hoch: ${img.originalname}`);
      await axios({
        method: 'PUT',
        url: `${targetFolderUrl}/${encodedImgName}`,
        data: img.buffer,
        headers: {
          ...axiosConfig.headers,
          'Content-Type': img.mimetype
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
    }

    console.log("Upload erfolgreich abgeschlossen.");
    res.json({ success: true });
  } catch (error: any) {
    console.error("Nextcloud Proxy Fehler:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    res.status(500).json({ 
      error: "Upload fehlgeschlagen", 
      details: error.response?.statusText || error.message 
    });
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
