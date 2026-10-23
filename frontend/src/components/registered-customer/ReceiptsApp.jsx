import { FileUp, Plus, RefreshCw, Receipt, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Pagination } from "./Pagination";
import { ListSearch, SegmentedTabs } from "@/components/staff/ListToolbar";
import { useCan, useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/FormField";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/States";
import { usePagedQuery } from "@/hooks/usePagedQuery";
import { ApiError, addReceipt, deleteReceipt, getReceipts, importReceipts } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "taken", label: "Taken" },
];
/**
 * Company receipts (was "Company Serials"): the company's list of paid receipts.
 * A registration whose reference number matches an Active receipt is validated automatically
 * and the receipt becomes Taken.
 */
export function ReceiptsApp() {
    const { onUnauthenticated } = useStaff();
    const can = useCan();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [notice, setNotice] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [fieldError, setFieldError] = useState(undefined);
    const [busy, setBusy] = useState(false);
    const [number, setNumber] = useState("");
    const [bought, setBought] = useState("");
    const fileRef = useRef(null);
    const load = useCallback(() => getReceipts(search, status, page), [search, status, page]);
    const q = usePagedQuery(load, [search, status, page], onUnauthenticated);
    function fail(e, fallback) {
        if (e instanceof ApiError && e.isUnauthenticated)
            onUnauthenticated();
        else
            setActionError(e instanceof Error ? e.message : fallback);
    }
    async function onAdd(e) {
        e.preventDefault();
        setBusy(true);
        setNotice(null);
        setActionError(null);
        setFieldError(undefined);
        try {
            const res = await addReceipt(number, bought);
            setNotice(res.matched ? "Receipt added - a registration was validated automatically." : "Receipt added.");
            setNumber("");
            setBought("");
            q.reload();
        }
        catch (err) {
            if (err instanceof ApiError && err.isValidation)
                setFieldError(err.errors.receipt_number?.[0] ?? err.message);
            else
                fail(err, "Could not add the receipt.");
        }
        finally {
            setBusy(false);
        }
    }
    async function onImport(file) {
        if (!file)
            return;
        setBusy(true);
        setNotice(null);
        setActionError(null);
        try {
            const res = await importReceipts(file);
            const d = res.data;
            setNotice(`${res.message} Skipped ${d.duplicates} duplicate and ${d.invalid} invalid row(s).`);
            q.reload();
        }
        catch (err) {
            fail(err, "The import failed.");
        }
        finally {
            setBusy(false);
            if (fileRef.current)
                fileRef.current.value = "";
        }
    }
    async function onDelete(id) {
        setBusy(true);
        setNotice(null);
        setActionError(null);
        try {
            await deleteReceipt(id);
            q.reload();
        }
        catch (err) {
            fail(err, "Could not remove the receipt.");
        }
        finally {
            setBusy(false);
        }
    }
    const counts = q.data?.counts;
    return (<div className="space-y-6">
      {can.records && (<section aria-label="Add or import receipts" className="grid gap-4 rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-4 sm:p-5 lg:grid-cols-2">
        <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
          <Field id="receipt-number" label="Add receipt number" error={fieldError}>
            <TextInput id="receipt-number" required maxLength={100} value={number} onChange={(e) => setNumber(e.target.value)} aria-invalid={!!fieldError}/>
          </Field>
          <Field id="receipt-date" label="Date bought (optional)">
            <TextInput id="receipt-date" type="date" value={bought} onChange={(e) => setBought(e.target.value)}/>
          </Field>
          <Button type="submit" disabled={busy || !number.trim()}>
            <Plus className="size-4" aria-hidden/> Add
          </Button>
        </form>

        <div className="flex flex-col justify-end gap-2">
          <p className="text-sm font-medium text-ink-100">Import from CSV</p>
          <p className="text-xs text-ink-400">First column: receipt number. Optional second column: date bought. Matching registrations are validated automatically.</p>
          <input ref={fileRef} id="receipt-file" type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])}/>
          <div>
            <Button variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
              <FileUp className="size-4" aria-hidden/> Choose CSV file
            </Button>
          </div>
        </div>
      </section>)}

      {notice && (<p role="status" className="rounded-lg border border-success-400/30 bg-success-400/10 px-4 py-3 text-sm text-success-400">
          {notice}
        </p>)}
      {actionError && <ErrorMessage title="Action failed" message={actionError}/>}

      <section aria-label="Filters" className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-4 sm:p-5 md:flex-row md:items-end md:justify-between">
        <ListSearch label="Search receipts" placeholder="Receipt number…" onSearch={(v) => {
            setSearch(v);
            setPage(1);
        }}/>
        <div className="flex flex-wrap items-center gap-3">
          {counts && (<p className="text-sm text-ink-400">
              <strong className="text-heading">{counts.active}</strong> active · <strong className="text-heading">{counts.taken}</strong> taken
            </p>)}
          <SegmentedTabs label="Receipt status" value={status} options={STATUS_OPTIONS} onChange={(v) => {
            setStatus(v);
            setPage(1);
        }}/>
        </div>
      </section>

      <section aria-busy={q.loading} className="overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-900">
        {q.error ? (<div className="p-5">
            <ErrorMessage title="Couldn't load receipts" message={q.error.message} action={<Button variant="secondary" size="sm" onClick={q.reload}>
                  <RefreshCw className="size-4" aria-hidden/> Try again
                </Button>}/>
          </div>) : !q.data ? (<LoadingState label="Loading receipts…"/>) : q.data.data.length === 0 ? (<div className="p-5">
            <EmptyState icon={<Receipt className="size-6" aria-hidden/>} title="No receipts" message="Add a receipt number or import the company list."/>
          </div>) : (<div className={`overflow-x-auto ${q.loading ? "pointer-events-none opacity-60" : ""}`} tabIndex={0} aria-label="Receipts table, scrolls horizontally">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Company receipts</caption>
              <thead className="border-b border-ink-700 bg-ink-850 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Receipt no.</th>
                  <th scope="col" className="px-4 py-3">Date bought</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Matched registration</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {q.data.data.map((r) => (<tr key={r.id} className="hover:bg-ink-850/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-heading">{r.receipt_number}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-300">{formatDate(r.date_bought)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "taken" ? "bg-success-400/10 text-success-400" : "bg-ink-700 text-ink-100"}`}>
                        {r.status === "taken" ? "Taken" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.registration ? (<>
                          <p className="text-heading">{r.registration.full_name}</p>
                          <p className="font-mono text-xs text-ink-400">
                            {r.registration.ticket_code} · {formatDateTime(r.taken_at)}
                          </p>
                        </>) : (<span className="text-ink-400">—</span>)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {can.records && r.status === "active" && (<button type="button" disabled={busy} onClick={() => void onDelete(r.id)} aria-label={`Remove receipt ${r.receipt_number}`} className="inline-flex h-8 items-center gap-1 rounded-md border border-ink-700 px-2.5 text-xs font-medium text-ink-300 hover:border-brand-500 hover:text-brand-300 disabled:opacity-50">
                          <Trash2 className="size-3.5" aria-hidden/> Remove
                        </button>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
        {q.data && !q.error && <Pagination meta={q.data.meta} onPageChange={setPage} disabled={q.loading} noun="receipt"/>}
      </section>
    </div>);
}
