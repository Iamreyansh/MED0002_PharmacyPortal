import { useEffect, useState } from 'react';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export function viewportFromWidth(width: number): ViewportMode {
  if (width < 768) {
    return 'mobile';
  }
  if (width < 1024) {
    return 'tablet';
  }
  return 'desktop';
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState(() => viewportFromWidth(window.innerWidth));

  useEffect(() => {
    const onResize = () => {
      setMode(viewportFromWidth(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return mode;
}
