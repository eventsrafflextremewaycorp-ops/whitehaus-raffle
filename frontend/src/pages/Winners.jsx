import { usePageTitle } from "@/hooks/usePageTitle";
import { useLoad } from "@/hooks/useLoad";
import { PageLoading } from "@/components/ui/PageLoading";
import { getWinners } from "@/lib/api";
import { Trophy } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorMessage } from "@/components/ui/States";
import { PROMO } from "@/lib/content/promo";

export default function WinnersPage() {
    usePageTitle("List of Winners");
    const winners = useLoad(getWinners);
    if (!winners)
        return <PageLoading />;
    return (<>
      <PageHeader eyebrow="Electronic raffle" title="List of winners" description={<p>Official winners are listed after the draw and final validation. Names are partially hidden to protect privacy.</p>}/>
      <Container className="py-10">
        {!winners.ok ? (<ErrorMessage title="Winners unavailable" message={winners.error}/>) : winners.data.length === 0 ? (<EmptyState icon={<Trophy className="size-6" aria-hidden/>} title="Check back for the winning tickets!" message={`The electronic raffle draw is on ${PROMO.drawTimeLabel} at the ${PROMO.drawVenue}. Winners will be posted here after final validation.`}/>) : (<div className="overflow-x-auto rounded-[var(--radius-card)] border border-ink-700">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Official raffle winners</caption>
              <thead className="bg-ink-850 text-ink-300">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Winner</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Branch</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800 bg-ink-900">
                {winners.data.map((w) => (<tr key={w.id}>
                    <td className="px-5 py-4 font-medium text-heading">{w.name}</td>
                    <td className="px-5 py-4 text-ink-300">{w.branch ?? "—"}</td>
                    <td className="px-5 py-4 text-ink-100">{w.prize}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </Container>
    </>);
}
