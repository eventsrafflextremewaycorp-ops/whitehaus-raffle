import { StaffAccounts } from "@/components/staff/StaffAccounts";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffShell } from "@/components/staff/StaffShell";
import { Container } from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Add and manage staff accounts. Sits behind the same sign-in gate as the rest of the staff area. */
export default function StaffAccountsPage() {
  usePageTitle("Staff accounts");
  return (
    <>
      <StaffHero eyebrow="Staff area" title="Staff accounts">
        Add the people who can sign in. Staff can view records and run the draw; admins can also change records and manage staff; only the superadmin manages admins.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <StaffShell>
          <StaffAccounts />
        </StaffShell>
      </Container>
    </>
  );
}
