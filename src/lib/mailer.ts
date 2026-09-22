import "server-only";
import nodemailer from "nodemailer";
import { site } from "./site";

// Reads SMTP settings from the environment. Works with any SMTP provider
// (Gmail app password, SendGrid, Mailgun, Postmark, Resend's SMTP endpoint,
// Mailtrap for local testing, etc.) — nothing here is provider-specific.
//
//   SMTP_HOST      e.g. smtp.gmail.com / smtp.sendgrid.net / sandbox.smtp.mailtrap.io
//   SMTP_PORT      e.g. 587 (STARTTLS) or 465 (implicit TLS)
//   SMTP_SECURE    "true" for port 465, otherwise leave unset/"false"
//   SMTP_USER      SMTP username
//   SMTP_PASS      SMTP password / API key
//   SMTP_FROM      "Name <address@domain>" used as the From header (falls back to SMTP_USER)
//   SUPPORT_EMAIL  where help-center reports are delivered (falls back to site.email)

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[mailer] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS are not fully set — emails will be logged, not sent.",
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const FROM = () => process.env.SMTP_FROM || process.env.SMTP_USER || `"${site.name}" <no-reply@example.com>`;
const SUPPORT_TO = () => process.env.SUPPORT_EMAIL || site.email;

async function send(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
  const t = getTransporter();
  if (!t) {
    // No SMTP configured — don't crash the request, just log so local/dev use still works.
    console.info("[mailer] (not sent, SMTP unconfigured)", { to: opts.to, subject: opts.subject });
    return { sent: false as const };
  }
  await t.sendMail({ from: FROM(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html, replyTo: opts.replyTo });
  return { sent: true as const };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendHelpReportEmail(report: {
  ticketId: string;
  receivedAt?: string;
  name: string;
  email: string;
  category: string;
  page: string;
  severity: string;
  description: string;
  diagnostics: Record<string, string> | null;
}) {
  const lines = [
    `Ticket: ${report.ticketId}`,
    ...(report.receivedAt ? [`Received: ${report.receivedAt}`] : []),
    `From: ${report.name} <${report.email}>`,
    `Category: ${report.category}`,
    `Page: ${report.page}`,
    `Severity: ${report.severity}`,
    "",
    report.description,
  ];
  if (report.diagnostics) {
    lines.push("", "Diagnostics:", ...Object.entries(report.diagnostics).map(([k, v]) => `  ${k}: ${v}`));
  }

  return send({
    to: SUPPORT_TO(),
    replyTo: report.email,
    subject: `[${site.name} help center] ${report.category} (${report.severity}) — ${report.ticketId}`,
    text: lines.join("\n"),
    html: `<pre style="font:14px/1.5 monospace; white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  });
}

export async function sendOrderReceiptEmail(order: {
  id: string;
  email: string;
  items: { name: string; qty: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}) {
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const rows = order.items.map((i) => `  ${i.name} x${i.qty} — ${money(i.total)}`).join("\n");
  const text = [
    `Thanks for your order, ${order.id}!`,
    "",
    rows,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${order.shipping ? money(order.shipping) : "Free"}`,
    `Total: ${money(order.total)}`,
  ].join("\n");
  const htmlRows = order.items
    .map((i) => `<tr><td>${escapeHtml(i.name)} &times; ${i.qty}</td><td align="right">${money(i.total)}</td></tr>`)
    .join("");

  return send({
    to: order.email,
    subject: `Your ${site.name} order ${order.id}`,
    text,
    html: `
      <div style="font:15px/1.5 sans-serif">
        <p>Thanks for your order, <strong>${escapeHtml(order.id)}</strong>!</p>
        <table cellpadding="6" style="border-collapse:collapse; width:100%; max-width:420px">
          ${htmlRows}
          <tr><td>Subtotal</td><td align="right">${money(order.subtotal)}</td></tr>
          <tr><td>Shipping</td><td align="right">${order.shipping ? money(order.shipping) : "Free"}</td></tr>
          <tr style="font-weight:700"><td>Total</td><td align="right">${money(order.total)}</td></tr>
        </table>
      </div>`,
  });
}
