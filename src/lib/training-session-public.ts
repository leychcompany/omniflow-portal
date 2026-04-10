/** Session statuses where self-service signup is not allowed (portal). */
const SIGNUP_BLOCKED_STATUSES = new Set(["full", "closed", "cancelled"]);

export function isTrainingSessionSignupBlockedByStatus(status: string): boolean {
  return SIGNUP_BLOCKED_STATUSES.has(String(status).toLowerCase());
}

export function isTrainingRegistrationWindowClosed(
  registrationClosesAt: string | null | undefined
): boolean {
  if (!registrationClosesAt?.trim()) return false;
  return new Date(registrationClosesAt).getTime() <= Date.now();
}

/** True when the learner should not be able to sign up or join the waitlist. */
export function trainingSessionCannotSelfServeSignup(
  status: string,
  registrationClosesAt: string | null | undefined
): boolean {
  return (
    isTrainingSessionSignupBlockedByStatus(status) ||
    isTrainingRegistrationWindowClosed(registrationClosesAt)
  );
}

/** Short label for badges on the customer portal. */
export function publicTrainingSessionStatusLabel(status: string): string {
  switch (String(status).toLowerCase()) {
    case "full":
      return "Full";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
    case "open":
      return "Open";
    default:
      return status;
  }
}
