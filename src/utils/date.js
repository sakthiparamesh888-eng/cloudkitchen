// src/utils/date.js
export const WEEKDAYS = ["sun","mon","tue","wed","thu","fri","sat"];

/** return 'mon','tue',... for a Date */
export function weekdayNameFromDate(d){
  return WEEKDAYS[new Date(d).getDay()];
}

/** next calendar date (ISO yyyy-mm-dd) for the given weekday name (e.g. 'tue') starting from 'start' (Date or now) */
export function nextDateForWeekday(weekdayName, start = new Date()){
  weekdayName = weekdayName.toLowerCase().slice(0,3);
  const targetIndex = WEEKDAYS.indexOf(weekdayName);
  if (targetIndex === -1) return null;
  const current = new Date(start);
  current.setHours(0,0,0,0);
  const curIdx = current.getDay();
  let diff = (targetIndex - curIdx + 7) % 7;
  if (diff === 0) diff = 7; // next occurrence (not today)
  current.setDate(current.getDate() + diff);
  return current.toISOString().split("T")[0]; // yyyy-mm-dd
}

/** get next N calendar dates array starting from tomorrow */
export function upcomingDates(n = 5){
  const arr = [];
  const now = new Date();
  for(let i=1;i<=n;i++){
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    arr.push({
      iso: d.toISOString().split("T")[0],
      weekday: weekdayNameFromDate(d),
      dateObj: d
    });
  }
  return arr;
}

/** parse "HH:MM" string to Date on a given dateISO (yyyy-mm-dd) */
export function makeDateTimeFromISO(dateISO, timeStr){
  const [hh,mm] = timeStr.split(":").map(x=>Number(x));
  const dt = new Date(dateISO + "T00:00:00");
  if (!isNaN(hh)) dt.setHours(hh, isNaN(mm)?0:mm, 0, 0);
  return dt;
}

/** check if delivery datetime (dateISO + slotStartText) is at least 24 hours ahead */
export function isAtLeast24HoursFromNow(dateISO, slotStartText){
  // slotStartText like "06:00 AM - 07:00 AM" or "06:00" or "6:00 AM"
  if (!dateISO) return false;
  // extract HH:MM in 24h
  let start = slotStartText.split("-")[0].trim(); // "06:00 AM"
  // normalize to 24h HH:MM
  const normalized = normalizeTimeStringTo24(start);
  const dt = makeDateTimeFromISO(dateISO, normalized);
  const diff = dt.getTime() - Date.now();
  return diff >= (24 * 60 * 60 * 1000);
}

/** helper normalize "6:00 PM" to "18:00" or "06:00" */
export function normalizeTimeStringTo24(t){
  t = t.trim();
  const ampm = t.toLowerCase().includes("pm") ? "pm" : t.toLowerCase().includes("am") ? "am" : null;
  let clean = t.replace(/[apm\s\.]/ig,"").trim(); // e.g. "6:00"
  const parts = clean.split(":").map(Number);
  let hh = parts[0]||0, mm = parts[1]||0;
  if (ampm === "pm" && hh < 12) hh += 12;
  if (ampm === "am" && hh === 12) hh = 0;
  hh = String(hh).padStart(2,"0");
  mm = String(mm).padStart(2,"0");
  return `${hh}:${mm}`;
}
