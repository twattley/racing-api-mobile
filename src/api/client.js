// API Client for React Native
import { getApiBase } from './config';

export async function api(url, options = {}) {
  const apiBase = await getApiBase();

  // Build absolute URL
  const absoluteUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

  try {
    const res = await fetch(absoluteUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return res.text();
  } catch (error) {
    // Add more context for network errors
    if (error.message.includes('Network request failed')) {
      throw new Error('Network error - check your API URL and Tailscale connection');
    }
    throw error;
  }
}
