import { Dices, RefreshCw, Trophy } from "lucide-react";
import { Link } from "@/lib/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { WinnerModal } from "./WinnerModal";
import { useStaff } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageHeader";
import { ErrorMessage, LoadingState } from "@/components/ui/States";
import { ApiError, getDrawState, spinDraw } from "@/lib/api";
const SPIN_MS = 3500;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Purely cosmetic "shuffling" text. The real winner is chosen and saved by the server. */
function shuffleText() {
    let out = "WH-";
    for (let i = 0; i < 20; i++)
        out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return out;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function DrawBoard() {
    const { onUnauthenticated } = useStaff();
    const [state, setState] = useState(null);
    const [excludeWinners, setExcludeWinners] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [display, setDisplay] = useState("WH-••••••••••••••••••••");
    const [winner, setWinner] = useState(null);
    const [recent, setRecent] = useState([]);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const ticker = useRef(null);
    const stopTicker = useCallback(() => {
        if (ticker.current)
            clearInterval(ticker.current);
        ticker.current = null;
    }, []);
    useEffect(() => stopTicker, [stopTicker]);
    useEffect(() => {
        let stale = false;
        getDrawState(!excludeWinners)
            .then((s) => {
            if (stale)
                return;
            setState(s);
            setError(null);
        })
            .catch((e) => {
            if (stale)
                return;
            if (e instanceof ApiError && e.isUnauthenticated)
                onUnauthenticated();
            else
                setError(e instanceof Error ? e.message : "Could not load the draw.");
        });
        return () => {
            stale = true;
        };
    }, [excludeWinners, attempt, onUnauthenticated]);
    async function onSpin() {
        if (spinning || !state || state.finished)
            return;
        setSpinning(true);
        setError(null);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        ticker.current = setInterval(() => setDisplay(shuffleText()), 70);
        try {
            const [result] = await Promise.all([spinDraw(!excludeWinners), sleep(reduceMotion ? 400 : SPIN_MS)]);
            stopTicker();
            setDisplay(result.winner.ticket_code);
            setState(result.state);
            setRecent((list) => [result.winner, ...list]);
            setWinner(result.winner);
        }
        catch (e) {
            stopTicker();
            if (e instanceof ApiError && e.isUnauthenticated)
                onUnauthenticated();
            else {
                setError(e instanceof Error ? e.message : "The draw could not be completed.");
                // Another browser may have made this draw; refresh the numbers.
                if (e instanceof ApiError && e.status === 409)
                    setAttempt((n) => n + 1);
            }
            setDisplay("WH-••••••••••••••••••••");
        }
        finally {
            setSpinning(false);
        }
    }
    if (!state) {
        return error ? (<ErrorMessage title="Couldn't load the draw" message={error} action={<Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            <RefreshCw className="size-4" aria-hidden/> Try again
          </Button>}/>) : (<LoadingState label="Loading the draw…"/>);
    }
    const noTickets = !state.finished && state.eligible === 0;
    return (<div className="space-y-6">
      <Card className="mx-auto max-w-3xl p-6 text-center sm:p-10">
        {state.finished ? (<>
            <Trophy className="mx-auto size-12 text-brand-400" aria-hidden/>
            <h2 className="mt-3 text-3xl font-bold text-heading">Congratulations to all the Winners!</h2>
            <p className="mt-2 text-ink-300">All {state.max_draw} draws have been made.</p>
          </>) : (<>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Draw {state.next_draw}</p>
            <h2 className="mt-1 text-3xl font-bold text-heading" data-testid="draw-category">
              {state.category}
            </h2>
          </>)}

        <p className={`mx-auto mt-8 max-w-full break-all rounded-xl border border-ink-700 bg-ink-950 px-4 py-6 font-mono text-xl font-bold tracking-wider sm:text-3xl ${spinning ? "text-brand-300" : "text-heading"}`} aria-live="off" data-testid="draw-display">
          {display}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button size="lg" onClick={onSpin} disabled={spinning || state.finished || noTickets} aria-busy={spinning} data-testid="spin-button">
            <Dices className={`size-5 ${spinning ? "animate-spin" : ""}`} aria-hidden/>
            {spinning ? "Drawing…" : state.finished ? "Draw complete" : "Draw"}
          </Button>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-300">
            <input type="checkbox" className="size-4 accent-[var(--color-brand-500)]" checked={excludeWinners} disabled={spinning} onChange={(e) => setExcludeWinners(e.target.checked)}/>
            Exclude winners
          </label>

          <p className="text-sm text-ink-400" role="status">
            {noTickets
            ? "No eligible tickets. Validate registrations first."
            : `${state.eligible.toLocaleString()} eligible validated ticket${state.eligible === 1 ? "" : "s"} · ${state.drawn} of ${state.max_draw} draws made`}
          </p>
        </div>

        {error && (<div className="mt-6 text-left">
            <ErrorMessage title="Draw not completed" message={error}/>
          </div>)}
      </Card>

      {recent.length > 0 && (<Card className="mx-auto max-w-3xl p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Drawn this session</h3>
          <ul className="mt-3 divide-y divide-ink-800 text-sm">
            {recent.map((w) => (<li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-medium text-heading">
                  {w.draw_number}. {w.category}
                </span>
                <span className="font-mono text-xs text-ink-300">{w.ticket_code}</span>
              </li>))}
          </ul>
          <Link href="/draw/winners" className="mt-3 inline-block text-sm font-medium text-brand-400 hover:text-brand-300">
            Open the full winners list →
          </Link>
        </Card>)}

      {winner && <WinnerModal winner={winner} onClose={() => setWinner(null)}/>}
    </div>);
}
