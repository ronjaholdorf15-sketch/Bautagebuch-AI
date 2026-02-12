
import { jsPDF } from "jspdf";
import { DiaryEntry } from "../types";

// Helper to convert File to Base64 for PDF embedding
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const generateDiaryPdf = async (
    entry: DiaryEntry, 
    projectName: string, 
    companyLogo?: string
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Colors
  const brandBlue = [27, 62, 120]; // #1B3E78
  const textDark = [30, 30, 30];
  const borderGray = [220, 220, 220];

  // --- Header Section (Page 1) ---
  if (companyLogo) {
    try {
      const logoProps = doc.getImageProperties(companyLogo);
      const logoWidth = 55;
      const logoHeight = (logoProps.height * logoWidth) / logoProps.width;
      doc.addImage(companyLogo, pageWidth - margin - logoWidth, 15, logoWidth, logoHeight);
    } catch (e) { console.error("Logo failed", e); }
  }

  doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("BAUTAGEBUCH", margin, 25);
  
  doc.setFontSize(10);
  doc.text("IT-KOM Kommunikationstechnik GmbH", margin, 32);
  
  yPos = 45;
  doc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;

  // --- Information Grid ---
  const drawInfoRow = (label: string, value: string, y: number) => {
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, y - 5, contentWidth, 8, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + 2, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(value || "-", margin + 55, y);
    return y + 8;
  };

  yPos = drawInfoRow("PROJEKT / BAUVORHABEN:", projectName, yPos);
  yPos = drawInfoRow("DATUM:", entry.date, yPos);
  yPos = drawInfoRow("STANDORT / ADRESSE:", entry.location, yPos);
  yPos = drawInfoRow("TECHNIKER:", entry.technician, yPos);
  yPos = drawInfoRow("WETTERLAGE:", entry.weather, yPos);
  yPos = drawInfoRow("HAUPTTÄTIGKEIT:", entry.activityType, yPos);

  yPos += 10;

  // --- Section Helper ---
  const drawSectionHeader = (title: string, color = brandBlue) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 2, yPos + 5);
    yPos += 10;
  };

  // --- Description ---
  drawSectionHeader("Erledigte Arbeiten / Dokumentation");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  const splitDesc = doc.splitTextToSize(entry.description, contentWidth - 4);
  const descHeight = (splitDesc.length * 5) + 5;
  
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.1);
  doc.rect(margin, yPos - 3, contentWidth, descHeight);
  doc.text(splitDesc, margin + 2, yPos + 2);
  yPos += descHeight + 10;

  // --- Material ---
  if (entry.materials.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    drawSectionHeader("Eingesetztes Material");
    
    entry.materials.forEach((m, i) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`• ${m.name}`, margin + 2, yPos);
        doc.text(m.amount, pageWidth - margin - 5, yPos, { align: "right" });
        yPos += 6;
    });
    yPos += 10;
  }

  // --- Photos Section ---
  if (entry.images.length > 0) {
    // Start images on a clean page if current page is already well-filled
    if (yPos > 50) {
      doc.addPage();
      yPos = 20;
    }
    
    drawSectionHeader("Fotodokumentation");
    yPos += 5;

    const maxImgHeight = 110; // Max allowed height per image to fit at least 2 per page if possible
    const headerHeight = 8;
    const bottomGap = 15; // Gap between image blocks

    for (let i = 0; i < entry.images.length; i++) {
        try {
            const base64Img = await fileToBase64(entry.images[i]);
            const imgProps = doc.getImageProperties(base64Img);
            
            // Calculate scaled dimensions
            const ratio = imgProps.width / imgProps.height;
            let renderWidth = contentWidth;
            let renderHeight = renderWidth / ratio;

            // Constrain height if image is too tall
            if (renderHeight > maxImgHeight) {
                renderHeight = maxImgHeight;
                renderWidth = renderHeight * ratio;
            }

            // CHECK: Does header + image + spacing fit on current page?
            // Page limit is 275 to leave space for the global footer
            if (yPos + headerHeight + renderHeight + bottomGap > 275) {
                doc.addPage();
                yPos = 20;
                // Re-draw section header on new page if it's the start of images
                doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(255, 255, 255);
                doc.text(`FOTODOKUMENTATION (FORTSETZUNG)`, margin + 2, yPos + 5);
                yPos += 15;
            }

            // 1. Draw Image Header (Grey bar with filename)
            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.rect(margin, yPos, contentWidth, headerHeight, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`BILD ${i + 1}: ${entry.images[i].name}`, margin + 3, yPos + 5.5);
            yPos += headerHeight;

            // 2. Center and Draw Image
            const offsetX = (contentWidth - renderWidth) / 2;
            
            // Add subtle border around image
            doc.setDrawColor(230, 230, 230);
            doc.rect(margin, yPos, contentWidth, renderHeight);
            
            doc.addImage(base64Img, 'JPEG', margin + offsetX, yPos, renderWidth, renderHeight);
            
            // 3. Move cursor down for next image
            yPos += renderHeight + bottomGap; 

        } catch (e) { 
            console.error("Image processing error for image index:", i, e);
            // Fallback: draw error box instead of skipping entirely to keep numbering intact
            doc.setDrawColor(255, 0, 0);
            doc.rect(margin, yPos, contentWidth, 20);
            doc.setTextColor(255, 0, 0);
            doc.setFontSize(10);
            doc.text(`Fehler: Bild ${entry.images[i].name} konnte nicht geladen werden.`, margin + 5, yPos + 12);
            yPos += 30;
        }
    }
  }

  // --- Global Footer Pass (Executed on ALL generated pages) ---
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Line above footer
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Left: Project Info
    doc.text(`Projekt: ${projectName} | Datum: ${entry.date}`, margin, pageHeight - 10);
    
    // Center: Identity
    doc.text("IT-KOM Bautagebuch-System", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Right: Page Numbers
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  return doc.output('blob');
};
