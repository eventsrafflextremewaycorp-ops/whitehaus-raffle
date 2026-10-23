import { usePageTitle } from "@/hooks/usePageTitle";
import { useLoad } from "@/hooks/useLoad";
import { PageLoading } from "@/components/ui/PageLoading";
import { getPrizes } from "@/lib/api";
import { Gift } from "lucide-react";
import { PrizeGrid } from "@/components/prizes/PrizeGrid";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { PROMO } from "@/lib/content/promo";
import { formatPeso } from "@/lib/format";

export default function PrizesPage() {
    usePageTitle("Prizes");
    const prizes = useLoad(getPrizes);
    if (!prizes)
        return <PageLoading />;
    return (<>
      <PageHeader eyebrow="Electronic raffle" title="Prizes" description={<p>
            Every qualified customer gets one (1) raffle entry, drawn on {PROMO.drawTimeLabel}. Participants can only win once.
          </p>}/>
      <Container className="py-10">
        {prizes.ok ? <PrizeGrid prizes={prizes.data}/> : <ErrorMessage title="Prizes unavailable" message={prizes.error}/>}

        <section aria-labelledby="freebies" className="mt-14">
          <h2 id="freebies" className="flex items-center gap-2 text-2xl font-bold text-heading">
            <Gift className="size-6 text-brand-400" aria-hidden/>
            Plus freebies for every qualified customer
          </h2>
          <p className="mt-2 text-ink-400">Total value of up to {formatPeso(PROMO.freebiesTotal)}.</p>
          <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-ink-700">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-ink-850 text-ink-300">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Freebie bundle</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800 bg-ink-900">
                {PROMO.freebies.map((f) => (<tr key={f.items}>
                    <td className="px-5 py-4 text-heading">{f.items}</td>
                    <td className="px-5 py-4 text-right font-semibold text-heading">{formatPeso(f.value)}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </>);
}
