import { Container } from "@/components/ui/PageHeader";
export function StaffHero({ eyebrow, title, children }) {
    return (<section className="border-b border-ink-800">
      <Container className="max-w-[88rem] py-10">
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{eyebrow}</p>
        <h1 className="text-3xl font-bold text-heading sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-ink-300">{children}</p>
      </Container>
    </section>);
}
