import { inputClasses } from "@/components/ui/FormField";
/**
 * "From / To" registration-date range (kept from the original page).
 * Values are YYYY-MM-DD, the same format the API validates.
 */
export function CustomerDateFilter({ from, to, onChange }) {
    return (<fieldset className="flex flex-wrap items-end gap-3">
      <legend className="sr-only">Registration date range</legend>
      <div>
        <label htmlFor="date-from" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-400">
          Registered from
        </label>
        <input id="date-from" type="date" value={from} max={to || undefined} onChange={(e) => onChange({ dateFrom: e.target.value, dateTo: to })} className={`${inputClasses} w-[10.5rem]`}/>
      </div>
      <div>
        <label htmlFor="date-to" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-400">
          To
        </label>
        <input id="date-to" type="date" value={to} min={from || undefined} onChange={(e) => onChange({ dateFrom: from, dateTo: e.target.value })} className={`${inputClasses} w-[10.5rem]`}/>
      </div>
    </fieldset>);
}
