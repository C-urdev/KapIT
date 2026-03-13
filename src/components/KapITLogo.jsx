import React, { useState } from 'react';
import fallbackLogo from '../assets/kapit-logo.svg';

const PRIMARY_LOGO_SRC = '/kapit-logo.png';

export default function KapITLogo({ className = '', alt = 'KapIT logo' }) {
  const [src, setSrc] = useState(PRIMARY_LOGO_SRC);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (src !== fallbackLogo) {
          setSrc(fallbackLogo);
        }
      }}
    />
  );
}
