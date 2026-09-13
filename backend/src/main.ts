import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { resolveMediaRoot } from './media/media-paths';

/** Expand one FRONTEND_URL into http/https + www/non-www variants. */
function expandFrontendOrigins(raw: string): string[] {
  const seeds = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = new Set<string>();

  for (const seed of seeds) {
    origins.add(seed);
    try {
      const url = new URL(seed);
      const host = url.hostname.replace(/^www\./i, '');
      for (const protocol of ['https:', 'http:'] as const) {
        origins.add(`${protocol}//${host}`);
        origins.add(`${protocol}//www.${host}`);
      }
    } catch {
      // keep raw seed only
    }
  }

  return [...origins];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  const frontendOrigins = expandFrontendOrigins(process.env.FRONTEND_URL ?? 'http://localhost:3000');
  const mediaRoot = resolveMediaRoot();

  // Serve uploaded media outside /api so URLs stay stable: /media/YYYY/MM/file.ext
  app.useStaticAssets(mediaRoot, {
    prefix: '/media/',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });

  app.setGlobalPrefix('api');
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.enableCors({
    // Always reflect the request origin when allowed.
    // Never pass a single hard-coded string — that forces one ACAO value and breaks http/www mismatches.
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (frontendOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      console.warn(`[CORS] blocked origin: ${requestOrigin}`);
      callback(new Error(`Not allowed by CORS: ${requestOrigin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  console.log(`[CORS] allowed origins: ${frontendOrigins.join(', ')}`);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MIG Industrial Group API')
    .setDescription('MIG product catalog and B2B platform API')
    .setVersion('0.1.0')
    .addTag('products')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port, host);
  console.log(`MIG API running on http://${host}:${port}/api`);
  console.log(`[Media] static files at http://${host}:${port}/media  root=${mediaRoot}`);
}

void bootstrap();
