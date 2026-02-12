
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
  const lightGray = [245, 245, 245];
  const borderGray = [220, 220, 220];
  const textDark = [30, 30, 30];

  // --- Helper: Footer ---
  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Seite ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Erstellt mit IT-KOM Bautagebuch-System | ${new Date().toLocaleString('de-DE')}`, margin, pageHeight - 10);
  };

  // --- Header Section ---
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
  doc.setFontSize(24);
  doc.text("BAUTAGEBUCH", margin, 25);
  
  doc.setFontSize(10);
  doc.text("IT-KOM Kommunikationstechnik GmbH", margin, 32);
  
  yPos = 45;
  doc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;

  // --- Information Grid (Table) ---
  const drawInfoRow = (label: string, value: string, y: number) => {
    doc.setFillColor(252, 252, 252);
    doc.rect(margin, y - 5, contentWidth, 8, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 3, pageWidth - margin, y + 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
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

  // --- Section: Beschreibung ---
  const drawSectionHeader = (title: string, color = brandBlue) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 2, yPos + 5);
    yPos += 10;
  };

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

  // --- Section: Material ---
  if (entry.materials.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; addFooter(doc.internal.pages.length - 1); }
    drawSectionHeader("Eingesetztes Material");
    
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 3, contentWidth, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("MATERIALBEZEICHNUNG", margin + 2, yPos + 2);
    doc.text("MENGE", pageWidth - margin - 30, yPos + 2, { align: "right" });
    yPos += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    entry.materials.forEach((m, i) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; addFooter(doc.internal.pages.length - 1); }
        if (i % 2 === 0) doc.setFillColor(252, 252, 252); else doc.setFillColor(255, 255, 255);
        doc.rect(margin, yPos - 3, contentWidth, 7, 'F');
        doc.text(m.name, margin + 2, yPos + 2);
        doc.text(m.amount, pageWidth - margin - 30, yPos + 2, { align: "right" });
        yPos += 7;
    });
    yPos += 5;
  }

  // --- Section: Fotos ---
  if (entry.images.length > 0) {
    doc.addPage();
    let pageNum = doc.internal.pages.length - 1;
    addFooter(pageNum);
    yPos = 25;
    
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("FOTODOKUMENTATION", margin + 2, yPos + 5.5);
    yPos += 15;

    const maxImgHeight = 110; // Deutlich größer für einspaltige Ansicht
    const headerHeight = 7;

    for (let i = 0; i < entry.images.length; i++) {
        // Prüfen, ob Bild + Header noch auf Seite passen
        if (yPos + maxImgHeight + headerHeight + 10 > 280) {
            doc.addPage();
            pageNum = doc.internal.pages.length - 1;
            addFooter(pageNum);
            yPos = 20;
        }

        try {
            const base64Img = await fileToBase64(entry.images[i]);
            const imgProps = doc.getImageProperties(base64Img);
            
            // Header-Zeile für das Bild
            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(220, 220, 220);
            doc.rect(margin, yPos, contentWidth, headerHeight, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`BILD ${i + 1}:`, margin + 2, yPos + 4.5);
            doc.setFont("helvetica", "normal");
            doc.text(entry.images[i].name, margin + 20, yPos + 4.5);
            yPos += headerHeight;

            // Calculate Aspect Ratio Fit für die volle Breite
            const ratio = imgProps.width / imgProps.height;
            let renderWidth = contentWidth;
            let renderHeight = renderWidth / ratio;

            // Wenn das Bild zu hoch wäre, begrenzen wir die Höhe
            if (renderHeight > maxImgHeight) {
                renderHeight = maxImgHeight;
                renderWidth = renderHeight * ratio;
            }

            // Rahmen für das Bild
            doc.setDrawColor(240, 240, 240);
            doc.setFillColor(252, 252, 252);
            doc.rect(margin, yPos, contentWidth, maxImgHeight, 'FD');

            // Zentriert einfügen
            const offsetX = (contentWidth - renderWidth) / 2;
            const offsetY = (maxImgHeight - renderHeight) / 2;

            doc.addImage(base64Img, 'JPEG', margin + offsetX, yPos + offsetY, renderWidth, renderHeight);
            
            yPos += maxImgHeight + 8; // Abstand zum nächsten Bild
        } catch (e) { 
            console.error("Image add failed", e);
            doc.setTextColor(255, 0, 0);
            doc.text("Bild konnte nicht geladen werden.", margin + 2, yPos + 5);
            yPos += 15;
        }
    }
  }

  // Final Footer for Page 1
  addFooter(1);

  return doc.output('blob');
};
