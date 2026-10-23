import { usePageTitle } from "@/hooks/usePageTitle";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/PageHeader";
export default function NotFound() {
    usePageTitle("Page not found");
    return (<Container className="py-24 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">404</p>
      <h1 className="mt-3 text-3xl font-bold text-heading">Page not found</h1>
      <p className="mt-3 text-ink-300">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/promo-mechanics" variant="secondary">
          Promo mechanics
        </ButtonLink>
      </div>
    </Container>);
}
