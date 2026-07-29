"use client";

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = { action: 'register' | 'player_login' | 'admin_login'; onToken: (token: string) => void };

export default function Turnstile({ action, onToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const id = useId();
  const [siteKey, setSiteKey] = useState('');
  const [required, setRequired] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    fetch('/api/captcha/config').then(async response => {
      if (!response.ok) throw new Error('Configuração indisponível');
      const config = await response.json();
      setRequired(config.required === true);
      setSiteKey(typeof config.siteKey === 'string' ? config.siteKey : '');
    }).catch(() => setRequired(true));
  }, []);

  useEffect(() => {
    if (!scriptReady || !siteKey || !container.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action,
      theme: 'dark',
      size: 'flexible',
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    });
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = undefined;
    };
  }, [action, onToken, scriptReady, siteKey]);

  if (!required && !siteKey) return null;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
    <div id={`turnstile-${id}`} ref={container} className="min-h-16" aria-label="Verificação de segurança Cloudflare" />
    {required && !siteKey && <p className="text-sm text-amber-300">Verificação de segurança temporariamente indisponível.</p>}
  </>;
}
