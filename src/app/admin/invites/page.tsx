import { InviteManager } from "@/components/admin/invite-manager";
import { listAlphaInvites } from "@/app/actions/admin-invites";

export default async function AdminInvitesPage() {
  const invites = await listAlphaInvites();

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Alpha testers</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Emails on this list can request a magic link when invite-only mode is on (
        <code className="rounded bg-[#F0EEE9] px-1">WIK_BETA_INVITE_ONLY=true</code>).
      </p>
      <InviteManager initialInvites={invites} />
    </section>
  );
}
