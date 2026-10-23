import { FilterX, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { CustomerSearch } from "./CustomerSearch";
import { CustomerDateFilter } from "./CustomerDateFilter";
import { CustomerTable } from "./CustomerTable";
import { DownloadTableButton } from "./DownloadTableButton";
import { Pagination } from "./Pagination";
import { StatusTabs } from "./StatusTabs";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/States";
import { useCan } from "@/components/staff/StaffShell";
import { useRegisteredCustomers } from "@/hooks/useRegisteredCustomers";
import { ApiError, openProof, setValidation } from "@/lib/api";
export function RegisteredCustomersDashboard({ onUnauthenticated }) {
    const can = useCan();
    const table = useRegisteredCustomers(onUnauthenticated);
    const [busyId, setBusyId] = useState(null);
    const [actionError, setActionError] = useState(null);
    const { filters } = table;
    const hasFilters = !!(filters.search || filters.dateFrom || filters.dateTo || filters.status !== "all");
    const meta = table.data?.meta ?? null;
    function handleActionError(e, fallback) {
        if (e instanceof ApiError && e.isUnauthenticated)
            onUnauthenticated();
        setActionError(e instanceof Error ? e.message : fallback);
    }
    async function toggleValidation(row) {
        setBusyId(row.id);
        setActionError(null);
        try {
            await setValidation(row.id, !row.validated_at);
            table.reload();
        }
        catch (e) {
            handleActionError(e, "Could not update the validation status.");
        }
        finally {
            setBusyId(null);
        }
    }
    async function viewProof(row) {
        setActionError(null);
        try {
            await openProof(row.id);
        }
        catch (e) {
            handleActionError(e, "Could not open the proof of purchase.");
        }
    }
    return (<div className="space-y-6">
      {/* Filter toolbar */}
      <section aria-label="Filters" className="rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
            <CustomerSearch value={filters.search} onSearch={(search) => table.setFilters({ search })}/>
            <CustomerDateFilter from={filters.dateFrom} to={filters.dateTo} onChange={(range) => table.setFilters(range)}/>
          </div>
          <DownloadTableButton filters={filters} total={meta?.total ?? null} disabled={table.loading} onUnauthenticated={onUnauthenticated}/>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-4">
          <StatusTabs value={filters.status} onChange={(status) => table.setFilters({ status })}/>
          {hasFilters && (<Button variant="ghost" size="sm" onClick={table.resetFilters}>
              <FilterX className="size-4" aria-hidden/> Clear filters
            </Button>)}
        </div>
      </section>

      {actionError && <ErrorMessage title="Action failed" message={actionError}/>}

      {/* Results */}
      <section aria-label="Results" aria-busy={table.loading} className="overflow-hidden rounded-[var(--radius-card)] border border-ink-700 bg-ink-900">
        {table.error ? (<div className="p-5">
            <ErrorMessage title="Couldn't load registrations" message={table.error.message} action={<Button variant="secondary" size="sm" onClick={table.reload}>
                  <RefreshCw className="size-4" aria-hidden/> Try again
                </Button>}/>
          </div>) : !table.data ? (<LoadingState label="Loading registrations…"/>) : table.data.data.length === 0 && !table.loading ? (<div className="p-5">
            <EmptyState icon={<Users className="size-6" aria-hidden/>} title={hasFilters ? "No registrations match these filters" : "No registrations yet"} message={hasFilters ? "Try a different search term or date range." : "New registrations will appear here."} action={hasFilters ? (<Button variant="secondary" size="sm" onClick={table.resetFilters}>
                    <FilterX className="size-4" aria-hidden/> Clear filters
                  </Button>) : undefined}/>
          </div>) : (<div className={table.loading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
            <p className="px-4 pt-3 text-xs text-ink-400 sm:hidden">Scroll sideways to see all columns.</p>
            <CustomerTable rows={table.data.data} busyId={busyId} onToggleValidation={toggleValidation} onViewProof={viewProof} canValidate={can.records}/>
          </div>)}

        {meta && !table.error && <Pagination meta={meta} onPageChange={table.goToPage} disabled={table.loading}/>}
      </section>
    </div>);
}
