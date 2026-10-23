import { usePageTitle } from "@/hooks/usePageTitle";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { PrivacyStatement } from "@/components/register/PrivacyStatement";
export default function PrivacyPage() {
    usePageTitle("Data Privacy Statement");
    return (<>
      <PageHeader eyebrow="Data Privacy Act of 2012" title="Data Privacy Statement"/>
      <Container className="max-w-3xl py-10">
        <PrivacyStatement />
      </Container>
    </>);
}
