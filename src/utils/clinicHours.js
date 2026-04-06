const SG_TZ = "Asia/Singapore";

/** YYYY-MM-DD as a calendar day in Singapore */
export function isWeekendYmdSG(dateStr) {
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  const w = new Intl.DateTimeFormat("en-US", { timeZone: SG_TZ, weekday: "short" }).format(d);
  return w === "Sat" || w === "Sun";
}

/** Next Singapore calendar date (from today) that is Mon–Fri, as YYYY-MM-DD */
export function nextWeekdayYmdSG() {
  let d = new Date();
  for (let i = 0; i < 14; i++) {
    const w = new Intl.DateTimeFormat("en-US", { timeZone: SG_TZ, weekday: "short" }).format(d);
    if (w !== "Sat" && w !== "Sun") {
      return new Intl.DateTimeFormat("en-CA", { timeZone: SG_TZ }).format(d);
    }
    d = new Date(d.getTime() + 86400000);
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: SG_TZ }).format(new Date());
}
