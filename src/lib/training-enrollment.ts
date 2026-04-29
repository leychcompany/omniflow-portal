import { z } from "zod";

import {
  formatTrainingScheduleEmailBlock,
  type TrainingSessionDay,
} from "@/lib/format-training-session-schedule";

/** Body for POST /api/training/sessions/[id]/register (portal self-serve). */
export const trainingEnrollmentBodySchema = z.object({
  certificate_company_name: z.string().trim().min(1).max(500),
  work_title: z.string().trim().min(1).max(200),
  first_name: z.string().trim().min(1).max(200),
  last_name: z.string().trim().min(1).max(200),
  company_address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(200),
  state_province: z.string().trim().min(1).max(200),
  postal_code: z.string().trim().min(1).max(50),
  country: z.string().trim().min(1).max(200),
  contact_email: z.string().trim().email().max(320),
  contact_phone: z.string().trim().min(1).max(80),
  food_restrictions: z.string().max(2000).optional().default("").transform((s) => s.trim()),
});

export type TrainingEnrollmentBody = z.infer<typeof trainingEnrollmentBodySchema>;

export function trainingEnrollmentRow(e: TrainingEnrollmentBody) {
  return {
    certificate_company_name: e.certificate_company_name,
    work_title: e.work_title,
    first_name: e.first_name,
    last_name: e.last_name,
    company_address: e.company_address,
    city: e.city,
    state_province: e.state_province,
    postal_code: e.postal_code,
    country: e.country,
    contact_email: e.contact_email,
    contact_phone: e.contact_phone,
    food_restrictions: e.food_restrictions || null,
  };
}

export type EnrollmentScheduleContext = {
  days: ReadonlyArray<TrainingSessionDay>;
  timezone: string;
};

/**
 * Plain-text block for internal / management emails.
 *
 * Fields are separated with blank lines (two newlines) rather than single
 * newlines. Some clients — notably Gmail — reflow consecutive short lines
 * of plain text into a single visual line; paragraph breaks prevent that.
 */
export function formatEnrollmentDetailsPlainText(
  e: TrainingEnrollmentBody,
  schedule?: EnrollmentScheduleContext
): string {
  const food = e.food_restrictions?.trim() ? e.food_restrictions.trim() : "None stated";
  const lines: string[] = [];

  if (schedule) {
    lines.push(formatTrainingScheduleEmailBlock(schedule.days, schedule.timezone));
  }

  lines.push(
    `Company name (certificate): ${e.certificate_company_name}`,
    `Work title: ${e.work_title}`,
    `First name: ${e.first_name}`,
    `Last name: ${e.last_name}`,
    `Company address: ${e.company_address}`,
    `City: ${e.city}`,
    `State/Province: ${e.state_province}`,
    `Postal code: ${e.postal_code}`,
    `Country: ${e.country}`,
    `E-mail: ${e.contact_email}`,
    `Phone: ${e.contact_phone}`,
    `Food restrictions / allergies: ${food}`
  );

  return lines.join("\n\n");
}
