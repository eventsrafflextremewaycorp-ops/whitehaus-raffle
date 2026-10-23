import { usePageTitle } from "@/hooks/usePageTitle";
import { useLoad } from "@/hooks/useLoad";
import { PageLoading } from "@/components/ui/PageLoading";
import { getBranches, getPromotion } from "@/lib/api";
import { RegistrationFlow } from "@/components/register/RegistrationFlow";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { formatPeriod } from "@/lib/format";
import { PROMO } from "@/lib/content/promo";

export default function RegisterPage() {
    usePageTitle("Register");
    const promotion = useLoad(getPromotion);
    const branches = useLoad(getBranches);
    if (!promotion || !branches)
        return <PageLoading />;
    return (<>
      <PageHeader eyebrow={`${PROMO.week} · ${formatPeriod(PROMO.periodStart, PROMO.periodEnd)}`} title="Register your iPhone 18 Pro order" description={<p>
            Registering is step one. To qualify for the freebies and raffle you also need to fully pay for and complete the purchase
            at your participating branch.
          </p>}/>
      <Container className="max-w-3xl py-10">
        {promotion.ok && branches.ok ? (promotion.data.registration_open ? (<RegistrationFlow promotion={promotion.data} branches={branches.data}/>) : (<ErrorMessage title="Registration is closed" message="Registration for this promo period has ended."/>)) : (<ErrorMessage title="Registration is temporarily unavailable" message={!promotion.ok ? promotion.error : !branches.ok ? branches.error : ""}/>)}
      </Container>
    </>);
}
