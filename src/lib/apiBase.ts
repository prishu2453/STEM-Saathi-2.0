/**
 * Where the Gyaan Graph API server lives.
 * - Local dev / Render: the website and API share one address, so this is '' (relative /api/... paths).
 * - GitHub Pages: the website is static, so it is built with VITE_API_BASE=https://<your-server>.onrender.com
 * API keys always stay on the server; the website only ever calls these endpoints.
 */
const RAW = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
export const API_BASE = RAW.replace(/\/+$/, '');
export const apiUrl = (path: string) => `${API_BASE}${path}`;
