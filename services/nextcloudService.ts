
import { DiaryEntry, PublicProject, AppConfig } from '../types';

const normalizeBaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (e) {
    return url;
  }
};

const extractToken = (url: string) => {
    const parts = url.split('/s/');
    if (parts.length === 2) {
      return parts[1].split('/')[0]; 
    }
    return '';
};

// Modified to accept PDF Blob and upload it via Public Share Token
export const uploadDiaryEntry = async (
    project: PublicProject, 
    entry: DiaryEntry, 
    pdfBlob: Blob
): Promise<void> => {
  
  // Construct WebDAV URL for Public Share
  // Format: https://cloud.domain.com/public.php/webdav
  const baseUrl = normalizeBaseUrl(project.link);
  const webDavUrl = `${baseUrl}/public.php/webdav`;

  // Auth for Public Share is Username = Token, Password = (any, usually empty or same as token)
  // We use the Token as the username.
  const authHeaders = {
    'Authorization': `Basic ${btoa(`${project.token}:`)}`, // Token as user, empty password
    'OCS-APIRequest': 'true'
  };

  // 1. Create Day/Report Folder with Technician Name
  // Note: In a public share, the root is the shared folder itself.
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTechName = entry.technician.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
  const folderName = `${entry.date}_${safeTechName}`;
  const targetFolderUrl = `${webDavUrl}/${folderName}`;

  // Try creating the entry folder
  const mkcolRes = await fetch(targetFolderUrl, {
    method: 'MKCOL',
    headers: authHeaders
  });

  if (!mkcolRes.ok && mkcolRes.status !== 405) { 
     if (mkcolRes.status === 401) throw new Error("Zugriff verweigert (Token ungültig?).");
     if (mkcolRes.status === 404) throw new Error("Server nicht erreicht (404).");
     // 405 means folder exists, which is fine
  }

  // 2. Upload PDF Report
  const pdfFilename = `Bautagebuch_${entry.date}_${safeTechName}_${timestamp.slice(11,19)}.pdf`;
  
  const pdfRes = await fetch(`${targetFolderUrl}/${pdfFilename}`, {
    method: 'PUT',
    headers: {
        ...authHeaders,
        'Content-Type': 'application/pdf'
    },
    body: pdfBlob
  });

  if (!pdfRes.ok) throw new Error("Fehler beim Hochladen des PDF Berichts.");

  // 3. Upload Original Images (Backup/High Res)
  for (let i = 0; i < entry.images.length; i++) {
    const file = entry.images[i];
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `Img_${i + 1}_${safeFileName}`;
    
    const imgRes = await fetch(`${targetFolderUrl}/${fileName}`, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': file.type || 'image/jpeg'
      },
      body: file
    });

    if (!imgRes.ok) throw new Error(`Bild-Upload fehlgeschlagen: ${fileName}`);
  }
};

// --- GLOBAL SYNC FUNCTIONS ---

export interface GlobalSyncData {
    technicians: AppConfig['technicians'];
    projects: AppConfig['projects'];
    customLogo: string | null;
    updatedAt: string;
}

const CONFIG_FILENAME = 'bautagebuch_global_config.json';

// Fetch global config from the sync link
export const fetchAppConfig = async (syncLink: string): Promise<GlobalSyncData | null> => {
    try {
        const token = extractToken(syncLink);
        if (!token) return null;

        const baseUrl = normalizeBaseUrl(syncLink);
        const webDavUrl = `${baseUrl}/public.php/webdav/${CONFIG_FILENAME}`;
        
        const response = await fetch(webDavUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${token}:`)}`,
                'OCS-APIRequest': 'true'
            }
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (e) {
        console.error("Failed to fetch global config", e);
        return null;
    }
};

// Save global config to the sync link
export const saveAppConfig = async (syncLink: string, data: GlobalSyncData): Promise<boolean> => {
    try {
        const token = extractToken(syncLink);
        if (!token) return false;

        const baseUrl = normalizeBaseUrl(syncLink);
        const webDavUrl = `${baseUrl}/public.php/webdav/${CONFIG_FILENAME}`;
        
        const jsonString = JSON.stringify(data, null, 2);

        const response = await fetch(webDavUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${btoa(`${token}:`)}`,
                'Content-Type': 'application/json',
                'OCS-APIRequest': 'true'
            },
            body: jsonString
        });

        return response.ok;
    } catch (e) {
        console.error("Failed to save global config", e);
        return false;
    }
};
