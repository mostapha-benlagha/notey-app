import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);

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
      'Verify your email to access your Notey workspace:',
      input.verificationUrl,
      '',
      'This link expires in 24 hours.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #162033;">
        <p>Hi ${input.firstName},</p>
        <p>Verify your email to access your Notey workspace.</p>
        <p>
          <a
            href="${input.verificationUrl}"
            style="display:inline-block;padding:12px 18px;border-radius:12px;background:#1663c7;color:#ffffff;text-decoration:none;font-weight:600;"
          >
            Verify email
          </a>
        </p>
        <p style="font-size:14px;color:#5b667a;">This link expires in 24 hours.</p>
        <p style="font-size:14px;color:#5b667a;">If the button does not work, use this link:</p>
        <p><a href="${input.verificationUrl}">${input.verificationUrl}</a></p>
      </div>
    `,
  });

  return true;
}
