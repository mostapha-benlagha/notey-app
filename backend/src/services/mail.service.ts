import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
const brandIconUrl = `${env.CLIENT_URL}/icons/notey-app-icon.png`;
const brandLogoUrl = `${env.CLIENT_URL}/icons/notey-logo-with-name.svg`;

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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderEmailShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  helpText: string;
}) {
  return `
    <div style="margin:0;background:#eef4fb;padding:32px 16px;font-family:Arial,sans-serif;color:#162033;">
      <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:28px;background:#ffffff;box-shadow:0 20px 50px rgba(22,32,51,0.12);">
        <div style="background:linear-gradient(135deg,#0f4f9f 0%,#1663c7 55%,#3e8cff 100%);padding:28px 28px 72px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="${brandIconUrl}" alt="Notey icon" width="52" height="52" style="display:block;border-radius:18px;background:rgba(255,255,255,0.16);padding:8px;" />
            <img src="${brandLogoUrl}" alt="Notey" height="30" style="display:block;max-width:180px;" />
          </div>
          <div style="margin-top:28px;display:inline-block;border-radius:999px;background:rgba(255,255,255,0.14);padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#dceaff;">
            ${escapeHtml(input.eyebrow)}
          </div>
          <h1 style="margin:18px 0 0;font-size:32px;line-height:1.15;font-weight:800;color:#ffffff;">
            ${escapeHtml(input.title)}
          </h1>
          <p style="margin:16px 0 0;max-width:470px;font-size:16px;line-height:1.8;color:rgba(255,255,255,0.88);">
            ${escapeHtml(input.intro)}
          </p>
        </div>
        <div style="margin-top:-44px;padding:0 28px 28px;">
          <div style="border-radius:28px;background:#ffffff;padding:28px;box-shadow:0 14px 34px rgba(22,32,51,0.09);">
            ${input.bodyHtml}
          </div>
          <div style="margin-top:18px;border-radius:24px;background:#f5f8fc;padding:18px 20px;">
            <p style="margin:0;font-size:13px;line-height:1.8;color:#5b667a;">
              ${escapeHtml(input.helpText)}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderButton(label: string, href: string) {
  return `
    <a
      href="${href}"
      style="display:inline-block;border-radius:16px;background:#1663c7;padding:14px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function renderCopyFriendlyBlock(label: string, value: string) {
  return `
    <div style="margin-top:22px;border-radius:20px;border:1px solid #d9e4f3;background:#f8fbff;padding:18px;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#5b667a;">
        ${escapeHtml(label)}
      </p>
      <p style="margin:0;word-break:break-word;font-size:14px;line-height:1.8;color:#162033;font-family:'Courier New',monospace;">
        ${escapeHtml(value)}
      </p>
      <p style="margin:10px 0 0;font-size:12px;line-height:1.7;color:#6a778d;">
        Most email clients do not allow real clipboard buttons, so this section is formatted to be easy to copy or long-press.
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
      eyebrow: 'Email verification',
      title: 'Finish setting up your Notey workspace',
      intro: `Hi ${input.firstName}, you are one step away from using Notey fully. Verify your email to activate your workspace and keep your account secure.`,
      bodyHtml: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.9;color:#314056;">
          Once verified, you can return to Notey and continue capturing ideas, building project context, and organizing action items without interruption.
        </p>
        ${renderButton('Verify email', input.verificationUrl)}
        <div style="margin-top:24px;border-radius:22px;background:#0f172a;padding:18px 20px;">
          <p style="margin:0;font-size:13px;line-height:1.8;color:rgba(255,255,255,0.82);">
            This verification link stays active for <strong style="color:#ffffff;">24 hours</strong>.
          </p>
        </div>
        ${renderCopyFriendlyBlock('Verification link', input.verificationUrl)}
      `,
      helpText:
        'If you did not sign up for Notey, you can ignore this email. No changes will be made unless the link is opened and confirmed.',
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
      eyebrow: 'Secure sign-in',
      title: 'Your Notey verification code is ready',
      intro: `Hi ${input.firstName}, use the code below to finish your login. This extra step helps protect your workspace when two-factor authentication is turned on.`,
      bodyHtml: `
        <div style="border-radius:28px;background:linear-gradient(135deg,#f4f8ff 0%,#ebf3ff 100%);padding:24px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#5b667a;">
            Verification code
          </p>
          <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:0.32em;color:#0f4f9f;">
            ${escapeHtml(groupedCode)}
          </p>
        </div>
        <p style="margin:20px 0 0;font-size:14px;line-height:1.9;color:#314056;">
          Enter this code in Notey to finish signing in. For your security, it expires in <strong>${input.expiresInMinutes} minutes</strong>.
        </p>
        ${renderCopyFriendlyBlock('Verification code', input.code)}
      `,
      helpText:
        'If this login was not you, do not share the code. Change your password and review your security settings after signing in.',
    }),
  });

  return true;
}
