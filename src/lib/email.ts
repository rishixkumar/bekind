import { SITE_NAME } from "@/lib/constants";

/**
 * Resend's REST API, called directly so BK doesn't take on an SDK dependency
 * for one endpoint. Without RESEND_API_KEY there is no provider to fail, so the
 * mail goes to the server console instead — that keeps signup completable on a
 * preview deployment, where NODE_ENV is "production" but no key is configured.
 * Once a key exists this path is unreachable, so real codes never get logged.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Resend's shared sender works with no DNS setup; override once a domain is verified. */
const DEFAULT_FROM = `${SITE_NAME} <onboarding@resend.dev>`;

export type SendResult = { ok: true } | { ok: false; reason: string };

type Mail = {
  to: string;
  subject: string;
  text: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail({ to, subject, text }: Mail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info(
      `\n[${SITE_NAME} email — printed to the console because RESEND_API_KEY is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`,
    );
    return { ok: true };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [to],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`Resend rejected the send (${response.status}): ${detail}`);
      return { ok: false, reason: `Email provider returned ${response.status}.` };
    }

    return { ok: true };
  } catch (error) {
    console.error("Could not reach the email provider.", error);
    return { ok: false, reason: "Could not reach the email provider." };
  }
}

export function verificationEmail(code: string, minutes: number): Omit<Mail, "to"> {
  return {
    subject: `Your ${SITE_NAME} code is ${code}`,
    text: [
      `Your ${SITE_NAME} verification code is ${code}.`,
      "",
      `It expires in ${minutes} minutes. Enter it on the verification page to finish setting up your account.`,
      "",
      `If you didn't sign up for ${SITE_NAME}, you can ignore this — nothing happens without the code.`,
    ].join("\n"),
  };
}
