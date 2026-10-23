import { MailCheck } from "lucide-react";
import { useState } from "react";
import { StaffHero } from "@/components/staff/StaffHero";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, describedBy } from "@/components/ui/FormField";
import { Card, Container } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError, forgotPassword } from "@/lib/api";
import { Link } from "@/lib/router";
import { LOGIN_ROUTE } from "@/lib/site";

/** Signed out: ask for a reset link by email. */
export default function ForgotPasswordPage() {
    usePageTitle("Forgot password");
    const [email, setEmail] = useState("");
    const [fieldError, setFieldError] = useState(null);
    const [failure, setFailure] = useState(null);
    const [sent, setSent] = useState(null);
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setFieldError(null);
        setFailure(null);
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setFieldError("Enter the email you sign in with.");
            return;
        }
        setBusy(true);
        try {
            const res = await forgotPassword(email.trim());
            setSent(res.message);
        }
        catch (err) {
            if (err instanceof ApiError && err.isValidation) setFieldError(err.errors.email?.[0] ?? err.message);
            else setFailure(err instanceof Error ? err.message : "Could not send the reset link.");
        }
        finally {
            setBusy(false);
        }
    }

    return (<>
      <StaffHero eyebrow="Staff area" title="Forgot your password?">
        Enter the email you sign in with. If it belongs to an active staff, admin or superadmin account, we will email a link to choose a new password.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <Card className="mx-auto max-w-md p-6 sm:p-8">
          {sent ? (<div className="space-y-4" role="status">
              <span className="grid size-12 place-items-center rounded-xl bg-success-400/10 text-success-400">
                <MailCheck className="size-6" aria-hidden/>
              </span>
              <h2 className="text-xl font-bold text-heading">Check your email</h2>
              <p className="text-sm text-ink-300">{sent}</p>
              <p className="text-xs text-ink-400">Nothing after a few minutes? Check your spam folder, or ask an admin or the superadmin to reset it for you.</p>
              <Link href={LOGIN_ROUTE} className="inline-block text-sm font-medium text-brand-300 hover:text-brand-200">
                Back to sign-in
              </Link>
            </div>) : (<form onSubmit={submit} noValidate className="space-y-4">
              <Field id="forgot-email" label="Email" required error={fieldError}>
                <TextInput id="forgot-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(fieldError)} aria-describedby={describedBy("forgot-email", fieldError)}/>
              </Field>
              {failure && <ErrorMessage title="Couldn't send the link" message={failure}/>}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Email me a reset link"}
              </Button>
              <p className="text-center text-sm">
                <Link href={LOGIN_ROUTE} className="font-medium text-brand-300 hover:text-brand-200">
                  Back to sign-in
                </Link>
              </p>
            </form>)}
        </Card>
      </Container>
    </>);
}
