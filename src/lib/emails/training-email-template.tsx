/**
 * Reusable React Email layout for all training transactional emails.
 * Brand: OMNI Flow blue (#1d4ed8) with clean whites and greys.
 */
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BLUE = "#1d4ed8";
const BLACK = "#000000";
const BLUE_LIGHT = "#eff6ff";
const GREY_BG = "#f4f4f5";
const GREY_BORDER = "#e4e4e7";
const GREY_TEXT = "#52525b";
const TEXT = "#18181b";

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  body: {
    backgroundColor: GREY_BG,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: 0,
  } as React.CSSProperties,
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 16px",
  } as React.CSSProperties,
  header: {
    backgroundColor: BLACK,
    borderRadius: "8px 8px 0 0",
    padding: "20px 32px",
    textAlign: "center" as const,
  } as React.CSSProperties,
  headerLogo: {
    display: "block",
    margin: "0 auto",
    width: "auto",
    height: "50px",
  } as React.CSSProperties,
  card: {
    backgroundColor: "#ffffff",
    borderLeft: `1px solid ${GREY_BORDER}`,
    borderRight: `1px solid ${GREY_BORDER}`,
    borderBottom: `1px solid ${GREY_BORDER}`,
    borderRadius: "0 0 8px 8px",
    padding: "32px",
  } as React.CSSProperties,
  greeting: {
    color: TEXT,
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  lead: {
    color: TEXT,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 24px",
  } as React.CSSProperties,
  classBox: {
    backgroundColor: BLUE_LIGHT,
    borderLeft: `4px solid ${BLUE}`,
    borderRadius: "4px",
    padding: "16px 20px",
    marginBottom: "24px",
  } as React.CSSProperties,
  classTitle: {
    color: BLUE,
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 12px",
    lineHeight: "22px",
  } as React.CSSProperties,
  ctaButton: {
    display: "inline-block",
    backgroundColor: BLUE,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    marginTop: "12px",
  } as React.CSSProperties,
  hr: {
    borderColor: GREY_BORDER,
    margin: "24px 0",
  } as React.CSSProperties,
  importantHeading: {
    color: TEXT,
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 10px",
  } as React.CSSProperties,
  bulletRow: {
    display: "flex",
    marginBottom: "8px",
    fontSize: "13px",
    lineHeight: "19px",
    color: GREY_TEXT,
  } as React.CSSProperties,
  bulletDot: {
    color: BLUE,
    fontWeight: "700",
    width: "16px",
    flexShrink: 0,
  } as React.CSSProperties,
  footer: {
    textAlign: "center" as const,
    marginTop: "24px",
    color: GREY_TEXT,
    fontSize: "12px",
    lineHeight: "18px",
  } as React.CSSProperties,
  closeText: {
    color: GREY_TEXT,
    fontSize: "14px",
    margin: "0",
  } as React.CSSProperties,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  color: GREY_TEXT,
  margin: "0 0 4px",
};

const sectionValue: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "21px",
  color: TEXT,
  margin: 0,
};

export function ClassInfoBox({
  title,
  scheduleLines,
  location,
  ctaUrl,
}: {
  title: string;
  scheduleLines: string[];
  location: string;
  ctaUrl: string;
}) {
  return (
    <div style={styles.classBox}>
      <div style={styles.classTitle}>{title}</div>

      {/* When */}
      <div style={{ marginBottom: "12px" }}>
        <div style={sectionLabel}>When</div>
        {scheduleLines.map((line, idx) => (
          <div key={idx} style={sectionValue}>{line}</div>
        ))}
      </div>

      {/* Where */}
      <div style={{ marginBottom: "16px" }}>
        <div style={sectionLabel}>Where</div>
        <div style={sectionValue}>{location || "TBA"}</div>
      </div>

      <Link href={ctaUrl} style={styles.ctaButton}>
        View class details →
      </Link>
    </div>
  );
}

export function ImportantNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <>
      <Hr style={styles.hr} />
      <div style={styles.importantHeading}>Important</div>
      {notes.map((note, idx) => (
        <div key={idx} style={styles.bulletRow}>
          <span style={styles.bulletDot}>•</span>
          <span>{note}</span>
        </div>
      ))}
    </>
  );
}

// ─── Main layout wrapper ──────────────────────────────────────────────────────

export function TrainingEmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const logoSrc = `${appBaseUrl}/training-email-logo.png`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header bar */}
          <div style={styles.header}>
            <Img
              src={logoSrc}
              alt="Omni"
              height="50"
              style={styles.headerLogo}
            />
          </div>

          {/* Content card */}
          <div style={styles.card}>{children}</div>

          {/* Footer */}
          <div style={styles.footer}>
            <Text style={{ margin: 0, fontSize: "12px", color: GREY_TEXT }}>
              Omni Flow Computers, Inc. · This email was sent to you because you
              signed up for a training class.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Exported style helpers (used in individual templates) ───────────────────
export { styles as emailStyles };
