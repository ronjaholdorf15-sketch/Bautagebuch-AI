import React from 'react';

// Das Standard IT-KOM Logo als Fallback
const DEFAULT_LOGO_XML = `
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
  customLogo?: string | null;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-16", customLogo }) => {
  // Wenn ein Custom Logo existiert (Base64 String), nutzen wir ein normales IMG Tag.
  // Das funktioniert für PNG, JPG, GIF und SVG (als Data URL).
  if (customLogo) {
      return (
          <img 
            src={customLogo} 
            alt="Firmenlogo" 
            className={className}
            style={{ objectFit: 'contain' }}
          />
      );
  }

  // Fallback: Das Standard-SVG rendern wir inline
  let finalSvg = DEFAULT_LOGO_XML;
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

// Hilfsfunktion: Gibt den Base64 String als PNG zurück für das PDF
export const getLogoAsBase64 = async (customLogo?: string | null): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            
            // Wenn Custom Logo vorhanden ist, laden wir es (es ist bereits eine Data URL)
            // Wenn nicht, erstellen wir einen Blob aus dem Standard-SVG
            let src = customLogo;
            let revokeUrl = false;

            if (!src) {
                const svgBlob = new Blob([DEFAULT_LOGO_XML], { type: 'image/svg+xml;charset=utf-8' });
                src = URL.createObjectURL(svgBlob);
                revokeUrl = true;
            }

            img.onload = () => {
                // Wir rendern alles auf ein Canvas, um ein sauberes PNG zu erhalten
                // (Wichtig, falls das Quellmaterial SVG ist, da jsPDF SVGs nicht nativ als Bild einfügen kann)
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
                    if (revokeUrl && src) URL.revokeObjectURL(src);
                    return reject(new Error("Canvas context failed"));
                }
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                
                if (revokeUrl && src) URL.revokeObjectURL(src);
                resolve(dataUrl);
            };
            
            img.onerror = () => {
                if (revokeUrl && src) URL.revokeObjectURL(src);
                reject(new Error("Image load failed"));
            };
            
            img.src = src!;
        } catch (e) {
            reject(e);
        }
    });
};