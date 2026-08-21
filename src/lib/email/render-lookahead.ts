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
  creamDeep: "#F6E7C8",
  white: "#FFFFFF",
  ink: "#172033",
  muted: "#697386",
  gum: "#6FAF8E",
  sand: "#F4D6A0",
  sun: "#FFC857",
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

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1);
  const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("."), slice.lastIndexOf(","));
  const cut = breakAt > max * 0.55 ? slice.slice(0, breakAt) : slice;
  return `${cut.trimEnd()}…`;
}

function typeAccent(isAnchor: boolean, isQuietWeek: boolean): string {
  if (isAnchor) return colors.ocean;
  if (isQuietWeek) return colors.gum;
  return colors.aqua;
}

function typeLabel(card: MatchedCard["card"]): string {
  if (isWeeklyAnchorCard(card)) return "This week with bub";
  if (card.card_type === "quiet_week") return "Easy win";
  return card.card_type;
}

function cardUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/$/, "")}/?card=${encodeURIComponent(slug)}`;
}

function timelineUrl(siteUrl: string): string {
  return siteUrl.replace(/\/$/, "");
}

function pickFeatured(cards: MatchedCard[]): MatchedCard | null {
  return cards.find(({ card }) => isWeeklyAnchorCard(card)) ?? cards[0] ?? null;
}

function primaryCta(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:999px;background:${colors.sun};box-shadow:0 4px 0 ${colors.creamDeep};">
          <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:800;letter-spacing:0.02em;color:${colors.navy};text-decoration:none;">
            ${escapeHtml(label)} →
          </a>
        </td>
      </tr>
    </table>`;
}

