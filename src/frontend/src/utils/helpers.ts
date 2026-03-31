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

// Module-level store for per-user colors assigned by admin
let _storedUserColors: Record<string, string> = {};

export function setUserColors(colors: Record<string, string>): void {
  _storedUserColors = colors;
}

export function getUsernameColor(username: string): string {
  if (_storedUserColors[username]) return _storedUserColors[username];
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
