type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends via the Resend REST API. No SDK dependency needed.
 * TODO: set up SPF/DKIM on the sending domain before real users receive these.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WIK_FROM_EMAIL;

  if (!apiKey) return { error: "RESEND_API_KEY is not configured." };
  if (!from) return { error: "WIK_FROM_EMAIL is not configured." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { error: `Resend responded ${response.status}: ${body.slice(0, 300)}` };
  }

  return {};
}
