
import React from 'react';

// HIER KÖNNEN SIE DAS FESTE LOGO DEFINIEREN.
// Option A: Das bestehende SVG (Vektor-Grafik) beibehalten (wie unten).
// Option B: Wenn Sie ein Bild (PNG/JPG) nutzen wollen, ersetzen Sie den Inhalt von DEFAULT_LOGO_XML 
// durch einen leeren String und ändern die Logo-Komponente, um ein <img> Tag mit src="/logo.png" zurückzugeben.

const HARDCODED_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" width="600" height="160" preserveAspectRatio="xMidYMid meet" style="height: 100%; width: auto;">
  <path d="M 40 40 Q 180 10 350 30" fill="none" stroke="#3ABBCB" stroke-width="6" stroke-linecap="round" />
  <circle cx="280" cy="24" r="6" fill="#3ABBCB" />
  <circle cx="350" cy="30" r="4" fill="#3ABBCB" />

  <path d="M 30 70 Q 200 40 450 60" fill="none" stroke="#2563eb" stroke-width="7" stroke-linecap="round" />
  <circle cx="220" cy="50" r="9" fill="#2563eb" />
  <circle cx="350" cy="53" r="7" fill="#2563eb" />

  <path d="M 20 110 Q 220 80 500 40" fill="none" stroke="#1B3E78" stroke-width="8" stroke-linecap="round" />
  <circle cx="300" cy="85" r="12" fill="#1B3E78" />
  <circle cx="420" cy="55" r="7" fill="#1B3E78" />

  <text x="260" y="135" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-style="italic" font-size="85" fill="#1B3E78">IT-KOM</text>
  <rect x="345" y="105" width="25" height="10" fill="#1B3E78" />

  <g transform="translate(420, 30)" font-family="Arial, Helvetica, sans-serif" font-style="italic" text-anchor="end">
    <text x="170" y="0" font-size="18" fill="#3ABBCB" font-weight="bold">Glasfaser</text>
    <text x="170" y="22" font-size="18" fill="#2563eb" font-weight="bold">Schnelligkeit</text>
    <text x="170" y="44" font-size="18" fill="#1B3E78" font-weight="bold">Zuverlässigkeit</text>
  </g>

  <text x="10" y="158" font-family="Arial, Helvetica, sans-serif" font-style="italic" font-size="18" fill="#1B3E78" letter-spacing="3">TELEKOMMUNIKATIONSTECHNIK GMBH</text>
</svg>
`;

interface LogoProps {
  className?: string;
  // customLogo prop entfernt, da nicht mehr benötigt
}

export const Logo: React.FC<LogoProps> = ({ className = "h-16" }) => {
  // Option B Implementierung (Beispiel):
  // return <img src="/mein-festes-logo.png" className={className} alt="Logo" style={{ objectFit: 'contain' }} />;
  
  // Aktuelle Implementierung (SVG):
  let finalSvg = HARDCODED_LOGO_SVG;
  // Style Injection für korrekte Darstellung
  if (!finalSvg.includes('height: 100%') && !finalSvg.includes('height:100%')) {
      finalSvg = finalSvg.replace('<svg', '<svg style="height: 100%; width: auto;" ');
  }

  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: finalSvg }} 
    />
  );
};

// Hilfsfunktion: Gibt das feste Logo als PNG Base64 zurück für das PDF
export const getLogoAsBase64 = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            // Wir laden immer das feste SVG
            // (Wenn Sie Option B nutzen, setzen Sie hier src = "/mein-festes-logo.png")
            const svgBlob = new Blob([HARDCODED_LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
            const src = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                const targetWidth = 1200; // Hohe Auflösung für Druck
                let targetHeight = 320; 

                if (img.width > 0 && img.height > 0) {
                    targetHeight = (img.height / img.width) * targetWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(src);
                    return reject(new Error("Canvas context failed"));
                }
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                
                URL.revokeObjectURL(src);
                resolve(dataUrl);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(src);
                reject(new Error("Image load failed"));
            };
            
            img.src = src;
        } catch (e) {
            reject(e);
        }
    });
};
