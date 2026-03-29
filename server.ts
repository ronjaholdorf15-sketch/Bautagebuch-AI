
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

    if (!projectLink.includes('/s/')) {
      return res.status(400).json({ 
        error: "Ungültiger Link-Typ", 
        details: "Der Link muss ein öffentlicher Freigabe-Link sein (enthält '/s/'). Links aus der Browser-Adresszeile funktionieren nicht." 
      });
    }

    let baseUrl = projectLink.split('/s/')[0];
    
    // Remove index.php if present at the end
    baseUrl = baseUrl.replace(/\/index\.php$/, '');
    
    // Remove trailing slash from baseUrl if present
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const webDavUrl = `${baseUrl}/public.php/webdav`;
    
    const authHeader = `Basic ${Buffer.from(`${projectToken}:`).toString('base64')}`;
    console.log(`Nextcloud Request: Base=${baseUrl}, Token=${projectToken.substring(0, 3)}...`);
    console.log(`WebDAV URL: ${webDavUrl}`);
    
    const commonHeaders = { 
      'Authorization': authHeader,
      'User-Agent': 'Bautagebuch-App-Proxy',
      'Accept': '*/*',
      'OCS-APIRequest': 'true'
    };

    // Test-Verbindung: Prüfen ob der Token gültig ist
    if (test === 'true') {
      console.log(`Test-Verbindung für: ${webDavUrl}`);
      try {
        const response = await fetch(webDavUrl, {
          method: 'PROPFIND',
          headers: { ...commonHeaders, 'Depth': '0' }
        });
        
        console.log(`Test-Verbindung Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const body = await response.text();
          console.error(`Test-Verbindung fehlgeschlagen. Status: ${response.status}, Content-Type: ${contentType}`);
          console.error(`Body (Auszug): ${body.substring(0, 500)}`);
          
          let errorDetail = `Nextcloud antwortete mit ${response.status}: ${response.statusText}`;
          
          if (contentType.includes('text/html')) {
            errorDetail = "Anmeldung verweigert oder Umleitung auf Login-Seite. Das passiert oft, wenn der Link kein 'Öffentlicher Link' ist oder ein Passwort benötigt wird. Bitte stellen Sie sicher, dass Sie den Link über 'Teilen' -> 'Öffentlicher Link' erstellt haben.";
          } else if (response.status === 401) {
            errorDetail = "Anmeldung verweigert (401). Der Token ist ungültig oder die Freigabe ist mit einem Passwort geschützt.";
          } else if (response.status === 403) {
            errorDetail = "Zugriff verweigert (403). Bitte prüfen Sie, ob 'Bearbeiten erlauben' in Nextcloud aktiviert ist.";
          } else if (response.status === 404) {
            errorDetail = "Nicht gefunden (404). Die WebDAV-URL ist ungültig. Haben Sie den Link korrekt kopiert?";
          }
          
          return res.status(response.status).json({ 
            error: "Verbindung fehlgeschlagen", 
            details: errorDetail 
          });
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
    
    console.log(`Starte Upload. Ziel-Ordner: ${targetFolderUrlWithSlash}`);

    // 1. Ordner erstellen (MKCOL)
    try {
      const mkcolRes = await fetch(targetFolderUrlWithSlash, {
        method: 'MKCOL',
        headers: commonHeaders
      });
      
      console.log(`MKCOL Status: ${mkcolRes.status} ${mkcolRes.statusText}`);
      
      if (mkcolRes.status === 405) {
        console.log(`Ordner existiert bereits: ${folderName}`);
      } else if (mkcolRes.status === 403) {
        const errorMsg = "Berechtigungsfehler (403): Bitte prüfen Sie, ob in Nextcloud die Option 'Bearbeiten erlauben' für diesen Link aktiviert ist.";
        console.error(errorMsg);
        return res.status(403).json({ error: "Berechtigungsfehler", details: errorMsg });
      } else if (!mkcolRes.ok) {
        const body = await mkcolRes.text();
        console.warn(`Ordner-Erstellung Warnung: ${mkcolRes.status} ${body.substring(0, 100)}`);
      } else {
        console.log(`Ordner erstellt: ${folderName}`);
      }
    } catch (e: any) {
      console.error("Ordner-Erstellung Exception:", e.message);
    }

    // 2. PDF hochladen
    if (pdfFile) {
      const encodedPdfFilename = encodeURIComponent(pdfFilename);
      const pdfUrl = `${targetFolderUrl}/${encodedPdfFilename}`;
      console.log(`Lade PDF hoch: ${pdfUrl}`);
      
      const pdfRes = await fetch(pdfUrl, {
        method: 'PUT',
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/pdf'
        },
        body: pdfFile.buffer as any
      });
      
      console.log(`PDF PUT Status: ${pdfRes.status} ${pdfRes.statusText}`);
      
      if (!pdfRes.ok) {
        const body = await pdfRes.text();
        console.error(`PDF Upload Fehler Body: ${body.substring(0, 200)}`);
        
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
      const imgUrl = `${targetFolderUrl}/${encodedImgName}`;
      console.log(`Lade Bild hoch: ${imgUrl}`);
      
      const imgRes = await fetch(imgUrl, {
        method: 'PUT',
        headers: {
          ...commonHeaders,
          'Content-Type': img.mimetype
        },
        body: img.buffer as any
      });
      
      console.log(`Bild PUT Status: ${imgRes.status} ${imgRes.statusText}`);
      
      if (!imgRes.ok) {
        const body = await imgRes.text();
        console.error(`Bild-Upload fehlgeschlagen: ${img.originalname} (${imgRes.status}) - ${body.substring(0, 100)}`);
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
