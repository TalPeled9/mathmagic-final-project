import { OAuth2Client } from 'google-auth-library';
import { config } from './index';

export const googleOAuthClient = new OAuth2Client(config.google.clientId);
