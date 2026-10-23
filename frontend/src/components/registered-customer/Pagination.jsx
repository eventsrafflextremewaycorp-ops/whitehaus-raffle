import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
/** First Page / Previous / Page X of Y / Next / Last Page, driven by the API's pagination meta. */
export function Pagination({ meta, onPageChange, disabled, noun = "registration" }) {
    const { current_page: page, last_page: last, total, from, to } = meta;
    const atStart = page <= 1;
    const atEnd = page >= last;
    return (<div className="flex flex-col gap-4 border-t border-ink-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-ink-300" aria-live="polite">
        {total === 0 ? (`No matching ${noun}s`) : (<>
            Showing <strong className="text-heading">{from}</strong>–<strong className="text-heading">{to}</strong> of{" "}
            <strong className="text-heading">{total}</strong> {total === 1 ? noun : `${noun}s`}
          </>)}
      </p>

      <nav aria-label="Table pagination" className="flex flex-wrap items-center gap-1.5">
        <PageButton label="First Page" onClick={() => onPageChange(1)} disabled={disabled || atStart}>
          <ChevronsLeft className="size-4" aria-hidden/>
          <span className="hidden sm:inline">First Page</span>
        </PageButton>
        <PageButton label="Previous page" onClick={() => onPageChange(page - 1)} disabled={disabled || atStart}>
          <ChevronLeft className="size-4" aria-hidden/>
          <span className="hidden sm:inline">Prev</span>
        </PageButton>
        <span className="px-2 text-sm text-ink-300" aria-current="page">
          Page <strong className="text-heading">{total === 0 ? 0 : page}</strong> of <strong className="text-heading">{total === 0 ? 0 : last}</strong>
        </span>
        <PageButton label="Next page" onClick={() => onPageChange(page + 1)} disabled={disabled || atEnd}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden/>
        </PageButton>
        <PageButton label="Last Page" onClick={() => onPageChange(last)} disabled={disabled || atEnd}>
          <span className="hidden sm:inline">Last Page</span>
          <ChevronsRight className="size-4" aria-hidden/>
        </PageButton>
      </nav>
    </div>);
}
function PageButton({ label, onClick, disabled, children }) {
    return (<button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="inline-flex h-9 items-center gap-1 rounded-lg border border-ink-700 bg-ink-850 px-2.5 text-sm font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:bg-ink-850">
      {children}
    </button>);
}
