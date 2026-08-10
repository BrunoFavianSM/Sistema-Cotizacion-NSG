import { useEffect, useRef } from 'react';

/**
 * Widget de Cloudflare Turnstile (captcha).
 * Si VITE_TURNSTILE_SITE_KEY no está configurada, NO renderiza nada (modo dev);
 * el backend también omite la verificación en ese caso.
 *
 * @param {(token: string|null) => void} onToken - callback con el token resuelto.
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function cargarScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if (window.turnstile) return resolve();
    const existente = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existente) {
      existente.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function TurnstileWidget({ onToken }) {
  const contenedorRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelado = false;

    cargarScript().then(() => {
      if (cancelado || !contenedorRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(contenedorRef.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (token) => onTokenRef.current?.(token),
        'expired-callback': () => onTokenRef.current?.(null),
        'error-callback': () => onTokenRef.current?.(null),
      });
    });

    return () => {
      cancelado = true;
      try {
        if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* no-op */
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={contenedorRef} className="my-2" aria-label="Verificación anti-bots" />;
}
