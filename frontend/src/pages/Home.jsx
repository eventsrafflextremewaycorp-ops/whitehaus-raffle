import { usePageTitle } from "@/hooks/usePageTitle";
import { useLoad } from "@/hooks/useLoad";
import { PageLoading } from "@/components/ui/PageLoading";
import { getBranches, getPrizes, getPromotion, getWinners } from "@/lib/api";
import { Link } from "@/lib/router";
import { ArrowRight, CalendarDays, Gift, MapPin, ShieldCheck, Ticket, Trophy } from "lucide-react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { ButtonLink } from "@/components/ui/Button";
import { Card, Container } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { PrizeGrid } from "@/components/prizes/PrizeGrid";
import { PROMO } from "@/lib/content/promo";
import { formatPeriod, formatPeso } from "@/lib/format";

export default function HomePage() {
    usePageTitle("");
    const prizes = useLoad(getPrizes);
    const branches = useLoad(getBranches);
    const winners = useLoad(getWinners);
    const promotion = useLoad(getPromotion);
    if (!prizes || !branches || !winners || !promotion)
        return <PageLoading />;
    const regionCounts = branches.ok
        ? branches.data.reduce((acc, b) => {
            acc[b.region] = (acc[b.region] ?? 0) + 1;
            return acc;
        }, {})
        : {};
    return (<>
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden border-b border-ink-800">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-brand-600/20 blur-3xl"/>
        <Container className="relative space-y-8 py-8 sm:py-12">
          <HeroBanner title={`${PROMO.title} ${PROMO.week}`} initialUrl={promotion.ok ? promotion.data.banner_url : null} initialMobileUrl={promotion.ok ? promotion.data.banner_mobile_url : null}/>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="max-w-xl text-lg text-ink-300">
              Register online and order your new iPhone at WhiteHaus. Complete full payment to get freebies worth up to{" "}
              <strong className="text-heading">{formatPeso(PROMO.freebiesTotal)}</strong> and an entry to the electronic raffle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">
                Register your order
                <ArrowRight className="size-4" aria-hidden/>
              </ButtonLink>
              <ButtonLink href="/promo-mechanics" size="lg" variant="secondary">
                Read the mechanics
              </ButtonLink>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="sr-only">Key dates</h2>
            <dl className="space-y-5">
              <KeyFact icon={<CalendarDays className="size-5"/>} label="Promo period" value={formatPeriod(PROMO.periodStart, PROMO.periodEnd)}/>
              <KeyFact icon={<Gift className="size-5"/>} label="Guaranteed freebies" value={`Up to ${formatPeso(PROMO.freebiesTotal)}`}/>
              <KeyFact icon={<Ticket className="size-5"/>} label="Electronic raffle draw" value={PROMO.drawTimeLabel}/>
              <KeyFact icon={<MapPin className="size-5"/>} label="Where to buy" value="WhiteHaus Nationwide and order online in our official store"/>
            </dl>
          </Card>
          </div>
        </Container>
      </section>

      {/* Freebies */}
      <section aria-labelledby="freebies-heading" className="border-y border-ink-800 bg-ink-900 py-16">
        <Container>
          <SectionHeading id="freebies-heading" eyebrow="For every qualified customer" title={`Freebies worth up to ${formatPeso(PROMO.freebiesTotal)}`}/>
          <ul className="grid gap-4 md:grid-cols-2">
            {PROMO.freebies.map((f) => (<li key={f.items} className="flex items-start gap-4 rounded-[var(--radius-card)] border border-ink-700 bg-ink-850 p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-600/15 text-brand-400">
                  <Gift className="size-5" aria-hidden/>
                </span>
                <div>
                  <p className="font-semibold text-heading">{f.items}</p>
                  <p className="mt-1 text-sm text-ink-400">worth {formatPeso(f.value)}</p>
                </div>
              </li>))}
          </ul>
        </Container>
      </section>

      {/* Raffle prizes */}
      <section aria-labelledby="prizes-heading" className="py-16">
        <Container>
          <SectionHeading id="prizes-heading" eyebrow="Electronic raffle" title="Raffle prizes" link={{ href: "/prizes", label: "All prizes" }}/>
          {prizes.ok ? <PrizeGrid prizes={prizes.data}/> : <ErrorMessage title="Prizes unavailable" message={prizes.error}/>}
        </Container>
      </section>

      {/* Branches + winners */}
      <section className="pb-4">
        <Container className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-heading">
              <MapPin className="size-5 text-brand-400" aria-hidden/> Participating branches
            </h2>
            {branches.ok ? (<ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {Object.entries(regionCounts).map(([region, count]) => (<li key={region} className="rounded-lg bg-ink-850 px-3 py-2">
                    <span className="block text-ink-400">{region}</span>
                    <span className="font-semibold text-heading">
                      {region === "Website" ? "Online" : `${count} ${count === 1 ? "branch" : "branches"}`}
                    </span>
                  </li>))}
              </ul>) : (<p className="mt-4 text-sm text-ink-400">{branches.error}</p>)}
            <Link href="/participating-branches" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-400">
              Find a branch <ArrowRight className="size-4" aria-hidden/>
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-heading">
              <Trophy className="size-5 text-brand-400" aria-hidden/> Winners
            </h2>
            <p className="mt-4 text-sm text-ink-300">
              {winners.ok && winners.data.length > 0
            ? `${winners.data.length} official ${winners.data.length === 1 ? "winner has" : "winners have"} been announced.`
            : `Winners will be posted here after the electronic raffle draw on ${PROMO.drawTimeLabel} and final validation.`}
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs text-ink-400">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden/>
              Only retail.mktg@xtremewaycorp.com and the official contact number are used for winner notifications.
            </p>
            <Link href="/winners" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-400">
              View winners <ArrowRight className="size-4" aria-hidden/>
            </Link>
          </Card>
        </Container>
      </section>
    </>);
}
function KeyFact({ icon, label, value }) {
    return (<div className="flex gap-4">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink-800 text-brand-400">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 font-medium text-heading">{value}</dd>
      </div>
    </div>);
}
function SectionHeading({ id, eyebrow, title, link }) {
    return (<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
        <h2 id={id} className="text-2xl font-bold text-heading sm:text-3xl">
          {title}
        </h2>
      </div>
      {link && (<Link href={link.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-300 hover:text-brand-400">
          {link.label} <ArrowRight className="size-4" aria-hidden/>
        </Link>)}
    </div>);
}
