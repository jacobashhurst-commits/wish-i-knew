import { InviteManager } from "@/components/admin/invite-manager";
import { listAlphaInvites } from "@/app/actions/admin-invites";

export default async function AdminInvitesPage() {
  const invites = await listAlphaInvites();

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Alpha testers</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Add a friend&apos;s email → we save them on the allowlist and email a signup link. They open{" "}
        <code className="rounded bg-[#F0EEE9] px-1">/login</code>, tap{" "}
        <strong>Create a password</strong>, use that same email, then finish onboarding. No magic link.
      </p>
      <InviteManager initialInvites={invites} />
    </section>
  );
}
