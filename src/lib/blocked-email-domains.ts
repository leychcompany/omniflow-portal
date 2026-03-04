/**
 * Blocklist of free/personal email domains.
 * Only company emails are allowed for self-registration.
 */
export const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.de",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "aol.com",
  "zoho.com",
  "mail.ru",
  "yandex.com",
  "yandex.ru",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "tutanota.de",
  "hey.com",
  "outlook.fr",
  "outlook.de",
  "outlook.es",
  "outlook.it",
  "outlook.jp",
  "outlook.kr",
  "outlook.in",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "rediffmail.com",
  "web.de",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "libero.it",
  "virgilio.it",
  "seznam.cz",
  "wp.pl",
  "o2.pl",
  "terra.com.br",
  "uol.com.br",
  "bol.com.br",
  "ig.com.br",
] as const;

const blockedSet = new Set<string>(BLOCKED_EMAIL_DOMAINS);

/**
 * Extracts the domain from an email and checks if it's in the blocklist.
 */
export function isBlockedEmailDomain(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) return false;
  const domain = trimmed.slice(atIndex + 1);
  return blockedSet.has(domain);
}

/**
 * Returns the user-facing error message for blocked domains.
 */
export function getBlockedDomainsMessage(): string {
  return "Please use your company email address.";
}
