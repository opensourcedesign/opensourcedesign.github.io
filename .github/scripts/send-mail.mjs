#!/usr/bin/env node
/**
 * Send SMTP mail without logging the recipient address.
 *
 * Env:
 *   MAIL_TO_FILE     Path to a file containing the recipient email (mode 0600).
 *   MAIL_SUBJECT     Subject line.
 *   MAIL_BODY        Plain-text body (optional if MAIL_HTML is set).
 *   MAIL_HTML        HTML body (optional if MAIL_BODY is set).
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readRecipientFile(filePath) {
  if (!filePath) throw new Error('MAIL_TO_FILE is required');
  const email = fs.readFileSync(filePath, 'utf8').trim();
  if (!EMAIL_RE.test(email)) throw new Error('Invalid recipient in MAIL_TO_FILE');
  return email;
}

export function smtpConfigFromEnv() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !user || !pass || !from) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM are required');
  }
  return {
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user,
    pass,
    from,
  };
}

export async function sendMail({ toFile, subject, text, html, smtp }) {
  const to = readRecipientFile(toFile);
  const cfg = smtp || smtpConfigFromEnv();
  if (!subject) throw new Error('MAIL_SUBJECT is required');
  if (!text && !html) throw new Error('MAIL_BODY or MAIL_HTML is required');

  const { default: nodemailer } = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transport.sendMail({
    from: `Open Source Design <${cfg.from}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  });
}

async function main() {
  await sendMail({
    toFile: process.env.MAIL_TO_FILE,
    subject: process.env.MAIL_SUBJECT,
    text: process.env.MAIL_BODY || '',
    html: process.env.MAIL_HTML || '',
  });
  console.log('Notification email sent.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
