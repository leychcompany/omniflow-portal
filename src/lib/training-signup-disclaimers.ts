/**
 * Shown on class signup / waitlist and in post-signup attendee emails (single source of truth).
 */
export const TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS = [
  "Do not book travel until you are notified that the class is confirmed as we have a minimum requirement.",
  "Once you are notified that class is confirmed, we ask that you send purchase order for processing or call with credit card information.",
  "Please bring your company laptop including installed software OMNICom (3000/6000) and/or OMNIConnect (4000/7000). All other training materials will be provided for you.",
] as const;

/** Plain-text block for transactional emails */
export function trainingSignupDisclaimerEmailBlock(): string {
  return [
    "Important:",
    "",
    ...TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS.map((p) => `• ${p}`),
  ].join("\n");
}
