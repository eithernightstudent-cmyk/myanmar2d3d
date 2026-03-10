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

export function getNextCheckText(parts: ThailandParts, lastFetchAtMs: number, pollIntervalMs = 20000) {
  if (isWithinMarketHours(parts)) {
    if (!lastFetchAtMs) return "Now";
    const msLeft = Math.max(0, pollIntervalMs - (Date.now() - lastFetchAtMs));
    return `in ${Math.ceil(msLeft / 1000)}s`;
  }
  if (lastFetchAtMs) {
    const msLeft = Math.max(0, pollIntervalMs - (Date.now() - lastFetchAtMs));
    if (msLeft > 0 && msLeft < pollIntervalMs) {
      return `in ${Math.ceil(msLeft / 1000)}s`;
    }
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

const FINAL_SESSION_TIMES = ["11:00", "12:01", "15:00", "16:30"] as const;
const FINAL_SESSION_TIME_SET = new Set(FINAL_SESSION_TIMES);

function toSessionKey(raw: unknown): string {
  const text = String(raw ?? "").trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeSessionTime(raw: unknown): string {
  const key = toSessionKey(raw);
  return key ? `${key}:00` : String(raw ?? "").trim();
}

function normalizeDate(raw: unknown): string {
  const text = String(raw ?? "").trim();
  const matched = text.match(/\d{4}-\d{2}-\d{2}/);
  return matched ? matched[0] : text;
}

export interface SessionDay {
  date?: string;
  child?: Array<Record<string, string>>;
  [key: string]: unknown;
}

export function normalizeSessionDays(raw: unknown, maxDays?: number): SessionDay[] {
  const input = (() => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as SessionDay).child)) return [raw];
    return [];
  })();

  const normalized = input
    .map((day) => {
      const data = day as SessionDay;
      const entries = Array.isArray(data.child) ? data.child : [];
      const byTime = new Map<string, Record<string, string>>();

      for (const entry of entries) {
        const key = toSessionKey(entry?.time ?? entry?.open_time);
        if (!FINAL_SESSION_TIME_SET.has(key as (typeof FINAL_SESSION_TIMES)[number])) continue;

        const record = entry as Record<string, unknown>;
        byTime.set(key, {
          ...Object.fromEntries(
            Object.entries(record).map(([entryKey, entryValue]) => [entryKey, String(entryValue ?? "")]),
          ),
          time: normalizeSessionTime(record?.time ?? record?.open_time),
          open_time: normalizeSessionTime(record?.open_time ?? record?.time),
          twod: String(record?.twod ?? "").trim(),
          set: String(record?.set ?? "").trim(),
          value: String(record?.value ?? "").trim(),
        });
      }

      const child = FINAL_SESSION_TIMES
        .map((time) => byTime.get(time))
        .filter((entry): entry is Record<string, string> => !!entry);
      const date = normalizeDate(data.date);

      if (!date || child.length === 0) return null;
      return {
        ...data,
        date,
        child,
      };
    })
    .filter((day): day is NonNullable<typeof day> => !!day) as SessionDay[];

  normalized.sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  if (maxDays && maxDays > 0) return normalized.slice(0, maxDays);
  return normalized;
}

export { MARKET_WINDOW };
