import { Outlet } from "react-router-dom";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffShell } from "@/components/staff/StaffShell";
import { Container } from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

/** The draw, its tickets and winners. Nothing renders until a staff member has signed in. */
export default function DrawLayout() {
  usePageTitle("Raffle Draw");
  return (
    <>
      <StaffHero eyebrow="Electronic raffle" title="WhiteHaus Raffle Draw">
        Staff only. Sign in to run the draw, review tickets and publish winners. You can stay signed in on several browsers at the same time.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <StaffShell>
          <Outlet />
        </StaffShell>
      </Container>
    </>
  );
}
