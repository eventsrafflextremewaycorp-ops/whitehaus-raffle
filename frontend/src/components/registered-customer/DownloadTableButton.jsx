import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, downloadRegisteredCustomers } from "@/lib/api";
/** Downloads every row matching the current filters (all pages) as CSV. */
export function DownloadTableButton({ filters, total, disabled, onUnauthenticated }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const empty = total === 0;
    async function onClick() {
        setBusy(true);
        setError(null);
        try {
            await downloadRegisteredCustomers(filters);
        }
        catch (e) {
            if (e instanceof ApiError && e.isUnauthenticated)
                onUnauthenticated();
            setError(e instanceof Error ? e.message : "Download failed. Please try again.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<div className="flex flex-col items-start gap-1.5 md:items-end">
      <Button variant="secondary" onClick={onClick} disabled={disabled || busy || empty} aria-busy={busy} title={empty ? "There are no matching records to download" : "Download the filtered table as CSV"}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden/> : <Download className="size-4" aria-hidden/>}
        {busy ? "Preparing…" : "Download Table"}
      </Button>
      <p className="text-xs text-ink-400" aria-live="polite">
        {error ? <span className="text-brand-300">{error}</span> : empty ? "No matching records to download." : total !== null ? `CSV · ${total} ${total === 1 ? "row" : "rows"}` : " "}
      </p>
    </div>);
}