function secondaryLink(href: string, label: string): string {
  return `<a href="${href}" style="font-size:14px;font-weight:700;color:${colors.ocean};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

function featuredWindowHtml(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const href = cardUrl(siteUrl, card.slug);
  const imageUrl = absoluteAssetUrl(siteUrl, card.image_url || card.thumbnail_url);
  const imageAlt = card.image_alt || card.title;
  const hook = truncate(card.wish_i_knew || card.short_summary || "", 140);
  const accent = typeAccent(isWeeklyAnchorCard(card), card.card_type === "quiet_week");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:${colors.white};border-radius:22px;border:1px solid ${colors.border};overflow:hidden;">
      <tr>
        <td style="padding:10px 14px 0 14px;background:${colors.creamSoft};">
          <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:800;">
            A peek at this week
          </p>
        </td>
      </tr>
      ${
        imageUrl
          ? `<tr>
              <td align="center" style="padding:14px 18px 0 18px;background:${colors.creamSoft};">
                <a href="${href}" style="text-decoration:none;">
                  <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" width="220" style="display:block;width:220px;max-width:100%;height:auto;border-radius:20px;border:2px solid ${colors.white};box-shadow:0 8px 24px rgba(13,27,42,0.12);background:${colors.white};" />
                </a>
              </td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding:18px 22px 22px 22px;background:${colors.white};">
          <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${accent};font-weight:700;">
            ${escapeHtml(typeLabel(card))}
          </p>
          <h2 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:${colors.navy};font-family:Georgia,'Times New Roman',serif;">
            <a href="${href}" style="color:${colors.navy};text-decoration:none;">${escapeHtml(card.title)}</a>
          </h2>
          ${
            card.subtitle
              ? `<p style="margin:6px 0 0 0;font-size:14px;color:${colors.muted};">${escapeHtml(card.subtitle)}</p>`
              : ""
          }
          ${
            hook
              ? `<p style="margin:14px 0 0 0;font-size:15px;line-height:1.65;color:${colors.ink};">${escapeHtml(hook)}</p>`
              : ""
          }
          <p style="margin:16px 0 0 0;">
            ${secondaryLink(href, "Open the full card in the app")}
          </p>
        </td>
      </tr>
    </table>`;
}

function glanceRowHtml(item: MatchedCard, index: number, siteUrl: string): string {
  const { card } = item;
  const href = cardUrl(siteUrl, card.slug);
  const isQuietWeek = card.card_type === "quiet_week";
  const isAnchor = isWeeklyAnchorCard(card);
  const accent = typeAccent(isAnchor, isQuietWeek);
  const blurb = truncate(card.short_summary || card.wish_i_knew || "", 72);

  return `
    <tr>
      <td style="padding:12px 0;${index === 0 ? "" : `border-top:1px solid ${colors.border};`}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top" width="28" style="padding-top:2px;">
              <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:999px;background:${colors.softSky};color:${colors.ocean};font-size:12px;font-weight:800;">
                ${index + 1}
              </span>
            </td>
            <td valign="top" style="padding-left:10px;">
              <p style="margin:0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${accent};font-weight:700;">
                ${escapeHtml(typeLabel(card))}
              </p>
              <p style="margin:4px 0 0 0;font-size:15px;line-height:1.35;font-weight:700;color:${colors.navy};">
                <a href="${href}" style="color:${colors.navy};text-decoration:none;">${escapeHtml(card.title)}</a>
              </p>
              ${
                blurb
                  ? `<p style="margin:4px 0 0 0;font-size:13px;line-height:1.5;color:${colors.muted};">${escapeHtml(blurb)}</p>`
                  : ""
              }
            </td>
            <td valign="middle" align="right" width="56" style="padding-left:8px;">
              <a href="${href}" style="font-size:13px;font-weight:800;color:${colors.ocean};text-decoration:none;">Open</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function glanceSummaryHtml(cards: MatchedCard[], siteUrl: string): string {
  if (cards.length === 0) return "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:${colors.white};border-radius:22px;border:1px solid ${colors.border};">
      <tr>
        <td style="padding:18px 20px 8px 20px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${colors.ocean};font-weight:800;">
            Your cards this week
          </p>
          <p style="margin:6px 0 0 0;font-size:14px;line-height:1.5;color:${colors.muted};">
            A quick map — tap any one to open it in Wish I Knew.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 20px 16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${cards.map((item, index) => glanceRowHtml(item, index, siteUrl)).join("")}
          </table>
        </td>
      </tr>
    </table>`;
}

function teaserCardHtml(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  const href = cardUrl(siteUrl, card.slug);
  const isQuietWeek = card.card_type === "quiet_week";
  const isAnchor = isWeeklyAnchorCard(card);
  const accent = typeAccent(isAnchor, isQuietWeek);
  const imageUrl = absoluteAssetUrl(siteUrl, card.thumbnail_url || card.image_url);
  const imageAlt = card.image_alt || card.title;
  const hook = truncate(card.wish_i_knew || card.short_summary || "", 110);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;background:${colors.white};border-radius:18px;border:1px solid ${colors.border};overflow:hidden;">
      <tr>
        <td style="width:5px;background:${accent};font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:14px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${
                imageUrl
                  ? `<td valign="top" width="72" style="width:72px;padding-right:14px;">
                      <a href="${href}" style="text-decoration:none;">
                        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" width="64" style="display:block;width:64px;max-width:64px;height:auto;border-radius:14px;border:1px solid ${colors.border};background:${colors.creamSoft};" />
                      </a>
                    </td>`
                  : ""
              }
              <td valign="top">
                <p style="margin:0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${accent};font-weight:700;">
                  ${escapeHtml(typeLabel(card))}
                </p>
                <h3 style="margin:5px 0 0 0;font-size:17px;line-height:1.3;color:${colors.navy};font-family:Georgia,'Times New Roman',serif;">
                  <a href="${href}" style="color:${colors.navy};text-decoration:none;">${escapeHtml(card.title)}</a>
                </h3>
                ${
                  hook
                    ? `<p style="margin:6px 0 0 0;font-size:13px;line-height:1.55;color:${colors.muted};">${escapeHtml(hook)}</p>`
                    : ""
                }
                <p style="margin:10px 0 0 0;">
                  ${secondaryLink(href, "Continue in the app")}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function cardSectionText(item: MatchedCard, siteUrl: string): string {
  const { card } = item;
  return [
    `• ${card.title}`,
    truncate(card.wish_i_knew || card.short_summary || "", 120),
    `Open: ${cardUrl(siteUrl, card.slug)}`,
  ]
    .filter(Boolean)
    .join("\n");
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
    cards.length === 1 ? "1 card ready for you" : `${cards.length} cards ready for you`;
  const featured = pickFeatured(cards);
  const rest = featured ? cards.filter((item) => item.card.id !== featured.card.id) : cards;
  const openTimeline = timelineUrl(siteUrl);

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
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.navy};border-radius:24px;overflow:hidden;">
            <tr><td style="padding:24px 24px 8px 24px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${colors.aqua};font-weight:800;">Wish I Knew</p>
              <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;color:${colors.cream};font-family:Georgia,'Times New Roman',serif;">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:rgba(255,246,230,0.82);">
                A little window into what’s new — then hop into the app for the full story.
              </p>
            </td></tr>
            <tr><td style="padding:14px 24px 22px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:7px 12px;border-radius:999px;background:rgba(78,198,193,0.18);font-size:12px;font-weight:800;color:${colors.aqua};">
                      ${escapeHtml(cardCountLabel)}
                    </span>
                  </td>
                </tr>
                <tr><td style="padding-top:16px;">
                  ${primaryCta(openTimeline, "Open your timeline")}
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="height:6px;background:${colors.ocean};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="height:4px;background:${colors.aqua};font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td style="height:4px;background:${colors.sand};font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>

        <!-- Featured peek -->
        <tr><td>
          ${featured ? featuredWindowHtml(featured, siteUrl) : ""}
        </td></tr>

        <!-- At-a-glance summary -->
        <tr><td>
          ${glanceSummaryHtml(cards, siteUrl)}
        </td></tr>

        <!-- Extra teasers (non-featured) -->
        ${
          rest.length
            ? `<tr><td style="padding:0 2px 8px 2px;">
                <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${colors.muted};font-weight:800;">
                  More for this week
                </p>
                ${rest.map((item) => teaserCardHtml(item, siteUrl)).join("")}
              </td></tr>`
            : ""
        }

        <!-- Bottom CTA -->
        <tr><td style="padding:4px 0 20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.softSky};border-radius:22px;border:1px solid #d5e8f5;">
            <tr><td style="padding:22px 20px;text-align:center;">
              <p style="margin:0;font-size:16px;line-height:1.4;font-weight:700;color:${colors.navy};font-family:Georgia,'Times New Roman',serif;">
                Ready for the full week?
              </p>
              <p style="margin:8px 0 16px 0;font-size:14px;line-height:1.55;color:${colors.muted};">
                Checklists, saves, and the rest of your timeline live in the app.
              </p>
              ${primaryCta(openTimeline, "Jump into Wish I Knew")}
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 6px 0 6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.white};border-radius:18px;border:1px solid ${colors.border};">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0;font-size:13px;line-height:1.65;color:${colors.muted};">
                You chose one calm email a week. Life busy?
                <a href="${pauseUrl}" style="color:${colors.ocean};font-weight:600;">Pause these emails</a>
                anytime — your account and timeline stay put.
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
    "A little window into what’s new — open the app for the full story.",
    `Open your timeline: ${openTimeline}`,
    "",
    featured
      ? ["A peek at this week", featured.card.title, truncate(featured.card.wish_i_knew || "", 140)].join(
          "\n",
        )
      : null,
    "",
    "Your cards this week:",
    ...cards.map((item) => cardSectionText(item, siteUrl)),
    "",
    `Jump into Wish I Knew: ${openTimeline}`,
    "",
    `Pause these emails (your account stays): ${pauseUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n\n");

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
