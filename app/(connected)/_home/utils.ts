import { colors } from '../../../src/design/tokens';
import type { SessionRecord } from '../../../src/db/sessions';

// ─── Heat-level color ─────────────────────────────────────────────────────────

export function peakTempColor(peakF: number): string {
  if (peakF >= 540) return colors.emberBright;
  if (peakF >= 500) return colors.ember;
  if (peakF >= 460) return colors.emberMid;
  return colors.quartzBright;
}

// ─── Session card formatters (module scope — no re-creation per render) ───────

export function formatDuration(s: SessionRecord): string {
  if (!s.endedAt) return '–';
  const sec = Math.round((s.endedAt - s.startedAt) / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
