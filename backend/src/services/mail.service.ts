import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
const driveLogoUrl = 'https://drive.google.com/uc?export=view&id=1E0RuweJagDoavI3esnOICMCB4BJZvwjD';

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

function renderTag(label: string) {
  return `
    <span style="display:inline-block;border-radius:999px;border:1px solid #d6e0ee;background:#f7faff;padding:6px 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5b667a;">
      ${escapeHtml(label)}
    </span>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderEmailShell(input: {
  title: string;
  intro?: string;
  tags: string[];
  bodyHtml: string;
  supportText: string;
}) {
  return `
    <div style="margin:0;padding:24px 16px;font-family:Arial,sans-serif;color:#162033;background:#ffffff;">
      <div style="margin:0 auto;max-width:560px;">
        <img src="${driveLogoUrl}" alt="Notey" style="display:block;max-width:180px;height:auto;margin:0 0 20px;" />
        <div style="margin:0 0 14px;display:flex;flex-wrap:wrap;gap:8px;">
          ${input.tags.map((tag) => renderTag(tag)).join('')}
        </div>
        <p style="margin:0 0 10px;font-size:22px;line-height:1.3;font-weight:700;color:#162033;">
          ${escapeHtml(input.title)}
        </p>
        ${
          input.intro
            ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#445065;">${escapeHtml(input.intro)}</p>`
            : ''
        }
        ${input.bodyHtml}
        <p style="margin:18px 0 0;font-size:12px;line-height:1.8;color:#6a778d;">
          ${escapeHtml(input.supportText)}
        </p>
      </div>
    </div>
  `;
}

function renderButton(label: string, href: string) {
  return `
    <a
      href="${href}"
      style="display:inline-block;border-radius:12px;background:#1663c7;padding:12px 18px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function renderCopyFriendlyBlock(label: string, value: string) {
  return `
    <div style="margin-top:14px;padding:12px 14px;border:1px solid #d9e4f3;background:#fafcff;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#5b667a;">
        ${escapeHtml(label)}
      </p>
      <p style="margin:0;word-break:break-word;font-size:14px;line-height:1.7;color:#162033;font-family:'Courier New',monospace;">
        ${escapeHtml(value)}
      </p>
    </div>
  `;
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  firstName: string;
  verificationUrl: string;
}) {
  if (!transporter || !env.SMTP_FROM) {
    logger.warn({ to: input.to }, 'SMTP is not configured. Verification email was not sent.');
    return false;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: 'Verify your Notey email',
    text: [
      `Hi ${input.firstName},`,
      '',
      'Welcome to Notey.',
      'Verify your email to unlock your workspace, notes, projects, and task extraction tools.',
      '',
      `Open this link to verify your email: ${input.verificationUrl}`,
      '',
      'This verification link expires in 24 hours.',
      'If you did not create this account, you can safely ignore this email.',
    ].join('\n'),
    html: renderEmailShell({
      title: 'Verify your email',
      intro: `Hi ${input.firstName}, confirm your email to finish setting up your Notey account.`,
      tags: ['Email verification', '24 hours'],
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#314056;">
          Use the button below to verify your address.
        </p>
        ${renderButton('Verify email', input.verificationUrl)}
        ${renderCopyFriendlyBlock('Verification link', input.verificationUrl)}
      `,
      supportText:
        'Need help? Contact support. If you did not sign up for Notey, you can ignore this email.',
    }),
  });

  return true;
}

export async function sendTwoFactorCodeEmail(input: {
  to: string;
  firstName: string;
  code: string;
  expiresInMinutes: number;
}) {
  if (!transporter || !env.SMTP_FROM) {
    logger.warn({ to: input.to, code: input.code }, 'SMTP is not configured. Two-factor code email was not sent.');
    return false;
  }

  const groupedCode = input.code.split('').join(' ');

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: 'Your Notey login code',
    text: [
      `Hi ${input.firstName},`,
      '',
      'Use this security code to finish logging in to Notey.',
      '',
      `Code: ${input.code}`,
      '',
      `This code expires in ${input.expiresInMinutes} minutes.`,
      'If you did not try to sign in, reset your password and review your account security.',
    ].join('\n'),
    html: renderEmailShell({
      title: 'Your login code',
      intro: `Hi ${input.firstName}, use this code to finish signing in to Notey.`,
      tags: ['2FA', `${input.expiresInMinutes} minutes`],
      bodyHtml: `
        <div style="padding:16px 0;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#5b667a;">
            Verification code
          </p>
          <p style="margin:0;font-size:30px;font-weight:800;letter-spacing:0.28em;color:#0f4f9f;">
            ${escapeHtml(groupedCode)}
          </p>
        </div>
        <p style="margin:14px 0 0;font-size:14px;line-height:1.8;color:#314056;">
          Enter this code in Notey to continue.
        </p>
        ${renderCopyFriendlyBlock('Verification code', input.code)}
      `,
      supportText:
        'Need help? Contact support. If this login was not you, do not share the code.',
    }),
  });

  return true;
}
