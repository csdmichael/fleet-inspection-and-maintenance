declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

/** Empty until the deploy pipeline substitutes the placeholder; dev uses the proxy. */
export function apiBaseUrl(): string {
  const configured = window.__API_BASE_URL__ ?? '';
  return configured.startsWith('__') ? '' : configured.replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}
