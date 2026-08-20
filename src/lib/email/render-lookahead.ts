import { isWeeklyAnchorCard } from "@/lib/timeline/card-roles";
import type { MatchedCard } from "@/lib/timeline/types";

export type LookaheadEmailInput = {
  childName: string;
  cards: MatchedCard[];
  siteUrl: string;
  pauseUrl: string;
  /** e.g. "Pregnancy week 28" or "Baby week 6" */
  weekContext?: string | null;
};

const colors = {
  navy: "#0D1B2A",
  ocean: "#1D809F",
  aqua: "#4EC6C1",
  cream: "#FFF6E6",
  creamSoft: "#FFFDF7",
  white: "#FFFFFF",
  ink: "#172033",
  muted: "#697386",
  gum: "#6FAF8E",
  sand: "#F4D6A0",
  border: "#E8E4DA",
  softSky: "#E7F1FB",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absoluteAssetUrl(siteUrl: string, path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${siteUrl.replace(/\/$/, "")}${path}`;
  return null;
}

function typeAccent(isAnchor: boolean, isQuietWeek: boolean): string {
  if (isAnchor) return colors.ocean;
  if (isQuietWeek) return colors.gum;
  return colors.aqua;
}

function cardSectionHtml(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const isQuietWeek = card.card_type === "quiet_week";
  const isAnchor = isWeeklyAnchorCard(card);
  const cardUrl = `${siteUrl}/?card=${encodeURIComponent(card.slug)}`;
  const accent = typeAccent(isAnchor, isQuietWeek);
  const imageUrl = absoluteAssetUrl(siteUrl, card.image_url);
  const imageAlt = card.image_alt || card.title;

  const typeLabel = isAnchor
    ? "This week with bub"
    : isQuietWeek
      ? "Easy win"
      : card.card_type;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:${colors.white};border-radius:18px;border:1px solid ${colors.border};overflow:hidden;">
      <tr>
        <td style="width:6px;background:${accent};font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${
              imageUrl
                ? `<tr><td style="padding:18px 18px 0 18px;background:${colors.creamSoft};">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" width="120" height="120" style="display:block;width:120px;height:120px;border-radius:16px;border:1px solid ${colors.border};background:${colors.white};" />
                  </td></tr>`
                : ""
            }
            <tr><td style="padding:18px 22px 22px 22px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;">
                ${escapeHtml(typeLabel)}
              </p>
              <h2 style="margin:8px 0 0 0;font-size:21px;line-height:1.25;color:${colors.navy};font-family:Georgia,'Times New Roman',serif;">
                ${escapeHtml(card.title)}
              </h2>
              ${
                card.subtitle
                  ? `<p style="margin:6px 0 0 0;font-size:14px;color:${colors.muted};">${escapeHtml(card.subtitle)}</p>`
                  : ""
              }
              <p style="margin:14px 0 0 0;font-size:15px;line-height:1.7;color:${colors.ink};">
                ${escapeHtml(card.wish_i_knew)}
              </p>
              <p style="margin:10px 0 0 0;font-size:14px;line-height:1.65;color:${colors.muted};">
                ${escapeHtml(card.short_summary)}
              </p>
              ${
                card.what_to_do_now
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0 0;background:${colors.softSky};border-radius:14px;">
                      <tr><td style="padding:14px 16px;">
                        <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${colors.ocean};font-weight:700;">What to do now</p>
                        <p style="margin:6px 0 0 0;font-size:14px;line-height:1.6;color:${colors.ink};">${escapeHtml(card.what_to_do_now)}</p>
                      </td></tr>
                    </table>`
                  : ""
              }
              ${
                card.what_can_wait
                  ? `<p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:${colors.muted};"><strong style="color:${colors.ink};">Can wait:</strong> ${escapeHtml(card.what_can_wait)}</p>`
                  : ""
              }
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0 0;">
                <tr>
                  <td style="border-radius:999px;background:${colors.navy};">
                    <a href="${cardUrl}" style="display:inline-block;padding:11px 18px;font-size:14px;font-weight:700;color:${colors.cream};text-decoration:none;">Open in Wish I Knew</a>
                  </td>
                  <td style="width:12px;"></td>
                  <td>
                    <a href="${cardUrl}&action=save" style="font-size:14px;font-weight:600;color:${colors.ocean};text-decoration:underline;">Save for later</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function cardSectionText(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const lines = [
    ` -  ${card.title}  - `,
    card.wish_i_knew,
    card.short_summary,
    card.what_to_do_now ? `What to do now: ${card.what_to_do_now}` : null,
    card.what_can_wait ? `Can wait: ${card.what_can_wait}` : null,
    `Open: ${siteUrl}/?card=${encodeURIComponent(card.slug)}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildSubject(input: LookaheadEmailInput): string {
  const { childName, cards, weekContext } = input;
  const anchor = cards.find(({ card }) => isWeeklyAnchorCard(card));
  const namePart = childName ? childName : "your little one";
  const weekPart = weekContext ? `${weekContext} with ${namePart}` : `Your week ahead with ${namePart}`;

  if (anchor) {
    return `${weekPart} — ${anchor.card.title}`;
  }

  const onlyFun =
    cards.length > 0 &&
    cards.every(({ card }) => card.card_type === "quiet_week" || card.card_type === "Fun First");
  if (onlyFun) {
    return `${weekPart} — a gentle one for the week`;
  }

  if (cards.length === 1) {
    return `${weekPart} — ${cards[0].card.title}`;
  }

  return `${weekPart} — ${cards.length} things worth knowing`;
}

export function renderLookaheadEmail(input: LookaheadEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { childName, cards, siteUrl, pauseUrl, weekContext } = input;
  const heading = weekContext
    ? `${weekContext}${childName ? ` with ${childName}` : ""}`
    : childName
      ? `Your week ahead with ${childName}`
      : "Your week ahead";
  const subject = buildSubject(input);
  const cardCountLabel =
    cards.length === 1 ? "1 thing worth knowing" : `${cards.length} things worth knowing`;

  const html = `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.cream};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.cream};">
    <tr><td align="center" style="padding:28px 14px 40px 14px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand header -->
        <tr><td style="padding:0 0 16px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.navy};border-radius:22px;overflow:hidden;">
            <tr><td style="padding:22px 24px 20px 24px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${colors.aqua};font-weight:700;">Wish I Knew</p>
              <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;color:${colors.cream};font-family:Georgia,'Times New Roman',serif;">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:rgba(255,246,230,0.78);">
                Your weekly Lookahead — everything useful is in this email.
              </p>
              <p style="margin:14px 0 0 0;display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(78,198,193,0.18);font-size:12px;font-weight:700;color:${colors.aqua};">
                ${escapeHtml(cardCountLabel)}
              </p>
            </td></tr>
            <tr><td style="height:6px;background:linear-gradient(90deg, ${colors.ocean}, ${colors.aqua}, ${colors.sand});font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding:0 6px 18px 6px;">
          <p style="margin:0;font-size:14px;line-height:1.65;color:${colors.muted};">
            No app hop required. Open a card only if it helps this week.
          </p>
        </td></tr>

        <!-- Cards -->
        <tr><td>
          ${cards.map((item) => cardSectionHtml(item, siteUrl)).join("")}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:8px 6px 0 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.white};border-radius:18px;border:1px solid ${colors.border};">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0;font-size:13px;line-height:1.65;color:${colors.muted};">
                You chose one calm email a week. Life busy?
                <a href="${pauseUrl}" style="color:${colors.ocean};font-weight:600;">Pause these emails</a>
                anytime — your account and timeline stay put. Turn them back on in Settings whenever you like.
              </p>
              <p style="margin:14px 0 0 0;font-size:11px;line-height:1.6;color:#9aa1ad;">
                Practical guidance for Australian parents, not medical advice.
                <a href="${siteUrl}/privacy" style="color:${colors.ocean};">Privacy</a> ·
                <a href="${siteUrl}/terms" style="color:${colors.ocean};">Terms</a> ·
                <a href="${siteUrl}/disclaimer" style="color:${colors.ocean};">Disclaimer</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    "Wish I Knew",
    heading,
    cardCountLabel,
    "",
    ...cards.map((item) => cardSectionText(item, siteUrl)),
    "",
    `Pause these emails (your account stays): ${pauseUrl}`,
  ].join("\n\n");

  return { subject, html, text };
}

export function buildWeekContextLabel(input: {
  isBorn: boolean;
  pregnancyWeek?: number | null;
  babyWeek?: number | null;
}): string | null {
  if (input.isBorn && input.babyWeek) {
    return `Baby week ${input.babyWeek}`;
  }

  if (!input.isBorn && input.pregnancyWeek) {
    return `Pregnancy week ${input.pregnancyWeek}`;
  }

  return null;
}
