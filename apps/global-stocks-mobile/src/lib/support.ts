/** Public contact address. Never include account tokens or private business data in support links. */
export const SUPPORT_EMAIL = "support.globalstock@gmail.com";

export function supportEmailUrl(subject = "Ayuda con Global Stock") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
