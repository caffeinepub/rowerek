export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getNext14DateKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    keys.push(formatLocalDate(d));
  }
  return keys;
}

const POLISH_DAYS = ["nd.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."];

export function getPolishDayName(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return POLISH_DAYS[d.getDay()];
}

export function getDayNumber(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00`).getDate();
}

export function isWeekend(dateKey: string): boolean {
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

export function isToday(dateKey: string): boolean {
  return formatLocalDate(new Date()) === dateKey;
}

const PASTEL_COLORS: string[] = [
  "#6eaed1",
  "#6dbf8e",
  "#a07bc0",
  "#d47a8a",
  "#c9a05c",
  "#5aa3b8",
  "#7ab87a",
  "#b07ab0",
  "#c87070",
  "#7090c8",
];

export function getUsernameColor(username: string): string {
  let hash = 0;
  for (const c of username)
    hash = (hash * 31 + c.charCodeAt(0)) % PASTEL_COLORS.length;
  return PASTEL_COLORS[Math.abs(hash)];
}

export const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 6; h <= 21; h++) {
    opts.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) opts.push(`${String(h).padStart(2, "0")}:30`);
  }
  return opts;
})();

export const EMOJI_OPTIONS = [
  "🚴",
  "🏃",
  "☀️",
  "🌧️",
  "🌤️",
  "⛅",
  "🌈",
  "🏔️",
  "🌊",
  "🌿",
  "🍃",
  "🐦",
  "🌸",
  "🌻",
  "⚡",
  "🌙",
  "💪",
  "🏁",
  "🎯",
  "🎉",
];

const EMOJI_USAGE_KEY = "rowerek_emoji_usage";
const DEFAULT_QUICK_EMOJIS = ["🚴", "🏃", "☀️", "🌧️"];

export function getQuickEmojis(): string[] {
  try {
    const raw = localStorage.getItem(EMOJI_USAGE_KEY);
    if (!raw) return DEFAULT_QUICK_EMOJIS;
    const usage: Record<string, number> = JSON.parse(raw);
    const sorted = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([emoji]) => emoji);
    // fill up to 4 with defaults if needed
    for (const e of DEFAULT_QUICK_EMOJIS) {
      if (sorted.length >= 4) break;
      if (!sorted.includes(e)) sorted.push(e);
    }
    return sorted;
  } catch {
    return DEFAULT_QUICK_EMOJIS;
  }
}

export function trackEmojiUsage(emoji: string): void {
  try {
    const raw = localStorage.getItem(EMOJI_USAGE_KEY);
    const usage: Record<string, number> = raw ? JSON.parse(raw) : {};
    usage[emoji] = (usage[emoji] ?? 0) + 1;
    localStorage.setItem(EMOJI_USAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore
  }
}

// Keep for backward compat
export const QUICK_EMOJIS = DEFAULT_QUICK_EMOJIS;
