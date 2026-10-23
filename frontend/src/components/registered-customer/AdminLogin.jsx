import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/States";
import { Field, TextInput, describedBy } from "@/components/ui/FormField";
import { ApiError, login } from "@/lib/api";
import { Link } from "@/lib/router";
import { FORGOT_PASSWORD_ROUTE } from "@/lib/site";
export function AdminLogin({ onSignedIn, notice }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [fieldError, setFieldError] = useState(undefined);
    const [submitting, setSubmitting] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setFieldError(undefined);
        setSubmitting(true);
        try {
            onSignedIn(await login(email.trim(), password));
        }
        catch (err) {
            if (err instanceof ApiError && err.isValidation)
                setFieldError(err.errors.email?.[0] ?? err.message);
            else
                setError(err instanceof Error ? err.message : "Sign-in failed.");
        }
        finally {
            setSubmitting(false);
            setPassword("");
        }
    }
    return (<Card className="mx-auto max-w-md p-6 sm:p-8">
      <span className="grid size-12 place-items-center rounded-xl bg-brand-600/15 text-brand-400">
        <Lock className="size-6" aria-hidden/>
      </span>
      <h2 className="mt-4 text-2xl font-bold text-heading">Staff sign-in</h2>
      <p className="mt-1 text-sm text-ink-400">Registered customer records are available to authorized Xtremeway staff only.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {notice && !error && <p className="rounded-lg bg-ink-850 px-3 py-2 text-sm text-ink-300">{notice}</p>}
        {error && <ErrorMessage title="Couldn't sign in" message={error}/>}
        <Field id="admin-email" label="Email" error={fieldError}>
          <TextInput id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fieldError} aria-describedby={describedBy("admin-email", fieldError)}/>
        </Field>
        <Field id="admin-password" label="Password">
          <TextInput id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm">
          <Link href={FORGOT_PASSWORD_ROUTE} className="font-medium text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </Card>);
}
