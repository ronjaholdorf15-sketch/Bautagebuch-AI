
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

  const drawSectionHeader = (title: string, y: number, color = brandBlue) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 2, y + 5);
    return y + 10;
  };

  // --- Description ---
  yPos = drawSectionHeader("Erledigte Arbeiten / Dokumentation", yPos);
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
    yPos = drawSectionHeader("Eingesetztes Material", yPos);
    
    entry.materials.forEach((m) => {
        if (yPos > 275) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`• ${m.name}`, margin + 2, yPos);
        doc.text(m.amount, pageWidth - margin - 5, yPos, { align: "right" });
        yPos += 6;
    });
    yPos += 10;
  }

  // --- Photos Section (Grid 2x4) ---
  if (entry.images.length > 0) {
    // Start images on a clean page for the grid
    doc.addPage();
    yPos = 20;
    yPos = drawSectionHeader("Fotodokumentation", yPos);
    yPos += 5;

    const cols = 2;
    const horizontalGap = 8;
    const verticalGap = 8;
    const imgWidth = (contentWidth - horizontalGap) / cols;
    const imgHeight = 52; // Fixe Höhe für das Grid-Element (ca. 4 Reihen passen)
    const labelHeight = 6;
    const blockHeight = imgHeight + labelHeight;

    for (let i = 0; i < entry.images.length; i++) {
        // Berechne Index auf aktueller Seite (0-7)
        const imageIndexOnPage = i % 8;
        
        // Wenn 8 Bilder erreicht sind, neue Seite (außer bei dem allerletzten Bild)
        if (i > 0 && imageIndexOnPage === 0) {
            doc.addPage();
            yPos = 20;
            yPos = drawSectionHeader("Fotodokumentation (Fortsetzung)", yPos);
            yPos += 5;
        }

        const col = imageIndexOnPage % cols;
        const row = Math.floor(imageIndexOnPage / cols);
        
        const x = margin + (col * (imgWidth + horizontalGap));
        const y = yPos + (row * (blockHeight + verticalGap));

        try {
            const base64Img = await fileToBase64(entry.images[i]);
            const imgProps = doc.getImageProperties(base64Img);
            
            // Header für das Bild (Index & Dateiname)
            doc.setFillColor(248, 248, 248);
            doc.setDrawColor(220, 220, 220);
            doc.rect(x, y, imgWidth, labelHeight, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            const fileName = entry.images[i].name.length > 25 ? entry.images[i].name.substring(0, 22) + "..." : entry.images[i].name;
            doc.text(`${i + 1}: ${fileName}`, x + 2, y + 4.5);

            // Bild skalieren und zentrieren innerhalb des Grid-Feldes
            const ratio = imgProps.width / imgProps.height;
            let renderWidth = imgWidth;
            let renderHeight = renderWidth / ratio;

            if (renderHeight > imgHeight) {
                renderHeight = imgHeight;
                renderWidth = renderHeight * ratio;
            }

            const offsetX = (imgWidth - renderWidth) / 2;
            const offsetY = (imgHeight - renderHeight) / 2;

            // Rahmen um den Bildbereich
            doc.setDrawColor(240, 240, 240);
            doc.rect(x, y + labelHeight, imgWidth, imgHeight);

            doc.addImage(
                base64Img, 
                'JPEG', 
                x + offsetX, 
                y + labelHeight + offsetY, 
                renderWidth, 
                renderHeight
            );

        } catch (e) {
            console.error("PDF Image Error:", e);
            doc.setFontSize(8);
            doc.setTextColor(200, 0, 0);
            doc.text(`[Fehler Bild ${i+1}]`, x + 5, y + labelHeight + 10);
        }
    }
  }

  // --- Globaler Footer Pass ---
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.text(`Projekt: ${projectName} | Datum: ${entry.date}`, margin, pageHeight - 10);
    doc.text("IT-KOM Bautagebuch-System", pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  return doc.output('blob');
};
