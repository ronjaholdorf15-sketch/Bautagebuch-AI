
import React from 'react';

const HARDCODED_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 240" width="1050" height="240" preserveAspectRatio="xMidYMid meet" style="height: 100%; width: auto;">
  <defs>
    <style>
      .font-brand { font-family: 'Arial Black', Arial, sans-serif; font-weight: 900; font-style: italic; }
      .font-sub { font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-style: italic; }
    </style>
  </defs>

  <!-- === GRAFIK: SCHWÜNGE === -->
  <g transform="translate(10, 0)">
    <!-- Schwung 1 (Oben - Cyan) -->
    <path d="M 40 45 C 180 15, 380 35, 520 38 L 520 40 C 380 38, 180 20, 40 52 Z" fill="#29B6D1" />
    <circle cx="360" cy="35" r="5" fill="#29B6D1" />
    <circle cx="450" cy="38" r="3" fill="#29B6D1" />
    <circle cx="520" cy="39" r="2" fill="#29B6D1" />

    <!-- Schwung 2 (Mitte - Mittelblau) -->
    <path d="M 30 95 C 200 55, 450 70, 600 70 L 600 73 C 450 74, 200 60, 30 105 Z" fill="#1D71B8" />
    <circle cx="430" cy="73" r="11" fill="#1D71B8" />
    <circle cx="530" cy="71" r="6" fill="#1D71B8" />
    <circle cx="600" cy="71" r="3" fill="#1D71B8" />

    <!-- Schwung 3 (Unten - Dunkelblau) -->
    <path d="M 20 150 C 220 100, 500 110, 720 100 L 720 103 C 500 114, 220 108, 20 162 Z" fill="#133368" />
    <circle cx="515" cy="113" r="14" fill="#133368" /> 
    <circle cx="630" cy="106" r="7" fill="#133368" />
    <circle cx="720" cy="101" r="3" fill="#133368" />
  </g>

  <!-- === TEXT: SCHLAGWORTE (Rechts Oben) === -->
  <g transform="translate(140, 0)">
    <text x="890" y="55" class="font-sub" font-size="30" fill="#29B6D1" text-anchor="end">Glasfaser</text>
    <text x="890" y="92" class="font-sub" font-size="30" fill="#1D71B8" text-anchor="end">Schnelligkeit</text>
    <text x="890" y="128" class="font-sub" font-size="30" fill="#133368" text-anchor="end">Zuverlässigkeit</text>
  </g>

  <!-- === TEXT: HAUPTSCHRIFTZUG (Zentrierter/Breiter) === -->
  <g transform="translate(40, 0)">
    <!-- IT -->
    <text x="480" y="195" class="font-brand" font-size="125" fill="#133368" text-anchor="end">IT</text>
    
    <!-- Bindestrich -->
    <rect x="520" y="155" width="60" height="18" fill="#133368" />
    
    <!-- KOM -->
    <text x="610" y="195" class="font-brand" font-size="125" fill="#133368">KOM</text>
  </g>

  <!-- === UNTERZEILE === -->
  <text x="25" y="235" class="font-brand" font-size="26" fill="#133368" letter-spacing="9.5">TELEKOMMUNIKATIONSTECHNIK GMBH</text>
</svg>
`;

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-16" }) => {
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: HARDCODED_LOGO_SVG.replace('<svg', '<svg style="height: 100%; width: auto;" ') }} 
    />
  );
};

export const getLogoAsBase64 = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            const svgBlob = new Blob([HARDCODED_LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
            const src = URL.createObjectURL(svgBlob);
            img.onload = () => {
                const targetWidth = 2000;
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = (240 / 1050) * targetWidth;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Canvas failed"));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
                URL.revokeObjectURL(src);
            };
            img.onerror = () => reject(new Error("Image failed"));
            img.src = src;
        } catch (e) { reject(e); }
    });
};
