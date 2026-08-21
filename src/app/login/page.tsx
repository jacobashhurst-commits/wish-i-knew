import { AuthGate } from "@/components/auth-gate";
import { SiteFooter } from "@/components/site-footer";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; auth?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authError = params.auth === "error";

  return (
    <main className="min-h-screen px-4 py-8 text-[#172033] sm:py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="wik-chip mx-auto bg-[#FFF6E6] text-[#1D809F]">Wish I Knew beta</p>
          <h1 className="font-display mt-4 text-4xl font-semibold text-[#0d1b2a]">Wish I Knew</h1>
          <p className="mt-2 text-sm leading-6 text-[#697386]">
            A simple, slightly cheeky timeline for Australian parents: what matters now, what&apos;s coming,
            and what can happily wait.
          </p>
        </div>

        <div className="mb-6 rounded-[1.5rem] border border-[#0d1b2a]/10 bg-[#FFF6E6] px-5 py-4 text-left text-sm leading-6 text-[#172033]">
          <p className="font-semibold text-[#0d1b2a]">How it works</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[#697386]">
            <li>Tell us a nickname and date, and we build a calm stage-by-stage timeline.</li>
            <li>Browse Current, Coming, Saved, and Done cards. Open any card for the full &ldquo;wish I knew&rdquo; tip.</li>
            <li>Optional weekly Lookahead email on the day you pick (around 8am Sydney time).</li>
          </ul>
          <p className="mt-3 text-[#697386]">
            Built by a forgetful, lazy dad who somehow decided making an app would be easier than being
            prepared. It&apos;s meant to be light, useful, and a bit of fun, not another guilt machine.
          </p>
        </div>

        {authError ? (
          <p className="mb-4 rounded-xl bg-[#FFF5F5] px-4 py-3 text-sm font-medium text-[#FF6B6B]">
            That sign-in did not work. Try again with your email and password.
          </p>
        ) : null}

        <AuthGate requireConsent showBetaNote />

        <p className="mt-6 text-center text-sm text-[#697386]">
          New here? If you were invited, use the same email address that was added to the beta list.
        </p>

        <SiteFooter className="mt-10" />
      </div>
    </main>
  );
}
