import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';

const AccessibilityContext = createContext(null);

function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();

    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [query]);

  return matches;
}

export function AccessibilityProvider({ children }) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: more)');
  const forcedColors = useMediaQuery('(forced-colors: active)');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-reduced-motion', prefersReducedMotion ? 'reduce' : 'no-preference');
    root.setAttribute('data-contrast', prefersHighContrast || forcedColors ? 'more' : 'normal');
  }, [forcedColors, prefersHighContrast, prefersReducedMotion]);

  const value = useMemo(
    () => ({
      prefersReducedMotion,
      prefersHighContrast: prefersHighContrast || forcedColors,
      forcedColors,
    }),
    [forcedColors, prefersHighContrast, prefersReducedMotion]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }
  return context;
}
