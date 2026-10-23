import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NewPasswordFields, checkNewPassword, firstErrors } from "@/components/account/PasswordInputs";
import { StaffHero } from "@/components/staff/StaffHero";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Container } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError, resetPasswordWithToken } from "@/lib/api";
import { Link } from "@/lib/router";
import { LOGIN_ROUTE, FORGOT_PASSWORD_ROUTE } from "@/lib/site";

/** Opened from the reset email: /reset-password?token=…&email=… */
export default function ResetPasswordPage() {
    usePageTitle("Choose a new password");
    const { token, email } = useMemo(() => {
        const q = new URLSearchParams(window.location.search);
        return { token: q.get("token") ?? "", email: q.get("email") ?? "" };
    }, []);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [failure, setFailure] = useState(null);
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setFailure(null);
        const local = checkNewPassword(password, confirm);
        setErrors(local);
        if (Object.keys(local).length) return;
        setBusy(true);
        try {
            await resetPasswordWithToken(token, email, password, confirm);
            setDone(true);
        }
        catch (err) {
            if (err instanceof ApiError && err.isValidation) {
                const fields = firstErrors(err.errors);
                // token / email problems are about the link, not something they typed
                if (fields.email || fields.token) setFailure(fields.email ?? fields.token);
                setErrors(fields);
            }
            else setFailure(err instanceof Error ? err.message : "Could not reset your password.");
        }
        finally {
            setBusy(false);
        }
    }

    const linkBroken = !token || !email;

    return (<>
      <StaffHero eyebrow="Staff area" title="Choose a new password">
        Set a new password for your staff account. The link from the email works once and expires after 60 minutes.
      </StaffHero>
      <Container className="max-w-[88rem] py-8">
        <Card className="mx-auto max-w-md p-6 sm:p-8">
          {done ? (<div className="space-y-4" role="status">
              <span className="grid size-12 place-items-center rounded-xl bg-success-400/10 text-success-400">
                <CheckCircle2 className="size-6" aria-hidden/>
              </span>
              <h2 className="text-xl font-bold text-heading">Password changed</h2>
              <p className="text-sm text-ink-300">You can now sign in with your new password. Any browser that was still signed in has been signed out.</p>
              <ButtonLink href={LOGIN_ROUTE} className="w-full">
                Go to sign-in
              </ButtonLink>
            </div>) : linkBroken ? (<ErrorMessage title="This link is incomplete" message="Open the link from the email again, or request a new one." action={<Link href={FORGOT_PASSWORD_ROUTE} className="text-sm font-medium text-brand-300 hover:text-brand-200">
                  Request a new link
                </Link>}/>) : (<form onSubmit={submit} noValidate className="space-y-4">
              <p className="text-sm text-ink-300">
                Account: <span className="break-all font-medium text-heading">{email}</span>
              </p>
              <NewPasswordFields idPrefix="reset" password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} errors={errors}/>
              {failure && (<ErrorMessage title="Couldn't reset your password" message={failure} action={<Link href={FORGOT_PASSWORD_ROUTE} className="text-sm font-medium text-brand-300 hover:text-brand-200">
                      Request a new link
                    </Link>}/>)}
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Save new password"}
              </Button>
            </form>)}
        </Card>
      </Container>
    </>);
}
