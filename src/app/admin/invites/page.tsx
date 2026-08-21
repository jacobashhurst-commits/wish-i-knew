import { InviteManager } from "@/components/admin/invite-manager";
import { listAlphaInvites } from "@/app/actions/admin-invites";

export default async function AdminInvitesPage() {
  const invites = await listAlphaInvites();

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Alpha testers</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Add each friend&apos;s email here first. They sign up themselves at{" "}
        <code className="rounded bg-[#F0EEE9] px-1">/login</code> with that same email and a password
        they choose (invite-only when{" "}
        <code className="rounded bg-[#F0EEE9] px-1">WIK_BETA_INVITE_ONLY=true</code>). No magic link.
      </p>
      <InviteManager initialInvites={invites} />
    </section>
  );
}
