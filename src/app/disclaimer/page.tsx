import { LegalPage } from "@/components/legal-page";

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <p>
        Wish I Knew is a practical parenting timeline for Australian families. It is not a medical device, health
        service, or emergency service.
      </p>
      <p>
        Cards may cover health, feeding, immunisation, safety, or government topics. They are written to be calm and
        useful, but they cannot know your full situation.
      </p>
      <p>
        Always seek professional advice when you are worried about your health or your child&apos;s health. In an
        emergency, call 000.
      </p>
      <p>
        Useful Australian resources include Pregnancy Birth and Baby (1800 882 436), PANDA (1300 726 306), and your
        GP or local child and family health service.
      </p>
      <p>
        Card sources and review dates are maintained in our content system. If something looks out of date, please tell
        us through the in-app suggestion form.
      </p>
    </LegalPage>
  );
}
