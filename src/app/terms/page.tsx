import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        <strong>Last updated:</strong> July 2026. By using Wish I Knew during this beta, you agree to these terms.
      </p>
      <p>
        Wish I Knew provides general practical guidance for Australian parents. It does not provide medical,
        legal, or financial advice and is not a substitute for advice from qualified professionals.
      </p>
      <p>
        Content is provided in good faith for informational purposes. Every child and family is different. Use your
        judgement and consult your GP, midwife, child and family health nurse, or other qualified professional when
        something matters to you.
      </p>
      <p>
        This beta is invite-only and provided as-is while we improve the product. Features may change, break, or be
        removed without notice.
      </p>
      <p>
        You agree not to misuse the service, attempt to access other users&apos; data, or scrape or republish card
        content without permission.
      </p>
      <p>
        To the extent permitted by law, Wish I Knew is not liable for decisions you make based on app content. Our
        liability in this beta is limited to the maximum extent allowed under Australian consumer law.
      </p>
    </LegalPage>
  );
}
