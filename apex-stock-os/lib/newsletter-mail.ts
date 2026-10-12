/** Secure transactional sender for an explicitly opted-in feature newsletter.
 * Does not run until the owner configures a verified Resend domain and secret.
 * This module never reads all subscribers or schedules a background loop.
 */
export type NewsletterRecipient = { email: string; unsubscribeToken: string };

export function newsletterMailReady() {
  return Boolean(process.env.GLOBAL_STOCK_RESEND_API_KEY?.trim() &&
    process.env.GLOBAL_STOCK_NEWSLETTER_FROM?.trim());
}

export async function sendNewsletterUpdate({
  recipient, subject, body
}: {
  recipient: NewsletterRecipient;
  subject: string;
  body: string;
}) {
  const key = process.env.GLOBAL_STOCK_RESEND_API_KEY?.trim();
  const from = process.env.GLOBAL_STOCK_NEWSLETTER_FROM?.trim();
  if (!key || !from) throw new Error("NEWSLETTER_EMAIL_NOT_CONFIGURED");
  if (!/^\S+@\S+\.\S+$/.test(recipient.email) ||
      !/^[0-9a-f-]{36}$/i.test(recipient.unsubscribeToken) ||
      subject.length < 4 || subject.length > 120 ||
      body.length < 1 || body.length > 6000)
    throw new Error("INVALID_NEWSLETTER_MESSAGE");

  const host = process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://globalstocks.vercel.app";
  if (new URL(host).protocol !== "https:")
    throw new Error("NEWSLETTER_UNSAFE_ORIGIN");
  const unsubscribe = new URL("/api/newsletter/unsubscribe", host);
  unsubscribe.searchParams.set("token", recipient.unsubscribeToken);

  // Escape user-visible copy; recipients must never render arbitrary HTML.
  const escapeHtml = (text: string) => text.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch] || ch));

  const html = `<div style="font:15px/1.7 system-ui,sans-serif;max-width:610px;margin:auto;color:#16161a">
    <p style="font-weight:bold;color:#8F0000">GLOBAL STOCK</p>
    <h1 style="font-size:24px">${escapeHtml(subject)}</h1>
    <p style="white-space:pre-wrap">${escapeHtml(body)}</p>
    <hr style="border:0;border-top:1px solid #ddd;margin:30px 0">
    <p style="font-size:12px;color:#555">Recibís este correo porque elegiste recibir novedades de Global Stock.
    <a href="${unsubscribe.toString()}">Darte de baja gratis</a>.
    Soporte: support.globalstock@gmail.com.</p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(9000),
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [recipient.email],
      subject,
      html,
      reply_to: "support.globalstock@gmail.com",
      headers: {
        "List-Unsubscribe": "<" + unsubscribe.toString() + ">",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    })
  });
  if (!response.ok) throw new Error("NEWSLETTER_PROVIDER_ERROR");
  return true;
}
