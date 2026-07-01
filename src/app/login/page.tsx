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
          <h1 className="font-display mt-4 text-4xl font-semibold text-[#0d1b2a]">Sign in to continue</h1>
          <p className="mt-2 text-sm leading-6 text-[#697386]">
            Magic link only. No password. Your timeline saves across devices.
          </p>
        </div>

        {authError ? (
          <p className="mb-4 rounded-xl bg-[#FFF5F5] px-4 py-3 text-sm font-medium text-[#FF6B6B]">
            That sign-in link did not work. Request a fresh magic link below.
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
