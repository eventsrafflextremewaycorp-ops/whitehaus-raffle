import { usePageTitle } from "@/hooks/usePageTitle";
import { useLoad } from "@/hooks/useLoad";
import { PageLoading } from "@/components/ui/PageLoading";
import { getBranches } from "@/lib/api";
import { BranchDirectory } from "@/components/branches/BranchDirectory";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";

export default function ParticipatingBranchesPage() {
    usePageTitle("Participating Branches");
    const branches = useLoad(getBranches);
    if (!branches)
        return <PageLoading />;
    return (<>
      <PageHeader eyebrow="Where to buy" title="Participating branches" description={<p>Order and fully pay for your iPhone 18 Pro or Pro Max at any of these WhiteHaus branches or on the official website.</p>}/>
      <Container className="py-10">
        {branches.ok ? (<BranchDirectory branches={branches.data}/>) : (<ErrorMessage title="Branches unavailable" message={branches.error}/>)}
      </Container>
    </>);
}
