import { NextResponse } from "next/server";
import { HELP_CATEGORIES, HELP_PAGES, HELP_SEVERITIES } from "@/lib/help";
import { sendHelpReportEmail } from "@/lib/mailer";

// Receives reports from the help-center modal and emails them (via nodemailer) to
// SUPPORT_EMAIL. Falls back to logging if SMTP isn't configured, so local dev still works.

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function deliver(report: {
  ticketId: string;
  receivedAt: string;
  name: string;
  email: string;
  category: string;
  page: string;
  severity: string;
  description: string;
  diagnostics: Record<string, string> | null;
}) {
  console.info("[help-center]", JSON.stringify(report));
  await sendHelpReportEmail(report);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Hidden field that real people leave empty.
  if (str(body.company, 100)) return NextResponse.json({ ticketId: "HC-RECEIVED" });

  const report = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    category: str(body.category, 80),
    page: str(body.page, 40),
    severity: str(body.severity, 20),
    description: str(body.description, 4000),
    diagnostics:
      body.diagnostics && typeof body.diagnostics === "object"
        ? Object.fromEntries(
            Object.entries(body.diagnostics as Record<string, unknown>)
              .slice(0, 12)
              .map(([k, v]) => [k.slice(0, 40), str(v, 400)]),
          )
        : null,
  };

  const errors: Record<string, string> = {};
  if (!report.name) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.email)) errors.email = "Enter a valid email address.";
  if (!(HELP_CATEGORIES as readonly string[]).includes(report.category)) errors.category = "Choose what kind of problem this is.";
  if (!(HELP_PAGES as readonly string[]).includes(report.page)) errors.page = "Choose where it happened.";
  if (!HELP_SEVERITIES.some((s) => s.value === report.severity)) errors.severity = "Tell us how much it affects you.";
  if (report.description.length < 10) errors.description = "Describe the problem in at least a sentence.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });
  }

  const ticketId = `HC-${Date.now().toString(36).toUpperCase()}`;
  await deliver({ ticketId, receivedAt: new Date().toISOString(), ...report });
  return NextResponse.json({ ticketId });
}
