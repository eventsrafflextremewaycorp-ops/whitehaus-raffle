import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "@/lib/router";
import { BadgeCheck, CalendarDays, CircleSlash, FileText, Gift, Mail, Package, Store, Ticket, Users } from "lucide-react";
import { Card, Container, PageHeader } from "@/components/ui/PageHeader";
import { MECHANICS, PROMO } from "@/lib/content/promo";
import { formatPeriod, formatPeso } from "@/lib/format";
const SECTIONS = [
    { id: "mechanics", label: "A. Promo mechanics" },
    { id: "raffle", label: "B. Electronic raffle draw" },
    { id: "validation", label: "C. Winner validation" },
    { id: "claiming", label: "D. Claiming of prizes" },
];
export default function PromoMechanicsPage() {
    usePageTitle("Promo Mechanics");
    return (<>
      <PageHeader eyebrow={`Promo period · ${formatPeriod(PROMO.periodStart, PROMO.periodEnd)}`} title={`${PROMO.title} ${PROMO.week}: WhiteHaus`} description={<p>{PROMO.permitNo}</p>}/>

      <Container className="grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-ink-700 text-sm">
            {SECTIONS.map((s) => (<li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-ink-400 hover:border-brand-400 hover:text-heading">
                  {s.label}
                </a>
              </li>))}
          </ul>
        </nav>

        <div className="space-y-14">
          {/* A */}
          <Section id="mechanics" letter="A" title="Promo mechanics">
            <Item n={1} icon={<CalendarDays className="size-5"/>} title="Who can join">
              <p>
                This promo is open to customers who register online and place an order for an Apple iPhone 18 Pro or Apple iPhone 18
                Pro Max from <strong className="text-heading">{formatPeriod(PROMO.periodStart, PROMO.periodEnd)}</strong> through the
                official websites of GameXtreme or WhiteHaus or at participating branches nationwide.
              </p>
            </Item>

            <Item n={2} icon={<BadgeCheck className="size-5"/>} title="How to qualify for the electronic raffle">
              <p>To qualify, the customer must:</p>
              <ol className="mt-3 list-[lower-alpha] space-y-2 pl-5 marker:text-brand-400">
                {MECHANICS.qualification.map((q) => (<li key={q}>{q}</li>))}
              </ol>
              <p className="mt-4 flex gap-2 rounded-lg border border-ink-700 bg-ink-850 p-3 text-sm">
                <CircleSlash className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden/>
                {MECHANICS.disqualified}
              </p>
            </Item>

            <Item n={3} icon={<Gift className="size-5"/>} title={`Freebies worth up to ${formatPeso(PROMO.freebiesTotal)}`}>
              <ul className="space-y-2">
                {PROMO.freebies.map((f) => (<li key={f.items} className="flex flex-wrap justify-between gap-2 rounded-lg bg-ink-850 px-4 py-3">
                    <span>{f.items}</span>
                    <span className="font-semibold text-heading">{formatPeso(f.value)}</span>
                  </li>))}
              </ul>
            </Item>

            <Item n={4} icon={<Ticket className="size-5"/>} title="Raffle prizes">
              <p>
                Qualified customers are also automatically included in the electronic raffle for a chance to win the raffle prizes.{" "}
                <Link href="/prizes" className="font-semibold text-brand-300 underline-offset-4 hover:underline">
                  See prizes
                </Link>
              </p>
            </Item>

            <Item n={5} icon={<Store className="size-5"/>} title="Participating branches">
              <p>
                This promo is available at participating WhiteHaus branches nationwide.{" "}
                <Link href="/participating-branches" className="font-semibold text-brand-300 underline-offset-4 hover:underline">
                  View branches
                </Link>
              </p>
            </Item>

            <div className="flex gap-3 rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-5 text-sm text-ink-300">
              <Users className="mt-0.5 size-5 shrink-0 text-brand-400" aria-hidden/>
              <p>
                <strong className="text-heading">Eligibility. </strong>
                {MECHANICS.eligibility}
              </p>
            </div>
          </Section>

          {/* B */}
          <Section id="raffle" letter="B" title="Electronic raffle draw">
            <Card className="p-6">
              <ul className="space-y-3 text-ink-300">
                {MECHANICS.raffle.map((r) => (<Bullet key={r}>{r}</Bullet>))}
              </ul>
            </Card>
          </Section>

          {/* C */}
          <Section id="validation" letter="C" title="Winner validation and notification">
            <Card className="p-6">
              <ul className="space-y-3 text-ink-300">
                {MECHANICS.notification.map((r) => (<Bullet key={r}>{r}</Bullet>))}
              </ul>
              <p className="mt-5 flex items-center gap-2 text-sm text-ink-400">
                <Mail className="size-4" aria-hidden/> Ignore messages from any other email address or number.
              </p>
            </Card>
          </Section>

          {/* D */}
          <Section id="claiming" letter="D" title="Claiming of prizes">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-heading">
                  <FileText className="size-5 text-brand-400" aria-hidden/> Winners must present
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-300">
                  {MECHANICS.claimRequirements.map((r) => (<Bullet key={r}>{r}</Bullet>))}
                </ul>
                <p className="mt-4 text-sm text-ink-400">{MECHANICS.claimNote}</p>
              </Card>
              <Card className="p-6">
                <h3 className="flex items-center gap-2 font-semibold text-heading">
                  <Users className="size-5 text-brand-400" aria-hidden/> Claiming through a representative
                </h3>
                <p className="mt-3 text-sm text-ink-400">
                  If a winner cannot claim the prize personally, an authorized representative may claim on their behalf by presenting:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink-300">
                  {MECHANICS.representativeRequirements.map((r) => (<Bullet key={r}>{r}</Bullet>))}
                </ul>
              </Card>
            </div>

            <h3 className="mt-8 flex items-center gap-2 font-semibold text-heading">
              <Package className="size-5 text-brand-400" aria-hidden/> How prizes and freebies are released
            </h3>
            <p className="mt-2 text-sm text-ink-400">Based on the payment method and fulfillment option selected:</p>
            <ol className="mt-4 grid gap-4 md:grid-cols-2">
              {MECHANICS.fulfillment.map((f, i) => (<li key={f.title} className="rounded-[var(--radius-card)] border border-ink-700 bg-ink-900 p-5">
                  <p className="font-display text-sm font-semibold text-brand-400">0{i + 1}</p>
                  <p className="mt-1 font-semibold text-heading">{f.title}</p>
                  <p className="mt-2 text-sm text-ink-300">{f.body}</p>
                </li>))}
            </ol>

            <ul className="mt-8 space-y-3 text-sm text-ink-300">
              {MECHANICS.terms.map((t) => (<Bullet key={t}>{t}</Bullet>))}
            </ul>
            <p className="mt-8 font-semibold text-heading">{PROMO.permitNo}</p>
          </Section>
        </div>
      </Container>
    </>);
}
function Section({ id, letter, title, children }) {
    return (<section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="mb-6 flex items-center gap-3 text-2xl font-bold text-heading">
        <span className="grid size-9 place-items-center rounded-lg bg-brand-600 font-display text-base text-white">{letter}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>);
}
function Item({ n, icon, title, children }) {
    return (<Card className="p-6">
      <h3 className="flex items-center gap-3 font-semibold text-heading">
        <span aria-hidden className="text-brand-400">
          {icon}
        </span>
        <span>
          <span className="sr-only">Item </span>
          {n}. {title}
        </span>
      </h3>
      <div className="mt-3 leading-relaxed text-ink-300">{children}</div>
    </Card>);
}
function Bullet({ children }) {
    return (<li className="flex gap-3">
      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"/>
      <span>{children}</span>
    </li>);
}
