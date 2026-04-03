/** Shared helpers for admin timetable ↔ appointment matching (Asia/Singapore). */

export const TZ_SG = "Asia/Singapore";
export const ANCHOR_ORDER = ["09:00", "11:00", "14:00", "16:00", "17:00"];
const PART1_WAIT_MIN = 5;
const CONSULT_MIN = 25;
const REST_BETWEEN_MIN = 5;

export function addMinutesSg(d, m) {
  return new Date(d.getTime() + m * 60 * 1000);
}

export function slotToDateAnchor(dateStr, hhmm) {
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+08:00`);
}

/** dateYmd: YYYY-MM-DD in SG for this appointment; if omitted, derived from startTime. */
export function anchorSlotLabelForAppointment(a, dateYmd) {
  const ymd = dateYmd || new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: TZ_SG });
  if (a.slotAnchorTime) {
    return new Date(a.slotAnchorTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ_SG });
  }
  const t = new Date(a.startTime);
  for (const ft of ANCHOR_ORDER) {
    const anchor = slotToDateAnchor(ymd, ft);
    const p1s = addMinutesSg(anchor, PART1_WAIT_MIN);
    const p1e = addMinutesSg(p1s, CONSULT_MIN);
    const p2s = addMinutesSg(p1e, REST_BETWEEN_MIN);
    const p2e = addMinutesSg(p2s, CONSULT_MIN);
    if (t >= p1s && t < p1e) return ft;
    if (t >= p2s && t < p2e) return ft;
  }
  return new Date(a.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ_SG });
}
