import { router } from 'expo-router';

/**
 * Parses a `quartzos://intent/...` deep link and dispatches it to the right
 * route. Returns `true` when the URL was recognised and handled, `false`
 * otherwise (let the caller decide whether to log).
 *
 * URL grammar:
 *   quartzos://intent/start-session?presetId=<id>
 *   quartzos://intent/open?screen=settings
 *
 * History/presets routes were removed when the app reduced to the molten
 * surface; only start-session and the hidden settings deep-link remain.
 */
export function handleIntentUrl(rawUrl: string): boolean {
  // Hermes' URL implementation has historically been quirky with custom
  // schemes (some versions return `host=""` and stuff the host into the
  // pathname). We try WHATWG URL first and fall back to a regex.
  let action: string;
  let queryString: string;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'quartzos:') return false;
    if (parsed.host === 'intent') {
      action = parsed.pathname.replace(/^\/+/, '');
      queryString = parsed.search;
    } else {
      // Fallback: regex parse for Hermes versions that leave host empty.
      const match = rawUrl.match(/^quartzos:\/\/intent\/([^?]+)(\?.*)?$/);
      if (!match) return false;
      action = match[1];
      queryString = match[2] ?? '';
    }
  } catch {
    return false;
  }

  const params = new URLSearchParams(queryString);

  if (action === 'start-session') {
    const presetId = params.get('presetId');
    if (!presetId) return false;
    router.push({
      pathname: '/(connected)/home',
      params: { applyPreset: presetId },
    });
    return true;
  }

  if (action === 'open') {
    const screen = params.get('screen');
    if (screen === 'settings') {
      router.push('/(connected)/settings');
      return true;
    }
    return false;
  }

  return false;
}
