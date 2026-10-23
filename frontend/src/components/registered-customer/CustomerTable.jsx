import { BadgeCheck, CircleDashed, Image as ImageIcon, Loader2, Undo2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
const th = "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-400";
const td = "px-4 py-3.5 align-top";
export function CustomerTable({ rows, busyId, onToggleValidation, onViewProof, canValidate = true }) {
    return (<div className="overflow-x-auto" tabIndex={0} aria-label="Registered customers table, scrolls horizontally">
      <table className="w-full min-w-[1250px] text-sm">
        <caption className="sr-only">Registered customers</caption>
        <thead className="border-b border-ink-700 bg-ink-850">
          <tr>
            <th scope="col" className={th}>Registered</th>
            <th scope="col" className={th}>Customer</th>
            <th scope="col" className={th}>Reference no.</th>
            <th scope="col" className={th}>Ticket no.</th>
            <th scope="col" className={th}>Unit</th>
            <th scope="col" className={th}>Branch</th>
            <th scope="col" className={th}>Purchase date</th>
            <th scope="col" className={th}>Address</th>
            <th scope="col" className={`${th} sticky right-0 border-l border-ink-700 bg-ink-850 text-right`}>Status &amp; actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {rows.map((row) => {
            const validated = !!row.validated_at;
            const busy = busyId === row.id;
            return (<tr key={row.id} className="group hover:bg-ink-850/60">
                <td className={`${td} whitespace-nowrap text-ink-300`}>{formatDateTime(row.registered_at)}</td>
                <td className={td}>
                  <p className="font-medium text-heading">{row.full_name}</p>
                  <p className="text-xs text-ink-400">{row.email}</p>
                  <p className="text-xs text-ink-400">{row.contact_number}</p>
                </td>
                <td className={`${td} whitespace-nowrap font-mono text-xs text-ink-100`}>{row.reference_number}</td>
                <td className={`${td} whitespace-nowrap font-mono text-xs text-ink-300`}>{row.ticket_code ?? "—"}</td>
                <td className={`${td} whitespace-nowrap text-ink-100`}>{row.unit}</td>
                <td className={`${td} min-w-[9rem] text-ink-100`}>{row.branch ?? "—"}</td>
                <td className={`${td} whitespace-nowrap text-ink-100`}>{formatDate(row.purchase_date)}</td>
                <td className={`${td} min-w-[11rem] max-w-[15rem] text-ink-300`}>
                  <p className="line-clamp-2" title={row.address}>
                    {row.address}
                  </p>
                </td>
                <td className={`${td} sticky right-0 whitespace-nowrap border-l border-ink-800 bg-ink-900 text-right group-hover:bg-ink-850`}>
                  <div className="inline-flex items-center gap-1.5">
                  {validated ? (<span className="inline-flex items-center gap-1 rounded-full bg-success-400/10 px-2.5 py-1 text-xs font-semibold text-success-400">
                      <BadgeCheck className="size-3.5" aria-hidden/> Validated{row.validation_method === "receipt" ? " (receipt)" : ""}
                    </span>) : (<span className="inline-flex items-center gap-1 rounded-full bg-warning-400/10 px-2.5 py-1 text-xs font-semibold text-warning-400">
                      <CircleDashed className="size-3.5" aria-hidden/> Unvalidated
                    </span>)}
                    {row.has_proof && (<button type="button" onClick={() => onViewProof(row)} className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-700 px-2.5 text-xs font-medium text-ink-100 hover:border-ink-400" aria-label={`View proof of purchase for ${row.reference_number}`}>
                        <ImageIcon className="size-3.5" aria-hidden/> Proof
                      </button>)}
                    {canValidate && (<button type="button" onClick={() => onToggleValidation(row)} disabled={busy} className={`inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold disabled:opacity-50 ${validated ? "border border-ink-700 text-ink-300 hover:border-ink-400" : "bg-brand-600 text-white hover:bg-brand-500"}`} aria-label={`${validated ? "Mark as unvalidated" : "Validate"} ${row.reference_number}`}>
                      {busy ? (<Loader2 className="size-3.5 animate-spin" aria-hidden/>) : validated ? (<Undo2 className="size-3.5" aria-hidden/>) : (<BadgeCheck className="size-3.5" aria-hidden/>)}
                      {validated ? "Unvalidate" : "Validate"}
                    </button>)}
                  </div>
                </td>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
}
