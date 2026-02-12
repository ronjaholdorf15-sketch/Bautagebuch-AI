
import { DiaryEntry, PublicProject } from '../types';

const normalizeBaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (e) { return url; }
};

export const uploadDiaryEntry = async (
    project: PublicProject, 
    entry: DiaryEntry, 
    pdfBlob: Blob
): Promise<void> => {
  
  const baseUrl = normalizeBaseUrl(project.link);
  const webDavUrl = `${baseUrl}/public.php/webdav`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTechName = entry.technician.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
  const folderName = `${entry.date}_${safeTechName}`;
  const targetFolderUrl = `${webDavUrl}/${folderName}`;

  // Basic Auth mit Token als Username, Passwort leer
  const authHeaders = {
    'Authorization': `Basic ${btoa(`${project.token}:`)}`,
  };

  // 1. Ordner erstellen (Ignorieren wenn existiert)
  try {
      await fetch(targetFolderUrl, {
        method: 'MKCOL',
        headers: authHeaders
      });
  } catch (e) {
      console.warn("Ordner-Erstellung fehlgeschlagen, fahre fort...", e);
  }

  // 2. PDF Hochladen
  const pdfFilename = `Bautagebuch_${entry.date}_${safeTechName}_${timestamp.slice(11,19)}.pdf`;
  const pdfRes = await fetch(`${targetFolderUrl}/${pdfFilename}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/pdf' },
    body: pdfBlob
  });

  if (!pdfRes.ok) throw new Error(`PDF Upload fehlgeschlagen: ${pdfRes.status}`);

  // 3. Bilder Hochladen
  for (let i = 0; i < entry.images.length; i++) {
    const file = entry.images[i];
    const fileName = `Foto_${i + 1}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    await fetch(`${targetFolderUrl}/${fileName}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': file.type || 'image/jpeg' },
      body: file
    });
  }
};
