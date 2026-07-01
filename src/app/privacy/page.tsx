import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        <strong>Last updated:</strong> July 2026. This beta policy covers Wish I Knew while we test with a small
        group of invited users.
      </p>
      <p>
        Wish I Knew collects the information you provide during sign-up and onboarding: your email address, child
        nickname, due date or birth date, state or territory, and optional preferences such as childcare plans and
        weekly email timing.
      </p>
      <p>
        We use this information to personalise your parenting timeline, save your card actions, and (if you opt in)
        send your weekly Lookahead email. We do not sell your personal information.
      </p>
      <p>
        Data is stored in Supabase (hosted infrastructure) and processed by service providers that help us run the
        app, including email delivery through Resend when you enable weekly emails.
      </p>
      <p>
        You can pause weekly emails from the email itself or in Settings. You can sign out at any time. To request
        account deletion during the beta, contact the person who invited you to the test.
      </p>
      <p>
        This is a private beta. We may update this policy before a wider public launch.
      </p>
    </LegalPage>
  );
}
