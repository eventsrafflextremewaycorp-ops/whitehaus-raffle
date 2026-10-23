const TZ = "Asia/Manila";
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
export function formatPeso(value) {
    return peso.format(value);
}
/** "2026-10-16" -> "Oct 16, 2026" (date-only strings are not shifted by timezone). */
export function formatDate(value) {
    if (!value)
        return "—";
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = dateOnly ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleDateString("en-PH", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
}
export function formatDateTime(value) {
    if (!value)
        return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toLocaleString("en-PH", {
        timeZone: TZ,
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
/** "2026-10-16","2026-10-22" -> "October 16 to 22, 2026" */
export function formatPeriod(start, end) {
    const s = new Date(`${start}T00:00:00+08:00`);
    const e = new Date(`${end}T00:00:00+08:00`);
    const month = (d) => d.toLocaleDateString("en-PH", { timeZone: TZ, month: "long" });
    const day = (d) => d.toLocaleDateString("en-PH", { timeZone: TZ, day: "numeric" });
    const year = (d) => d.toLocaleDateString("en-PH", { timeZone: TZ, year: "numeric" });
    if (month(s) === month(e) && year(s) === year(e))
        return `${month(s)} ${day(s)} to ${day(e)}, ${year(e)}`;
    return `${month(s)} ${day(s)}, ${year(s)} to ${month(e)} ${day(e)}, ${year(e)}`;
}
/** Today's date in Manila as YYYY-MM-DD. */
export function todayInManila() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}
