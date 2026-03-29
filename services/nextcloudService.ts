
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
    const errorData = await response.json();
    const errorMsg = errorData.details 
      ? `${errorData.error}: ${errorData.details}` 
      : (errorData.error || `Upload fehlgeschlagen: ${response.status}`);
    throw new Error(errorMsg);
  }
};
