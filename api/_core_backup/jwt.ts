import jwt from 'jsonwebtoken.js';
import { ENV } from './env.js';

export interface JWTPayload {
  id: number;
  username?: string | null;
  name?: string | null;
  role: string;
}

export function sign(payload: JWTPayload): string {
  return jwt.sign(payload, ENV.cookieSecret, {
    expiresIn: "7d",
  });
}

export function verify(token: string): JWTPayload {
  return jwt.verify(token, ENV.cookieSecret) as JWTPayload;
}
