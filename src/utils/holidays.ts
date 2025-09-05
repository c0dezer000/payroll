import { type HolidayCalendar } from "../types";

const CACHE_KEY_PREFIX = "holidayCache-";

// Map public holiday API entries to our HolidayCalendar shape
const mapFromNager = (entry: any): HolidayCalendar => {
  const id = (entry.localName || entry.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return {
    id: id || `${entry.date}`,
    // Prefer localName for display by default
    name: entry.localName || entry.name || "Holiday",
    localName: entry.localName || entry.name || "",
    englishName: entry.name || entry.localName || "",
    date: entry.date,
    type: "national",
    description: entry.name || entry.localName || "",
    allowanceMultiplier: 0,
    isActive: true,
    eligibleReligions: ["all"],
  };
};

export const hydratePhilippineHolidays = async (year?: number): Promise<HolidayCalendar[]> => {
  const y = year || new Date().getFullYear();

  // Try public Nager.Date API which supports PH without an API key
  const url = `https://date.nager.at/api/v3/PublicHolidays/${y}/PH`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch holidays: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Unexpected holidays response");

    const mapped: HolidayCalendar[] = data.map(mapFromNager);

    // Cache client-side when available
    if (typeof window !== "undefined") {
      try {
        (window as any).__APP_HOLIDAYS = mapped;
        localStorage.setItem(CACHE_KEY_PREFIX + y, JSON.stringify({ ts: Date.now(), data: mapped }));
      } catch (err) {
        // ignore storage errors
      }
    }

    return mapped;
  } catch (err) {
    // network or parse problems — return empty so callers can fallback
    return [];
  }
};

export const getCachedHolidaysForYear = (year?: number): HolidayCalendar[] => {
  const y = year || new Date().getFullYear();
  try {
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win.__APP_HOLIDAYS && Array.isArray(win.__APP_HOLIDAYS)) return win.__APP_HOLIDAYS;
      const raw = localStorage.getItem(CACHE_KEY_PREFIX + y);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.data)) return parsed.data;
      }
    }
  } catch (err) {
    // ignore
  }

  return [];
};

// Convenience: request hydrate and swallow errors
export const ensureHolidaysHydrated = async (year?: number) => {
  try {
    const cached = getCachedHolidaysForYear(year);
    if (cached && cached.length > 0) return cached;
    return await hydratePhilippineHolidays(year);
  } catch (err) {
    return [];
  }
};
