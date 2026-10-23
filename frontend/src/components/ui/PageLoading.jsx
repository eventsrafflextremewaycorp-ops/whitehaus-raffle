import { Container } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/States";

/** Placeholder shown while a page's data loads (replaces Next's loading.js). */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading page">
      <div className="border-b border-ink-800">
        <Container className="space-y-4 py-14">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-2/3 max-w-lg" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Container>
      </div>
      <Container className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </Container>
    </div>
  );
}
