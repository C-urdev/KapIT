import { useEffect, useState } from 'react';

export default function useViewportMode() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateMode = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMode);
      return () => mediaQuery.removeEventListener('change', updateMode);
    }

    mediaQuery.addListener(updateMode);
    return () => mediaQuery.removeListener(updateMode);
  }, []);

  return isDesktop;
}
