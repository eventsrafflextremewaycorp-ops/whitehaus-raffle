import { RefreshCw, Ticket } from "lucide-react";
import { useCallback, useState } from "react";
import { Pagination } from "@/components/registered-customer/Pagination";
import { ListSearch, SegmentedTabs } from "@/components/staff/ListToolbar";
import { useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/States";
import { usePagedQuery } from "@/hooks/usePagedQuery";
import { getDrawTickets } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
const ENTRY_OPTIONS = [
    { value: "all", label: "All" },
    { value: "eligible", label: "In the draw" },
    { value: "pending", label: "Not validated" },
    { value: "won", label: "Won" },
];
const BADGE = {
    eligible: "bg-success-400/10 text-success-400",
    pending: "bg-warning-400/10 text-warning-400",
    won: "bg-brand-600/20 text-brand-300",
};
const LABEL = { eligible: "In the draw", pending: "Not validated", won: "Won" };
/**
 * Tickets = registrations. A ticket is created at registration (and e-mailed), and only
 * validated, not-yet-winning tickets are in the draw.
 */
export function TicketsList() {
    const { onUnauthenticated } = useStaff();
    const [search, setSearch] = useState("");
    const [entry, setEntry] = useState("all");
    const [page, setPage] = useState(1);
    const load = useCallback(() => getDrawTickets(search, entry, page), [search, entry, page]);
    const q = usePagedQuery(load, [search, entry, page], onUnauthenticated);
    return (<div className="space-y-6">
      <section aria-label="Filters" className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-4 sm:p-5 md:flex-row md:items-end md:justify-between">
        <ListSearch label="Search tickets" placeholder="Ticket, name or reference…" onSearch={(v) => {
            setSearch(v);
            setPage(1);
        }}/>
        <SegmentedTabs label="Entry status" value={entry} options={ENTRY_OPTIONS} onChange={(v) => {
            setEntry(v);
            setPage(1);
        }}/>
      </section>

      <section aria-busy={q.loading} className="overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-900">
        {q.error ? (<div className="p-5">
            <ErrorMessage title="Couldn't load tickets" message={q.error.message} action={<Button variant="secondary" size="sm" onClick={q.reload}>
                  <RefreshCw className="size-4" aria-hidden/> Try again
                </Button>}/>
          </div>) : !q.data ? (<LoadingState label="Loading tickets…"/>) : q.data.data.length === 0 ? (<div className="p-5">
            <EmptyState icon={<Ticket className="size-6" aria-hidden/>} title="No tickets found" message="Tickets appear when customers register."/>
          </div>) : (<div className={`overflow-x-auto ${q.loading ? "pointer-events-none opacity-60" : ""}`} tabIndex={0} aria-label="Tickets table, scrolls horizontally">
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">Raffle tickets</caption>
              <thead className="border-b border-ink-700 bg-ink-850 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Ticket no.</th>
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="px-4 py-3">Reference no.</th>
                  <th scope="col" className="px-4 py-3">Registered</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {q.data.data.map((t) => (<tr key={t.id} className="hover:bg-ink-850/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-heading">{t.ticket_code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-heading">{t.full_name}</p>
                      <p className="text-xs text-ink-400">{t.branch ?? "—"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-100">{t.reference_number}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-300">{formatDateTime(t.registered_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[t.entry]}`}>
                        {LABEL[t.entry]}
                        {t.draw_number ? ` · draw ${t.draw_number}` : ""}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
        {q.data && !q.error && <Pagination meta={q.data.meta} onPageChange={setPage} disabled={q.loading} noun="ticket"/>}
      </section>
    </div>);
}
