
import express from "express";
import cors from "cors";
import multer from "multer";
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
    const projectLink = (req.body.projectLink || "").trim();
    const projectToken = (req.body.projectToken || "").trim();
    const { folderName, pdfFilename, test } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!projectLink || !projectToken) {
      return res.status(400).json({ error: "Fehlende Parameter" });
    }

    let baseUrl = projectLink.split('/s/')[0];
    if (baseUrl.endsWith('/index.php')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 10);
    }
    const webDavUrl = `${baseUrl}/public.php/webdav`;
    
    const authHeader = `Basic ${Buffer.from(`${projectToken}:`).toString('base64')}`;
    console.log(`Auth-Header erstellt (Base64 Länge: ${authHeader.length})`);
    
    const commonHeaders = { 
      'Authorization': authHeader,
      'User-Agent': 'Bautagebuch-App-Proxy',
      'Accept': '*/*',
      'OCS-APIRequest': 'true'
    };

    // Test-Verbindung: Prüfen ob der Token gültig ist
    if (test === 'true') {
      console.log(`Test-Verbindung für: ${baseUrl}`);
      try {
        const response = await fetch(webDavUrl, {
          method: 'PROPFIND',
          headers: { ...commonHeaders, 'Depth': '0' }
        });
        
        if (!response.ok) {
          throw new Error(`Nextcloud returned ${response.status}: ${response.statusText}`);
        }
        
        return res.json({ success: true, message: "Verbindung erfolgreich" });
      } catch (e: any) {
        console.error("Test-Verbindung Fehler:", e.message);
        return res.status(500).json({ 
          error: "Verbindung fehlgeschlagen", 
          details: e.message
        });
      }
    }

    if (!folderName) {
      return res.status(400).json({ error: "Fehlender Ordnername" });
    }

    const pdfFile = files['pdf']?.[0];
    const imageFiles = files['images'] || [];

    const encodedFolderName = encodeURIComponent(folderName);
    const targetFolderUrl = `${webDavUrl}/${encodedFolderName}`;
    const targetFolderUrlWithSlash = `${targetFolderUrl}/`;
    
    console.log(`Starte Upload nach Nextcloud. Base: ${baseUrl}, Folder: ${folderName}`);

    // 1. Ordner erstellen (MKCOL)
    try {
      const mkcolRes = await fetch(targetFolderUrlWithSlash, {
        method: 'MKCOL',
        headers: commonHeaders
      });
      
      if (mkcolRes.status === 405) {
        console.log(`Ordner existiert bereits: ${folderName}`);
      } else if (mkcolRes.status === 403) {
        const errorMsg = "Berechtigungsfehler (403): Bitte prüfen Sie, ob in Nextcloud die Option 'Bearbeiten erlauben' für diesen Link aktiviert ist.";
        console.error(errorMsg);
        return res.status(403).json({ error: "Berechtigungsfehler", details: errorMsg });
      } else if (!mkcolRes.ok) {
        console.warn(`Ordner-Erstellung Warnung: ${mkcolRes.status} ${mkcolRes.statusText}`);
      } else {
        console.log(`Ordner erstellt: ${folderName}`);
      }
    } catch (e: any) {
      console.error("Ordner-Erstellung Exception:", e.message);
    }

    // 2. PDF hochladen
    if (pdfFile) {
      const encodedPdfFilename = encodeURIComponent(pdfFilename);
      console.log(`Lade PDF hoch: ${pdfFilename}`);
      const pdfRes = await fetch(`${targetFolderUrl}/${encodedPdfFilename}`, {
        method: 'PUT',
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/pdf'
        },
        body: pdfFile.buffer as any
      });
      
      if (!pdfRes.ok) {
        if (pdfRes.status === 403) {
          return res.status(403).json({ 
            error: "Berechtigungsfehler", 
            details: "PDF-Upload fehlgeschlagen (403). Bitte 'Bearbeiten erlauben' in Nextcloud aktivieren." 
          });
        }
        throw new Error(`PDF Upload fehlgeschlagen: ${pdfRes.status} ${pdfRes.statusText}`);
      }
    }

    // 3. Bilder hochladen
    for (const img of imageFiles) {
      const encodedImgName = encodeURIComponent(img.originalname);
      console.log(`Lade Bild hoch: ${img.originalname}`);
      const imgRes = await fetch(`${targetFolderUrl}/${encodedImgName}`, {
        method: 'PUT',
        headers: {
          ...commonHeaders,
          'Content-Type': img.mimetype
        },
        body: img.buffer as any
      });
      
      if (!imgRes.ok) {
        console.error(`Bild-Upload fehlgeschlagen: ${img.originalname} (${imgRes.status})`);
      }
    }

    console.log("Upload erfolgreich abgeschlossen.");
    res.json({ success: true });
  } catch (error: any) {
    console.error("Nextcloud Proxy Fehler:", error.message);
    res.status(500).json({ 
      error: "Upload fehlgeschlagen", 
      details: error.message 
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
