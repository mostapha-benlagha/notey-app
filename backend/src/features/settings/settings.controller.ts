import type { Request, Response } from 'express';
import { SettingsModel } from '../../models/settings.model.js';
import { updateSettingsSchema, verifyAuthenticatorSetupSchema } from '../../schemas/settings.schema.js';
import { serializeSettings } from '../../services/settings.service.js';
import { buildOtpAuthUrl, generateAuthenticatorSecret, verifyAuthenticatorCode } from '../../services/two-factor.service.js';
import { ensureUserSettings } from '../../services/user-settings.service.js';

export async function getSettings(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const settings = await ensureUserSettings(request.user._id);

  response.json({
    ok: true,
    settings: serializeSettings(settings),
  });
}

export async function updateSettings(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const payload = updateSettingsSchema.parse(request.body);

  const existingSettings = await ensureUserSettings(request.user._id);
  const nextTwoFactorEnabled = payload.twoFactorEnabled ?? existingSettings.twoFactorEnabled;
  const nextTwoFactorMethod = payload.twoFactorMethod ?? existingSettings.twoFactorMethod ?? 'email';

  if (nextTwoFactorEnabled && nextTwoFactorMethod === 'authenticator') {
    const secret = existingSettings.authenticatorSecret;

    if (!secret) {
      const error = new Error('Set up your authenticator app before enabling authenticator-based 2FA.') as Error & {
        statusCode?: number;
        code?: string;
      };
      error.statusCode = 409;
      error.code = 'AUTHENTICATOR_SETUP_REQUIRED';
      throw error;
    }
  }

  const settings = await SettingsModel.findOneAndUpdate(
    { userId: request.user._id },
    { $set: payload, $setOnInsert: { userId: request.user._id } },
    { new: true, upsert: true }
  ).lean();

  response.json({
    ok: true,
    settings: serializeSettings(settings),
  });
}

export async function createAuthenticatorSetup(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const settings = await ensureUserSettings(request.user._id);
  const secret = generateAuthenticatorSecret();

  await SettingsModel.updateOne(
    { userId: request.user._id },
    {
      $set: {
        authenticatorPendingSecret: secret,
      },
    }
  );

  response.json({
    ok: true,
    setup: {
      manualEntryKey: secret,
      otpAuthUrl: buildOtpAuthUrl(request.user.email, secret),
      settings: serializeSettings(settings),
    },
  });
}

export async function verifyAuthenticatorSetup(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const payload = verifyAuthenticatorSetupSchema.parse(request.body);
  const settings = await ensureUserSettings(request.user._id);

  if (!settings.authenticatorPendingSecret) {
    const error = new Error('Start authenticator setup before verifying a code.') as Error & {
      statusCode?: number;
      code?: string;
    };
    error.statusCode = 409;
    error.code = 'AUTHENTICATOR_SETUP_NOT_STARTED';
    throw error;
  }

  if (!verifyAuthenticatorCode(settings.authenticatorPendingSecret, payload.code)) {
    const error = new Error('That authenticator code is incorrect.') as Error & {
      statusCode?: number;
      code?: string;
    };
    error.statusCode = 401;
    error.code = 'INVALID_AUTHENTICATOR_CODE';
    throw error;
  }

  const updatedSettings = await SettingsModel.findOneAndUpdate(
    { userId: request.user._id },
    {
      $set: {
        authenticatorSecret: settings.authenticatorPendingSecret,
        authenticatorPendingSecret: undefined,
        twoFactorMethod: 'authenticator',
        twoFactorEnabled: true,
      },
    },
    { new: true, upsert: true }
  ).lean();

  response.json({
    ok: true,
    settings: serializeSettings(updatedSettings),
  });
}
