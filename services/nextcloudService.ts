
import { DiaryEntry, PublicProject } from '../types';

export const uploadDiaryEntry = async (
    project: PublicProject, 
    entry: DiaryEntry, 
    pdfBlob: Blob
): Promise<void> => {
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTechName = entry.technician.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
  const folderName = `${entry.date}_${safeTechName}`;
  const pdfFilename = `Bautagebuch_${entry.date}_${safeTechName}_${timestamp.slice(11,19)}.pdf`;

  const formData = new FormData();
  formData.append('projectLink', project.link);
  formData.append('projectToken', project.token);
  formData.append('folderName', folderName);
  formData.append('pdfFilename', pdfFilename);
  formData.append('pdf', pdfBlob, pdfFilename);

  // Bilder hinzufügen
  for (let i = 0; i < entry.images.length; i++) {
    const file = entry.images[i];
    const fileName = `Foto_${i + 1}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    formData.append('images', file, fileName);
  }

  const response = await fetch('/api/nextcloud/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let errorMsg = `Upload fehlgeschlagen: ${response.status}`;
    const responseText = await response.text();
    try {
      const errorData = JSON.parse(responseText);
      errorMsg = errorData.details 
        ? `${errorData.error}: ${errorData.details}` 
        : (errorData.error || errorMsg);
    } catch (e) {
      // Fallback if response is not JSON
      if (responseText && responseText.length < 200) errorMsg = responseText;
    }
    throw new Error(errorMsg);
  }
};

export const testConnection = async (project: PublicProject) => {
  const formData = new FormData();
  formData.append('projectLink', project.link);
  formData.append('projectToken', project.token);
  formData.append('test', 'true');

  const response = await fetch('/api/nextcloud/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    let errorMsg = "Verbindung fehlgeschlagen";
    const responseText = await response.text();
    try {
      const errorData = JSON.parse(responseText);
      errorMsg = errorData.details || errorData.error || errorMsg;
    } catch (e) {
      if (responseText && responseText.length < 200) errorMsg = responseText;
    }
    throw new Error(errorMsg);
  }
  return true;
};
