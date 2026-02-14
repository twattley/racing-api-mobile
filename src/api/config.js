// API Configuration
// Stores the base URL for API calls - configurable via Settings screen
import * as SecureStore from 'expo-secure-store';

const API_BASE_KEY = 'racing_api_base_url';
const DEFAULT_API_BASE = 'http://server:8010/racing-api/api/v2';  // Backend port from ~/.ports.yaml

let cachedApiBase = null;

export async function getApiBase() {
  if (cachedApiBase) return cachedApiBase;

  try {
    const stored = await SecureStore.getItemAsync(API_BASE_KEY);
    cachedApiBase = stored || DEFAULT_API_BASE;
    return cachedApiBase;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export async function setApiBase(url) {
  try {
    await SecureStore.setItemAsync(API_BASE_KEY, url);
    cachedApiBase = url;
    return true;
  } catch {
    return false;
  }
}

export function clearApiBaseCache() {
  cachedApiBase = null;
}

export const BASES = {
  feedback: '/feedback',
  today: '/today',
  betting: '/betting',
};

export function buildPath(base = 'feedback', segment = '') {
  const b = base?.startsWith('/') ? base : `/${base || ''}`;
  return `${b}${segment}`;
}
