
import { DiaryEntry, PublicProject } from '../types';

const normalizeBaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (e) {
    return url;
  }
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
