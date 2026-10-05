import { INestApplication, Logger } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/**
 * Protects <docsPath>, <docsPath>-json and <docsPath>-yaml with HTTP Basic Auth
 * using SWAGGER_USER / SWAGGER_PASSWORD.
 * Returns false when credentials are not configured — the caller must then skip mounting Swagger.
 */
export function protectSwagger(
  app: INestApplication,
  docsPath: string,
): boolean {
  const user = process.env.SWAGGER_USER?.trim();
  const pass = process.env.SWAGGER_PASSWORD;

  if (!user || !pass) {
    new Logger('Swagger').warn('SWAGGER_USER/SWAGGER_PASSWORD not set — Swagger docs disabled');
    return false;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const base = '/' + docsPath.replace(/^\/+/, '');
  app.use([base, `${base}-json`, `${base}-yaml`], (req: Request, res: Response, next: NextFunction) => {
    // In production, never prompt for credentials over plain HTTP (Basic Auth is only base64-encoded)
    if (isProduction && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      res.status(403).send('HTTPS required');
      return;
    }
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const [u, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
      if (safeEqual(u, user) && safeEqual(rest.join(':'), pass)) return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="API Docs"');
    res.status(401).send('Authentication required');
  });

  return true;
}
