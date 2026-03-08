const TH_TIMEZONE = "Asia/Yangon";

const MARKET_WINDOW = {
  start: 9 * 60 + 30,
  end: 16 * 60 + 30,
  label: "09:30-16:30",
};

const TH_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TH_TIMEZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const TH_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: TH_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export interface ThailandParts {
  weekday: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function getThailandParts(date = new Date()): ThailandParts {
  const map: Record<string, string> = {};
  for (const part of TH_PARTS_FORMATTER.formatToParts(date)) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  return {
    weekday: map.weekday || "",
    year: Number(map.year || 0),
    month: Number(map.month || 0),
    day: Number(map.day || 0),
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
    second: Number(map.second || 0),
  };
}

export function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

export function formatPartsClock(parts: ThailandParts) {
  return `${padTwo(parts.hour)}:${padTwo(parts.minute)}:${padTwo(parts.second)}`;
}

export function formatPartsDate(parts: ThailandParts) {
  return `${padTwo(parts.day)}/${padTwo(parts.month)}/${parts.year}`;
}

function minutesOfDay(parts: ThailandParts) {
  return parts.hour * 60 + parts.minute;
}

function isWeekday(parts: ThailandParts) {
  return parts.weekday !== "Sat" && parts.weekday !== "Sun";
}

export function isWithinMarketHours(parts: ThailandParts) {
  if (!isWeekday(parts)) return false;
  const minutes = minutesOfDay(parts);
  return minutes >= MARKET_WINDOW.start && minutes <= MARKET_WINDOW.end;
}

export function getNextCheckText(parts: ThailandParts, lastFetchAtMs: number) {
  if (isWithinMarketHours(parts)) {
    if (!lastFetchAtMs) return "Now";
    const msLeft = Math.max(0, 15000 - (Date.now() - lastFetchAtMs));
    return `in ${Math.ceil(msLeft / 1000)}s`;
  }
  if (!isWeekday(parts)) return "Next weekday 09:30 (TH)";
  const nowMinutes = minutesOfDay(parts);
  if (nowMinutes < MARKET_WINDOW.start) return "Today 09:30 (TH)";
  return "Next weekday 09:30 (TH)";
}

export function parseNumeric(raw: unknown): number | null {
  const value = Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(value) ? value : null;
}

export function formatNumber(raw: unknown) {
  const numeric = parseNumeric(raw);
  if (numeric === null) return "--";
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getLastDigit(raw: unknown) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits ? digits[digits.length - 1] : "-";
}

export function calculateTwoD(setRaw: unknown, valueRaw: unknown) {
  const setDigit = getLastDigit(setRaw);
  const valueDigit = getLastDigit(valueRaw);
  return {
    setDigit,
    valueDigit,
    result: setDigit === "-" || valueDigit === "-" ? "--" : `${setDigit}${valueDigit}`,
  };
}

export function formatTimestamp(value: unknown) {
  if (!value) return "--";
  const asString = String(value).trim();
  if (!asString) return "--";
  const normalized = asString.replace(/(\.\d{3})\d+(?=[+-]\d{2}:\d{2}$)/, "$1");
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime())) return "--";
  return TH_TIMESTAMP_FORMATTER.format(parsed).replace(",", "");
}

export { MARKET_WINDOW };
