import type { MatchedCard } from "@/lib/timeline/types";

export type LookaheadEmailInput = {
  childName: string;
  cards: MatchedCard[];
  siteUrl: string;
  pauseUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cardSectionHtml(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const isQuietWeek = card.card_type === "quiet_week";
  const cardUrl = `${siteUrl}/?card=${encodeURIComponent(card.slug)}`;

  const parts: string[] = [];

  parts.push(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#ffffff;border-radius:16px;border:1px solid #e8e4da;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6FAF8E;font-weight:bold;">
          ${escapeHtml(isQuietWeek ? "Quiet week" : card.card_type)}
        </p>
        <h2 style="margin:6px 0 0 0;font-size:20px;color:#0d1b2a;">${escapeHtml(card.title)}</h2>
        ${card.subtitle ? `<p style="margin:4px 0 0 0;font-size:14px;color:#697386;">${escapeHtml(card.subtitle)}</p>` : ""}
        <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#172033;">
          ${escapeHtml(card.wish_i_knew)}
        </p>
        <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:#4a5468;">
          ${escapeHtml(card.short_summary)}
        </p>
        ${
          card.what_to_do_now
            ? `<p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#172033;"><strong>If you do one thing:</strong> ${escapeHtml(card.what_to_do_now)}</p>`
            : ""
        }
        ${
          card.what_can_wait
            ? `<p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#697386;"><strong>Can wait:</strong> ${escapeHtml(card.what_can_wait)}</p>`
            : ""
        }
        <p style="margin:16px 0 0 0;">
          <a href="${cardUrl}" style="display:inline-block;background:#0d1b2a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:10px 18px;border-radius:12px;">Open in Wish I Knew</a>
          <a href="${cardUrl}&action=save" style="display:inline-block;margin-left:8px;color:#1D809F;text-decoration:underline;font-size:14px;">Save for later</a>
        </p>
      </td></tr>
    </table>`);

  return parts.join("");
}

function cardSectionText(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const lines = [
    `— ${card.title} —`,
    card.wish_i_knew,
    card.short_summary,
    card.what_to_do_now ? `If you do one thing: ${card.what_to_do_now}` : null,
    card.what_can_wait ? `Can wait: ${card.what_can_wait}` : null,
    `Open: ${siteUrl}/?card=${encodeURIComponent(card.slug)}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export function renderLookaheadEmail(input: LookaheadEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { childName, cards, siteUrl, pauseUrl } = input;
  const heading = childName ? `Your week ahead with ${childName}` : "Your week ahead";
  const subject = cards.some((item) => item.card.card_type !== "quiet_week")
    ? `${heading} — ${cards.length} thing${cards.length === 1 ? "" : "s"} worth knowing`
    : `${heading} — a quiet one`;

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FFFDF7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF7;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 0 20px 0;">
          <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1D809F;font-weight:bold;">Wish I Knew</p>
          <h1 style="margin:8px 0 0 0;font-size:26px;color:#0d1b2a;">${escapeHtml(heading)}</h1>
          <p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#697386;">
            Everything below is the whole update — no need to open the app unless something is useful.
          </p>
        </td></tr>
        <tr><td>
          ${cards.map((item) => cardSectionHtml(item, siteUrl)).join("")}
        </td></tr>
        <tr><td style="padding:8px 0 0 0;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9aa1ad;">
            You chose to get this once a week. Life busy?
            <a href="${pauseUrl}" style="color:#1D809F;">Pause these emails</a> anytime — your account and timeline stay exactly as they are.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    "",
    ...cards.map((item) => cardSectionText(item, siteUrl)),
    "",
    `Pause these emails (your account stays): ${pauseUrl}`,
  ].join("\n\n");

  return { subject, html, text };
}
