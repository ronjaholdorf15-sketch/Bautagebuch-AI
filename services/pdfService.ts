
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

export const generateDiaryPdf = async (entry: DiaryEntry, projectName: string, companyLogo?: string): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // --- Header ---
  // IT-KOM Brand Dark Blue: #1B3E78
  // We use a white background for header with Logo on right and Title on left in Blue.
  
  // Title
  doc.setTextColor(27, 62, 120); // Brand Blue
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Bautagebuch", margin, 30);
  
  doc.setFontSize(14);
  doc.text("IT-KOM Kommunikationstechnik GmbH", margin, 38);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generiert am: ${new Date().toLocaleString()}`, margin, 45);

  // Logo (Top Right)
  if (companyLogo) {
      try {
        const logoProps = doc.getImageProperties(companyLogo);
        const logoWidth = 50;
        const logoHeight = (logoProps.height * logoWidth) / logoProps.width;
        doc.addImage(companyLogo, 'JPEG', pageWidth - margin - logoWidth, 15, logoWidth, logoHeight);
      } catch (e) {
          console.error("Failed to add logo to PDF", e);
      }
  }

  yPos = 65;
  doc.setTextColor(0, 0, 0);

  // --- Project Info Table ---
  const drawRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 50, yPos);
    yPos += 7;
  };

  doc.setFontSize(11);
  drawRow("Projekt:", projectName);
  drawRow("Datum:", entry.date);
  drawRow("Techniker:", entry.technician);
  drawRow("Adresse der Baustelle:", entry.location); // Updated Label
  drawRow("Wetter:", entry.weather);
  drawRow("Tätigkeit:", entry.activityType);

  yPos += 10;

  // --- Section: Was wurde erledigt ---
  const addSectionHeader = (title: string, color: [number, number, number] = [27, 62, 120]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(title, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
  };

  addSectionHeader("Was wurde erledigt");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  const splitDescription = doc.splitTextToSize(entry.description, pageWidth - (margin * 2));
  doc.text(splitDescription, margin, yPos);
  yPos += (splitDescription.length * 5) + 5;

  // --- Section: Was fehlt noch ---
  if (entry.missingWork && entry.missingWork.trim() !== "") {
      if (yPos > 240) { doc.addPage(); yPos = 20; } // Page break check
      addSectionHeader("Was fehlt noch / Offene Punkte", [200, 100, 0]); // Orange/Brownish hint
      const splitMissing = doc.splitTextToSize(entry.missingWork, pageWidth - (margin * 2));
      doc.text(splitMissing, margin, yPos);
      yPos += (splitMissing.length * 5) + 5;
  }

  // --- Section: Materialliste ---
  if (entry.materials && entry.materials.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; } // Page break check
      addSectionHeader("Materialliste");
      
      // Table Header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Material", margin + 2, yPos);
      doc.text("Menge", pageWidth - margin - 40, yPos);
      yPos += 8;

      // Items
      doc.setFont("helvetica", "normal");
      entry.materials.forEach((item, index) => {
          if (yPos > 280) { doc.addPage(); yPos = 20; }
          
          doc.text(item.name, margin + 2, yPos);
          doc.text(item.amount, pageWidth - margin - 40, yPos);
          
          // Gray line below item
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
          
          yPos += 7;
      });
      yPos += 5;
  }

  // --- Section: Images ---
  if (entry.images.length > 0) {
    doc.addPage();
    yPos = 20;
    
    addSectionHeader("Fotodokumentation");

    for (let i = 0; i < entry.images.length; i++) {
      const file = entry.images[i];
      try {
        const base64Img = await fileToBase64(file);
        const imgProps = doc.getImageProperties(base64Img);
        
        // Calculate dimensions to fit page width (minus margins) or max height
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = 110; // Allow 2 images per page roughly
        
        let imgWidth = maxWidth;
        let imgHeight = (imgProps.height * maxWidth) / imgProps.width;

        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (imgProps.width * maxHeight) / imgProps.height;
        }

        // Check if new page is needed
        if (yPos + imgHeight > 280) {
            doc.addPage();
            yPos = 20;
        }

        doc.addImage(base64Img, 'JPEG', margin, yPos, imgWidth, imgHeight);
        
        yPos += imgHeight + 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`Bild ${i + 1}: ${file.name}`, margin, yPos);
        yPos += 15;

      } catch (e) {
        console.error(`Could not add image ${file.name} to PDF`, e);
      }
    }
  }

  return doc.output('blob');
};
