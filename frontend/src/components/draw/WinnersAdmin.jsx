import { Eye, EyeOff, RefreshCw, Trophy, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCan, useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormField";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/States";
import { ApiError, assignPrize, getDrawWinners, publishWinners, undoLastDraw } from "@/lib/api";
export function WinnersAdmin() {
    const { onUnauthenticated } = useStaff();
    const can = useCan();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [confirmUndo, setConfirmUndo] = useState(false);
    const [reloadCount, setReloadCount] = useState(0);
    const reload = useCallback(() => setReloadCount((n) => n + 1), []);
    const fail = useCallback((e, fallback) => {
        if (e instanceof ApiError && e.isUnauthenticated)
            onUnauthenticated();
        else
            setError(e instanceof Error ? e.message : fallback);
    }, [onUnauthenticated]);
    useEffect(() => {
        let stale = false;
        getDrawWinners()
            .then((res) => {
            if (stale)
                return;
            setData({ winners: res.data, state: res.state, prizes: res.prizes });
            setError(null);
        })
            .catch((e) => {
            if (!stale)
                fail(e, "Could not load the winners.");
        });
        return () => {
            stale = true;
        };
    }, [reloadCount, fail]);
    async function run(action, fallback) {
        setBusy(true);
        setError(null);
        try {
            await action();
            reload();
        }
        catch (e) {
            fail(e, fallback);
        }
        finally {
            setBusy(false);
            setConfirmUndo(false);
        }
    }
    if (!data) {
        return error ? (<ErrorMessage title="Couldn't load winners" message={error} action={<Button variant="secondary" size="sm" onClick={reload}>
            <RefreshCw className="size-4" aria-hidden/> Try again
          </Button>}/>) : (<LoadingState label="Loading winners…"/>);
    }
    const { winners, state, prizes } = data;
    // Draw numbers count down, so the most recent draw is the lowest number (listed first).
    const latest = winners.length ? winners[0] : null;
    return (<div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-4">
        <p className="text-sm text-ink-300" role="status">
          {winners.length} of {state.max_draw} draws made ·{" "}
          {state.published ? "Winners are visible on the public Winners page." : "Winners are hidden from the public until you publish them."}
        </p>
        {can.records && (<div className="flex flex-wrap gap-2">
          <Button variant={state.published ? "secondary" : "primary"} size="sm" disabled={busy || winners.length === 0} onClick={() => run(() => publishWinners(!state.published), "Could not change the published state.")}>
            {state.published ? <EyeOff className="size-4" aria-hidden/> : <Eye className="size-4" aria-hidden/>}
            {state.published ? "Unpublish" : "Publish winners"}
          </Button>
          {confirmUndo ? (<>
              <Button variant="danger" size="sm" disabled={busy} onClick={() => run(undoLastDraw, "Could not undo the draw.")}>
                Confirm: remove draw {latest?.draw_number}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmUndo(false)}>
                Cancel
              </Button>
            </>) : (<Button variant="secondary" size="sm" disabled={busy || !latest || state.published} onClick={() => setConfirmUndo(true)}>
              <Undo2 className="size-4" aria-hidden/> Undo last draw
            </Button>)}
        </div>)}
      </div>

      {error && <ErrorMessage title="Action failed" message={error}/>}

      {winners.length === 0 ? (<EmptyState icon={<Trophy className="size-6" aria-hidden/>} title="No winners yet" message="Run the draw to pick the first winner."/>) : (<div className="overflow-x-auto rounded-[var(--radius-card)] border border-ink-700 bg-ink-900" tabIndex={0} aria-label="Winners table, scrolls horizontally">
          <table className="w-full min-w-[900px] text-sm">
            <caption className="sr-only">Winners by draw number</caption>
            <thead className="border-b border-ink-700 bg-ink-850 text-left text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th scope="col" className="px-4 py-3">Draw</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Ticket no.</th>
                <th scope="col" className="px-4 py-3">Winner</th>
                <th scope="col" className="px-4 py-3">Prize</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {winners.map((w) => (<tr key={w.id}>
                  <td className="px-4 py-3 font-semibold text-heading">{w.draw_number}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-100">{w.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-100">{w.ticket_code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-heading">{w.full_name}</p>
                    <p className="text-xs text-ink-400">
                      {w.contact_number} · {w.email}
                    </p>
                    <p className="text-xs text-ink-400">{w.branch ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Prize for draw ${w.draw_number}`} value={w.prize_id === null ? "" : String(w.prize_id)} disabled={busy || !can.records} onChange={(e) => run(() => assignPrize(w.id, e.target.value ? Number(e.target.value) : null), "Could not assign the prize.")}>
                      <option value="">{w.category}</option>
                      {prizes.map((p) => (<option key={p.id} value={p.id}>
                          {p.name}
                        </option>))}
                    </Select>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>);
}
