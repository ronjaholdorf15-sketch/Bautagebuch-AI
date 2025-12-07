import React from 'react';

interface LogoProps {
  className?: string;
  src?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-16", src }) => {
  if (src) {
    return <img src={src} alt="Company Logo" className={className} />;
  }

  return (
    <svg viewBox="0 0 600 160" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* Background for easier reading if needed, currently transparent */}
      
      {/* --- Swooshes (Glasfaser Lines) --- */}
      {/* Top Swoosh - Cyan */}
      <path 
        d="M 40 40 Q 180 10 350 30" 
        fill="none" 
        stroke="#3ABBCB" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      <circle cx="280" cy="24" r="6" fill="#3ABBCB" />
      <circle cx="350" cy="30" r="4" fill="#3ABBCB" />

      {/* Middle Swoosh - Medium Blue */}
      <path 
        d="M 30 70 Q 200 40 450 60" 
        fill="none" 
        stroke="#2563eb" 
        strokeWidth="7" 
        strokeLinecap="round"
      />
      <circle cx="220" cy="50" r="9" fill="#2563eb" />
      <circle cx="350" cy="53" r="7" fill="#2563eb" />

      {/* Bottom Swoosh - Dark Blue (Brand) */}
      <path 
        d="M 20 110 Q 220 80 500 40" 
        fill="none" 
        stroke="#1B3E78" 
        strokeWidth="8" 
        strokeLinecap="round"
      />
      <circle cx="300" cy="85" r="12" fill="#1B3E78" />
      <circle cx="420" cy="55" r="7" fill="#1B3E78" />

      {/* --- Text Content --- */}
      
      {/* Main Company Name */}
      <text x="260" y="135" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontStyle="italic" fontSize="85" fill="#1B3E78">
        IT-KOM
      </text>
      
      {/* Dash */}
      <rect x="345" y="105" width="25" height="10" fill="#1B3E78" />

      {/* Slogans (Top Right) */}
      <g transform="translate(420, 30)" fontFamily="Arial, Helvetica, sans-serif" fontStyle="italic" textAnchor="end">
        <text x="170" y="0" fontSize="18" fill="#3ABBCB" fontWeight="bold">Glasfaser</text>
        <text x="170" y="22" fontSize="18" fill="#2563eb" fontWeight="bold">Schnelligkeit</text>
        <text x="170" y="44" fontSize="18" fill="#1B3E78" fontWeight="bold">Zuverlässigkeit</text>
      </g>

      {/* Subline (Bottom) */}
      <text x="10" y="158" fontFamily="Arial, Helvetica, sans-serif" fontStyle="italic" fontSize="18" fill="#1B3E78" letterSpacing="3">
        TELEKOMMUNIKATIONSTECHNIK GMBH
      </text>
    </svg>
  );
};